import "server-only";
import type { IdType, Journey, JourneyStep, Language } from "@/lib/types";
import { getLifeEventById } from "@/lib/events";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateJourneyWithEgovAI,
  inferFulfillsId,
  inferPrerequisite,
  type GeneratedJourney,
} from "./egov-ai-journey";
import { customEventId } from "@/lib/custom-event";
import { inferEligibility } from "@/lib/journey-eligibility";
import { hasUsableJourneySteps } from "@/lib/journey-validity";

/**
 * Cache-or-regenerate layer for AI-generated journey requirements. Staleness
 * is checked lazily on read (no cron): a cached row older than 24h triggers a
 * regeneration; anything else (missing config, eGov AI/Supabase errors) falls
 * back to the hand-written seed in `lib/event-journeys.ts` (preset events) or
 * a minimal empty journey (custom/free-text events, which have no seed) so
 * the app keeps working without any keys configured.
 *
 * The cache is keyed by (event_id, language) — NOT per-user. Steps are
 * universal; personalization (which steps are gated/locked/auto-completed)
 * happens at display time via the wallet + prerequisite + eligibility layer.
 */

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

interface JourneyRequirementsRow {
  event_id: string;
  language: string;
  emoji: string;
  life_event: string;
  summary: string;
  steps: JourneyStep[];
  total_steps: number;
  record_updates: number;
  benefit_claims: number;
  updated_at: string;
}

function rowToJourney(row: JourneyRequirementsRow, language: Language): Journey {
  return {
    id: journeyId(row.event_id),
    event_id: row.event_id,
    emoji: row.emoji,
    life_event: row.life_event,
    summary: row.summary,
    total_steps: row.total_steps,
    record_updates: row.record_updates,
    benefit_claims: row.benefit_claims,
    steps: decorateSteps(row.steps),
    status: "active",
    language,
    created_at: row.updated_at,
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
    field_answers: {},
    auto_applied_step_numbers: [],
    claimed_step_numbers: [],
  };
}

export interface JourneyResult {
  journey: Journey;
  /** True when this came from a fresh AI generation; false when it fell back to the seed/empty journey. */
  regenerated: boolean;
  source: "ai" | "seed";
  /**
   * Whether this life event needs supporting evidence before proceeding
   * (see `app/journey/start/page.tsx`'s custom-event intake gate). Only
   * meaningful when `source` is "ai" -- undefined on a seed/empty fallback,
   * since there's nothing confident to gate.
   */
  requiresEvidence?: boolean;
  evidenceTitle?: string | null;
  evidenceDescription?: string | null;
}

/** Stable journey id for an event, shared with `lib/server/stored-journeys.ts`'s lookup key. */
export function journeyId(eventId: string): string {
  return `ehakbang:journey:event:${eventId}`;
}

/** Fills in derived, relational step fields the model doesn't reliably set itself. */
function decorateSteps(steps: JourneyStep[]): JourneyStep[] {
  return steps.map((step) => ({
    ...step,
    fulfills_id: inferFulfillsId(step),
    prerequisite: step.prerequisite ?? inferPrerequisite(step),
    eligibility: step.eligibility ?? inferEligibility(step),
  }));
}

function seedResult(eventId: string): JourneyResult {
  const journey = getJourneyByEventId(eventId);
  if (!journey) throw new Error(`Unknown life event: ${eventId}`);
  return { journey, regenerated: false, source: "seed" };
}

/** Generic empty-checklist fallback for custom events, which have no hand-written seed. */
function emptyResult(
  eventId: string,
  emoji: string,
  lifeEvent: string,
  language: Language,
): JourneyResult {
  return {
    journey: {
      id: journeyId(eventId),
      event_id: eventId,
      emoji,
      life_event: lifeEvent,
      summary:
        "We couldn't generate a checklist for this right now. Please try again in a moment.",
      total_steps: 0,
      record_updates: 0,
      benefit_claims: 0,
      steps: [],
      status: "active",
      language,
      created_at: new Date().toISOString(),
      completed_at: null,
      completed_step_numbers: [],
      paid_step_numbers: [],
      field_answers: {},
      auto_applied_step_numbers: [],
      claimed_step_numbers: [],
    },
    regenerated: false,
    source: "seed",
  };
}

interface GenerateParams {
  eventId: string;
  lifeEvent: string;
  emoji: string;
  /** Derives the journey's `life_event` label from the AI result. */
  lifeEventLabel: (generated: GeneratedJourney) => string;
  language: Language;
  heldIds: IdType[];
  onFailure: () => JourneyResult;
}

