import "server-only";
import type { Journey, JourneyStep, Language } from "@/lib/types";
import { getLifeEventById } from "@/lib/events";
import { getJourneyByEventId } from "@/lib/event-journeys";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { generateJourneyWithOpenAI } from "./openai-journey";

/**
 * Cache-or-regenerate layer for AI-generated journey requirements. Staleness
 * is checked lazily on read (no cron): a cached row older than 24h triggers a
 * regeneration; anything else (missing config, OpenAI/Supabase errors) falls
 * back to the hand-written seed in `lib/event-journeys.ts` so the app keeps
 * working without any keys configured.
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
    steps: row.steps,
    status: "active",
    language,
    created_at: row.updated_at,
    completed_at: null,
    completed_step_numbers: [],
    paid_step_numbers: [],
  };
}

function seedResult(eventId: string): JourneyResult {
  const journey = getJourneyByEventId(eventId);
  if (!journey) throw new Error(`Unknown life event: ${eventId}`);
  return { journey, regenerated: false, source: "seed" };
}

export async function getOrRegenerateJourney(input: {
  eventId: string;
  language?: Language;
}): Promise<JourneyResult> {
  const language = input.language ?? "en";
  const event = getLifeEventById(input.eventId);
  if (!event) throw new Error(`Unknown life event: ${input.eventId}`);

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
      if (age < STALE_AFTER_MS) {
        return { journey: rowToJourney(existing, language), regenerated: false, source: "cache" };
      }
    }

    const generated = await generateJourneyWithOpenAI({
      eventId: input.eventId,
      lifeEvent: event.description,
      language,
    });
    const steps: JourneyStep[] = generated.steps.map((step, i) => ({
      ...step,
      step_number: i + 1,
    }));
    const row = {
      event_id: input.eventId,
      language,
      emoji: event.emoji,
      life_event: event.sublabel,
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
    console.error(`getOrRegenerateJourney(${input.eventId}) failed, using seed fallback: ${message}`);
    return seedResult(input.eventId);
  }
}
