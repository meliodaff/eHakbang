# Claude Journey Generation (placeholder)

Implement the server-side journey generator here (or in
`app/api/journey/route.ts`). See `../README.md` for the full contract.

Checklist when implementing:

- [ ] Read `ANTHROPIC_API_KEY` from a **server-only** env var (never `NEXT_PUBLIC_`).
- [ ] Send the system prompt from PRD §9.1.1 (constrain to PH `.gov.ph` sources).
- [ ] Enable the `web_search_20250305` tool.
- [ ] Request strict JSON; validate against `lib/types.ts` before returning.
- [ ] Include the selected language: "Respond in [Filipino|English]".
- [ ] Never state peso amounts/eligibility unless confirmed by live search.
