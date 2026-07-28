import "server-only";
import type { Journey, JourneyStep, Language } from "@/lib/types";
import { getLifeEventById } from "@/lib/events";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  generateJourneyWithOpenAI,
  inferFulfillsId,
  inferPrerequisite,
  type GeneratedJourney,
} from "./openai-journey";
import { customEventId } from "@/lib/custom-event";
import { inferEligibility } from "@/lib/journey-eligibility";

/**
 * Cache-or-regenerate layer for AI-generated journey requirements. Staleness
 * is checked lazily on read (no cron): a cached row older than 24h triggers a
 * regeneration; anything else (missing config, OpenAI/Supabase errors) falls
 * back to the hand-written seed in `lib/event-journeys.ts` (preset events) or
 * a minimal empty journey (custom/free-text events, which have no seed) so
 * the app keeps working without any keys configured.
 */

const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

export interface JourneyResult {
  journey: Journey;
  regenerated: boolean;
  source: "cache" | "ai" | "seed";
}

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

function journeyId(eventId: string): string {
  return `ehakbang:journey:event:${eventId}`;
}

/**
 * Recompute derived, relational step fields at read time so cached rows (and
 * freshly generated ones) always reflect the latest logic — without waiting
 * for the 24h staleness window or wiping the cache. `fulfills_id` is
 * recomputed unconditionally (older cached rows wrongly tagged benefit claims,
 * which made the ID wallet auto-complete them); `prerequisite`/`eligibility`
 * are kept if already present, otherwise inferred.
 */
function decorateSteps(steps: JourneyStep[]): JourneyStep[] {
  return steps.map((step) => ({
    ...step,
    fulfills_id: inferFulfillsId(step),
    prerequisite: step.prerequisite ?? inferPrerequisite(step),
    eligibility: step.eligibility ?? inferEligibility(step),
  }));
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

interface RegenerateParams {
  eventId: string;
  lifeEvent: string;
  emoji: string;
  /** Derives the stored `life_event` label from the AI result (ignored for cache hits/failures, which already have their own label). */
  lifeEventLabel: (generated: GeneratedJourney) => string;
  language: Language;
  onFailure: () => JourneyResult;
}

/** Shared cache-check -> AI-generate -> Supabase-upsert flow for any event id (preset or custom). */
async function getOrRegenerate(params: RegenerateParams): Promise<JourneyResult> {
  const { eventId, lifeEvent, emoji, lifeEventLabel, language, onFailure } = params;
  try {
    const supabase = getSupabaseServerClient();
    const { data: existing } = await supabase
      .from("journey_requirements")
      .select(
        "event_id, language, emoji, life_event, summary, steps, total_steps, record_updates, benefit_claims, updated_at",
      )
      .eq("event_id", eventId)
      .eq("language", language)
      .maybeSingle<JourneyRequirementsRow>();

    if (existing) {
      const age = Date.now() - new Date(existing.updated_at).getTime();
      if (age < STALE_AFTER_MS) {
        return { journey: rowToJourney(existing, language), regenerated: false, source: "cache" };
      }
    }

    const generated = await generateJourneyWithOpenAI({ eventId, lifeEvent, language });
    const steps: JourneyStep[] = generated.steps.map((step, i) => ({
      ...step,
      step_number: i + 1,
    }));
    const row = {
      event_id: eventId,
      language,
      emoji,
      life_event: lifeEventLabel(generated),
      summary: generated.summary,
      steps,
      total_steps: steps.length,
      record_updates: steps.filter((s) => s.step_type === "record_update").length,
      benefit_claims: steps.filter((s) => s.step_type === "benefit_claim").length,
      model: generated.model,
      updated_at: new Date().toISOString(),
    };
    const { data: upserted, error } = await supabase
      .from("journey_requirements")
      .upsert(row, { onConflict: "event_id,language" })
      .select(
        "event_id, language, emoji, life_event, summary, steps, total_steps, record_updates, benefit_claims, updated_at",
      )
      .single<JourneyRequirementsRow>();
    if (error || !upserted) throw error ?? new Error("Upsert returned no row");

    return { journey: rowToJourney(upserted, language), regenerated: true, source: "ai" };
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error(`getOrRegenerate(${eventId}) failed, using fallback: ${message}`);
    return onFailure();
  }
}

export async function getOrRegenerateJourney(input: {
  eventId: string;
  language?: Language;
}): Promise<JourneyResult> {
  const language = input.language ?? "en";
  const event = getLifeEventById(input.eventId);
  if (!event) throw new Error(`Unknown life event: ${input.eventId}`);

  return getOrRegenerate({
    eventId: input.eventId,
    lifeEvent: event.description,
    emoji: event.emoji,
    lifeEventLabel: () => event.sublabel,
    language,
    onFailure: () => seedResult(input.eventId),
  });
}

const CUSTOM_EMOJI = "📋";
const MAX_LABEL_LENGTH = 80;

/**
 * Cache-or-regenerate for a free-text life event that didn't match any
 * preset (see `lib/server/classify-life-event.ts`). The cache key is derived
 * from `slug` when provided -- a canonical, wording-independent summary of
 * the situation from the classify step -- so two different phrasings of the
 * same context ("I got accepted as a PH rep for a tournament in the US" vs.
 * "I'll represent the Philippines in a US tournament") reuse the same 24h
 * cache row instead of triggering separate AI generations. Falls back to
 * hashing the raw text when no slug is available (e.g. a direct `?q=` link).
 * The journey's displayed title comes from the AI's own short summary of the
 * life event (`generated.title`) rather than the raw typed sentence.
 */
export async function getOrRegenerateCustomJourney(input: {
  text: string;
  slug?: string;
  language?: Language;
}): Promise<JourneyResult> {
  const language = input.language ?? "en";
  const text = input.text.trim();
  if (!text) throw new Error("text is required");
  const cacheKeySource = input.slug?.trim() || text;
  const eventId = customEventId(cacheKeySource);
  const fallbackLabel =
    text.length > MAX_LABEL_LENGTH ? `${text.slice(0, MAX_LABEL_LENGTH - 1)}…` : text;

  return getOrRegenerate({
    eventId,
    lifeEvent: text,
    emoji: CUSTOM_EMOJI,
    lifeEventLabel: (generated) => generated.title?.trim() || fallbackLabel,
    language,
    onFailure: () => emptyResult(eventId, CUSTOM_EMOJI, fallbackLabel, language),
  });
}