/** Shared AI-generate flow for any event id (preset or custom). */
async function generateFresh(params: GenerateParams): Promise<JourneyResult> {
  const { eventId, lifeEvent, emoji, lifeEventLabel, language, heldIds, onFailure } = params;
  try {
    const generated = await generateJourneyWithEgovAI({ eventId, lifeEvent, language, heldIds });
    if (generated.steps.length === 0) {
      throw new Error("eGov AI returned no usable journey steps");
    }
    const steps: JourneyStep[] = decorateSteps(
      generated.steps.map((step, i) => ({ ...step, step_number: i + 1 })),
    );

    const journey: Journey = {
      id: journeyId(eventId),
      event_id: eventId,
      emoji,
      life_event: lifeEventLabel(generated),
      summary: generated.summary,
      total_steps: steps.length,
      record_updates: steps.filter((s) => s.step_type === "record_update").length,
      benefit_claims: steps.filter((s) => s.step_type === "benefit_claim").length,
      steps,
      status: "active",
      language,
      created_at: new Date().toISOString(),
      completed_at: null,
      completed_step_numbers: [],
      paid_step_numbers: [],
      field_answers: {},
      auto_applied_step_numbers: [],
      claimed_step_numbers: [],
    };

    return {
      journey,
      regenerated: true,
      source: "ai",
      requiresEvidence: generated.requires_evidence,
      evidenceTitle: generated.evidence_title,
      evidenceDescription: generated.evidence_description,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.warn(`generateFresh(${eventId}) failed, using fallback: ${message}`);
    return onFailure();
  }
}

export async function getOrRegenerateJourney(input: {
  eventId: string;
  language?: Language;
  /** Citizen's currently held IDs (see `lib/server/id-wallet.ts`), so generation can personalize which record-update steps apply. Defaults to none. */
  heldIds?: IdType[];
}): Promise<JourneyResult> {
  const language = input.language ?? "en";
  const event = getLifeEventById(input.eventId);
  if (!event) throw new Error(`Unknown life event: ${input.eventId}`);

  // --- 1. Try Supabase cache ---
  try {
    const supabase = getSupabaseServerClient();
    const { data: existing } = await supabase
      .from("journey_requirements")
      .select(
        "event_id, language, emoji, life_event, summary, steps, total_steps, record_updates, benefit_claims, updated_at",
      )
      .eq("event_id", input.eventId)
      .eq("language", language)
      .maybeSingle<JourneyRequirementsRow>();

    if (existing) {
      const age = Date.now() - new Date(existing.updated_at).getTime();
      if (age < STALE_AFTER_MS && hasUsableJourneySteps(existing)) {
        return {
          journey: rowToJourney(existing, language),
          regenerated: false,
          source: "ai",
        };
      }
    }

    // --- 2. Generate fresh (stale or missing) ---
    const result = await generateFresh({
      eventId: input.eventId,
      lifeEvent: event.description,
      emoji: event.emoji,
      lifeEventLabel: () => event.sublabel,
      language,
      heldIds: input.heldIds ?? [],
      onFailure: () => seedResult(input.eventId),
    });

    // --- 3. Upsert the generated journey into the cache ---
    if (result.source === "ai") {
      const row = {
        event_id: input.eventId,
        language,
        emoji: event.emoji,
        life_event: event.sublabel,
        summary: result.journey.summary,
        steps: result.journey.steps,
        total_steps: result.journey.total_steps,
        record_updates: result.journey.record_updates,
        benefit_claims: result.journey.benefit_claims,
        model: "egov-ai-assistant",
        updated_at: new Date().toISOString(),
      };
      await supabase
        .from("journey_requirements")
        .upsert(row, { onConflict: "event_id,language" });
    }

    return result;
  } catch (err) {
    // Supabase not configured or unreachable — generate directly, no cache.
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.warn(`getOrRegenerateJourney(${input.eventId}) cache layer failed: ${message}`);
    return generateFresh({
      eventId: input.eventId,
      lifeEvent: event.description,
      emoji: event.emoji,
      lifeEventLabel: () => event.sublabel,
      language,
      heldIds: input.heldIds ?? [],
      onFailure: () => seedResult(input.eventId),
    });
  }
}

const CUSTOM_EMOJI = "📋";
const MAX_LABEL_LENGTH = 80;

/**
 * AI generation for a free-text life event that didn't match any preset
 * (see `lib/server/classify-life-event.ts`). The event id is still derived
 * from `slug` when provided (a canonical, wording-independent summary of the
 * situation from the classify step) so two different phrasings of the same
 * context reuse the same stable journey id client-side -- that id is what
 * lets `lib/journey-store.ts` recognize "this is the journey I already
 * started" and preserve local progress instead of it looking brand new on
 * every visit, even though the content itself is regenerated fresh each
 * time. Falls back to hashing the raw text when no slug is available (e.g. a
 * direct `?q=` link). The journey's displayed title comes from the AI's own
 * short summary of the life event (`generated.title`) rather than the raw
 * typed sentence.
 */
export async function getOrRegenerateCustomJourney(input: {
  text: string;
  slug?: string;
  language?: Language;
  heldIds?: IdType[];
}): Promise<JourneyResult> {
  const language = input.language ?? "en";
  const text = input.text.trim();
  if (!text) throw new Error("text is required");
  const cacheKeySource = input.slug?.trim() || text;
  const eventId = customEventId(cacheKeySource);
  const fallbackLabel =
    text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}…` : text;

  return generateFresh({
    eventId,
    lifeEvent: text,
    emoji: CUSTOM_EMOJI,
    lifeEventLabel: (generated) => generated.title?.trim() || fallbackLabel,
    language,
    heldIds: input.heldIds ?? [],
    onFailure: () => emptyResult(eventId, CUSTOM_EMOJI, fallbackLabel, language),
  });
}
