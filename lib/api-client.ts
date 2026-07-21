import type { Journey, Language } from "./types";
import {
  MOCK_JOURNEYS,
  getActiveJourney,
  getArchivedJourneys,
  getJourneyById,
} from "./mock-data";

/**
 * Data-access layer — the SINGLE swap point between the UI and its data source.
 *
 * In the UI-only phase every function returns mock data. When the real
 * integrations land (see `/api/README.md`), reimplement these to call the
 * server route `/api/journey` (Claude) and the eGov catalog — the UI components
 * that consume these functions do not change.
 */

export interface GenerateJourneyInput {
  /** Free-text life-event description, or a predefined event's description. */
  lifeEvent: string;
  language?: Language;
  /** Optional predefined life-event id, when a card was tapped. */
  eventId?: string;
}

/**
 * Generate a journey for a life event.
 * TODO(api): POST to `/api/journey` (server route holding ANTHROPIC_API_KEY),
 * then resolve each step's `egov_url` via the eGov catalog.
 */
export async function generateJourney(
  _input: GenerateJourneyInput,
): Promise<Journey> {
  // Stub: return the active mock journey.
  return getActiveJourney() ?? MOCK_JOURNEYS[0];
}

/** Fetch a single journey by id (mock-backed for now). */
export async function fetchJourney(id: string): Promise<Journey | undefined> {
  return getJourneyById(id);
}

/** List all journeys — active first (mock-backed for now). */
export async function listJourneys(): Promise<Journey[]> {
  const active = getActiveJourney();
  return active ? [active, ...getArchivedJourneys()] : getArchivedJourneys();
}
