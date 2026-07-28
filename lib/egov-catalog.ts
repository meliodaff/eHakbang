import type { JourneyStep } from "./types";

/**
 * Curated eGov service catalog — the single place that maps a journey step to
 * the correct official Philippine government destination for its "Go to
 * Official Service" CTA.
 *
 * WHY CURATED (not an API): there is no live eGov service-catalog API to query
 * yet. Rather than block the feature or let the AI invent (and hallucinate)
 * URLs, we maintain a small, verifiable map of official `.gov.ph` sites. This
 * function is the single swap point: the day a real catalog API exists, only
 * the internals of {@link resolveOfficialService} change — the UI never does
 * (mirrors the app's api-client philosophy and PRD NFR-10 config-swap).
 *
 * SAFETY: destinations are official `.gov.ph` domains only; steps that aren't
 * national eGov services (banks, employers, etc.) resolve to a plain hint
 * rather than a misleading link; nothing ever resolves to "#".
 */

/** National portal — the safe fallback for an unrecognized government agency. */
export const OFFICIAL_FALLBACK_URL = "https://www.gov.ph/";

interface AgencyEntry {
  url: string;
  /** Display domain shown as a trust cue on the CTA. */
  domain: string;
}

/** Canonical agency code → official homepage / online-service landing. */
const AGENCY_CATALOG: Record<string, AgencyEntry> = {
  SSS: { url: "https://www.sss.gov.ph/", domain: "sss.gov.ph" },
  PHILHEALTH: { url: "https://www.philhealth.gov.ph/", domain: "philhealth.gov.ph" },
  PAGIBIG: { url: "https://www.pagibigfund.gov.ph/", domain: "pagibigfund.gov.ph" },
  BIR: { url: "https://www.bir.gov.ph/", domain: "bir.gov.ph" },
  PSA: { url: "https://psa.gov.ph/", domain: "psa.gov.ph" },
  PHILSYS: { url: "https://philsys.gov.ph/", domain: "philsys.gov.ph" },
  DFA: { url: "https://dfa.gov.ph/", domain: "dfa.gov.ph" },
  LTO: { url: "https://lto.gov.ph/", domain: "lto.gov.ph" },
  COMELEC: { url: "https://comelec.gov.ph/", domain: "comelec.gov.ph" },
  GSIS: { url: "https://www.gsis.gov.ph/", domain: "gsis.gov.ph" },
  DSWD: { url: "https://www.dswd.gov.ph/", domain: "dswd.gov.ph" },
  DOLE: { url: "https://www.dole.gov.ph/", domain: "dole.gov.ph" },
  PRC: { url: "https://www.prc.gov.ph/", domain: "prc.gov.ph" },
  OWWA: { url: "https://owwa.gov.ph/", domain: "owwa.gov.ph" },
  NBI: { url: "https://nbi.gov.ph/", domain: "nbi.gov.ph" },
  DOH: { url: "https://doh.gov.ph/", domain: "doh.gov.ph" },
};

/** Common agency-code variants the AI/cache may emit → canonical code. */
const AGENCY_ALIASES: Record<string, string> = {
  PHIC: "PHILHEALTH",
  PHILHEALTHINSURANCE: "PHILHEALTH",
  HDMF: "PAGIBIG",
  PAGIBIGFUND: "PAGIBIG",
  HOMEDEVELOPMENTMUTUALFUND: "PAGIBIG",
  PHLSYS: "PHILSYS",
  PSAPHILSYS: "PHILSYS",
  LCRO: "PSA", // Local Civil Registry — route to PSA as the national anchor.
  LCR: "PSA",
  BUREAUOFINTERNALREVENUE: "BIR",
};

/**
 * A few high-value, stable service deep links (official `.gov.ph` only),
 * matched by keywords in the step's service name / search term. Kept small on
 * purpose — deep links rot faster than homepages.
 */
const SERVICE_DEEPLINKS: Array<{
  agency: string;
  match: RegExp;
  url: string;
  domain: string;
}> = [
  { agency: "DFA", match: /passport/i, url: "https://www.passport.gov.ph/", domain: "passport.gov.ph" },
  { agency: "LTO", match: /license|ltms|driver/i, url: "https://portal.lto.gov.ph/", domain: "portal.lto.gov.ph" },
];

/** Steps handled outside national eGov services (private / local, no gov URL). */
const NON_GOV_RE =
  /\b(bank|banks|employer|employers|\bhr\b|human resources|private|company|companies|insurance|landlord|school|university|utility|telco)\b/i;

/** What the "Go to Official Service" CTA should do for a step. */
export type OfficialServiceTarget =
  | { kind: "link"; url: string; domain: string }
  | { kind: "hint" };

function normalizeAgencyCode(code: string): string {
  const c = code.toUpperCase().replace(/[^A-Z]/g, "");
  return AGENCY_ALIASES[c] ?? c;
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

type StepInput = Pick<
  JourneyStep,
  "agency_code" | "agency_name" | "egov_url" | "egov_service_name" | "egov_search_term"
>;

/**
 * Resolve the official destination for a step's CTA. Priority:
 * 1. an explicit `egov_url` (future AI/catalog value),
 * 2. a hint for clearly non-government steps,
 * 3. a curated service deep link,
 * 4. the agency's official site by (normalized) code,
 * 5. the national portal fallback.
 */
export function resolveOfficialService(step: StepInput): OfficialServiceTarget {
  if (step.egov_url) {
    return { kind: "link", url: step.egov_url, domain: domainOf(step.egov_url) };
  }

  if (NON_GOV_RE.test(step.agency_name) || NON_GOV_RE.test(step.agency_code)) {
    return { kind: "hint" };
  }

  const code = normalizeAgencyCode(step.agency_code);

  const deep = SERVICE_DEEPLINKS.find(
    (d) =>
      d.agency === code &&
      (d.match.test(step.egov_service_name) || d.match.test(step.egov_search_term)),
  );
  if (deep) return { kind: "link", url: deep.url, domain: deep.domain };

  const entry = AGENCY_CATALOG[code];
  if (entry) return { kind: "link", url: entry.url, domain: entry.domain };

  return { kind: "link", url: OFFICIAL_FALLBACK_URL, domain: "gov.ph" };
}

/** Plain-URL variant for secondary links that always need an href. */
export function resolveOfficialUrl(step: StepInput): string {
  const target = resolveOfficialService(step);
  return target.kind === "link" ? target.url : OFFICIAL_FALLBACK_URL;
}
