# API Integration (Scaffold)

This folder is a **placeholder** for the real API integration. The current app
is UI-only and reads mock journeys through `lib/api-client.ts` — that module is
the single swap point. When the integrations below are ready, implement them and
point `api-client.ts` at them; **no UI component needs to change.**

## 1. Claude (journey generation) — `claude/`

Generates a journey from a life-event description (PRD §9.1).

- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Model:** `claude-sonnet-4-6`
- **Tool:** `web_search_20250305` (search official `.gov.ph` sites before answering)
- **Output:** strict JSON matching the `JourneyStep` / journey shape in
  `lib/types.ts` (PRD §9.1.2).

### ⚠️ Security — do NOT ship the API key to the browser (PRD risk R-07)

The Anthropic key must never appear in client-side code. Implement the call as a
**server-side Route Handler** so the key stays on the server:

```
app/api/journey/route.ts   →  POST { lifeEvent, language } → Journey JSON
```

Store the key in a server-only env var (`ANTHROPIC_API_KEY`, no `NEXT_PUBLIC_`
prefix). The client calls our own `/api/journey` route, which calls Anthropic.

## 2. eGov PH Service Catalog — `egov/`

Resolves the official service URL for each step (PRD §9.2).

- **Input:** `egov_search_term` from each generated step.
- **Output:** official service URL → sets `JourneyStep.egov_url`.
- **Fallback:** if no result, fall back to the agency homepage (silent, no
  user-facing error). The "Go to Official Service" button label may change to
  "Visit [Agency] Website".

## Data flow (target)

```
UI (SearchInput / EventCardGrid)
  → lib/api-client.ts (generateJourney)
    → POST /api/journey  (server route; holds ANTHROPIC_API_KEY)
      → Anthropic Claude API (+ web_search)
    → for each step: eGov catalog lookup → egov_url
  → Journey JSON → rendered by existing components
```

## Error handling (PRD §9.3)

| Scenario | Behavior |
| --- | --- |
| Claude timeout (>10s) | "We're having trouble generating your journey. Please try again." |
| Claude rate limit | retry once after 2s, then show busy message |
| Invalid JSON | attempt repair, else show error |
| eGov no result | agency homepage fallback (silent) |
| localStorage write fails | keep state in memory; soft warning |
