# eHakbang — *Hakbang sa Gobyerno*

> **"Your step-by-step government journey, now automated."**

eHakbang is a web-based, AI-powered **government journey planner and automation
assistant** for Filipino citizens. After a significant life event (getting married,
having a baby, losing a job, retiring, becoming a senior/PWD, starting a business, or
a death in the family), eHakbang:

1. **Generates** a fully ordered, personalized checklist of government steps — each with
   its reason, required documents, step type, and official link.
2. **Optionally automates** those steps end-to-end — pre-filling forms, paying fees,
   sending notifications, and producing verifiable receipts — through integrated
   **eGov PH APIs**.

Built for the **eGov PH Hackathon 2025** (DICT). See [`docs/EHakbang_PRD_v3.md`](docs/EHakbang_PRD_v3.md)
for the full product requirements.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Available Scripts](#available-scripts)
- [Dependencies](#dependencies)
- [Project Structure](#project-structure)
- [Database & Migrations (Supabase)](#database--migrations-supabase)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 19, Tailwind CSS 4 (`@tailwindcss/postcss`) |
| Auth & Data | [Supabase](https://supabase.com) (`@supabase/ssr`, `@supabase/supabase-js`) |
| AI | [OpenAI](https://platform.openai.com) SDK (life-event classification, ask-step) + **eGov AI** (journey requirements) |
| Government APIs | eGov SSO, eGovPay, eGov Liveness, eMessage |
| Bot protection | Cloudflare Turnstile |
| Image processing | `sharp` |
| Testing | [Vitest](https://vitest.dev) + Testing Library + jsdom |
| Linting | ESLint 9 (`eslint-config-next`) |
| Hosting (target) | Vercel |

> **Note on Next.js 16:** This project uses the current major of Next.js. Route
> middleware lives in [`proxy.ts`](proxy.ts) (the `proxy` export), not the legacy
> `middleware.ts`. Read the guides in `node_modules/next/dist/docs/` before changing
> framework-level conventions.

---

## Prerequisites

- **Node.js 20+** (matches `@types/node@^20`; Next.js 16 requires a modern LTS)
- **npm** (a `package-lock.json` is committed; other package managers will work but
  the lockfile is npm)
- A **Supabase** project (URL + anon key + service-role key)
- API credentials for the eGov integrations you intend to exercise (see
  [Environment Configuration](#environment-configuration)). Most integrations have a
  **mock / simulated** fallback for local development.

---

## Quick Start

```bash
# 1. Clone and install dependencies
git clone <repo-url>
cd eHakbang
npm install

# 2. Create your local environment file
cp .env.example .env.local
#    (Windows PowerShell)
#    Copy-Item .env.example .env.local

# 3. Fill in .env.local — see "Environment Configuration" below.
#    For a first run you can leave most secrets blank and rely on mock modes
#    (e.g. LIVENESS_MOCK=true), but Supabase values are required for auth.

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Configuration

All configuration is supplied via environment variables. Copy [`.env.example`](.env.example)
to `.env.local` and fill in the values. **`.env.local` is gitignored — never commit real
secrets.** Variables marked *(secret)* must come from the relevant provider/partner
dashboard and must never be exposed to the client.

Variables prefixed `NEXT_PUBLIC_` are inlined into the browser bundle and are safe to
expose; everything else is server-only.

### Supabase — auth + profiles *(required)*

Used by `lib/supabase/*`.

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public anon key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | *(secret)* Server-only key; **bypasses RLS** — never expose client-side |

### eGov SSO — "Continue with eGov"

Custom exchange-code flow. Used by `lib/server/egov-sso.ts`, `scripts/egov-sso-smoke.mjs`.

| Variable | Default | Description |
|---|---|---|
| `EGOV_SSO_BASE_URL` | `https://platforms-api.e.gov.ph/egov-sso` | SSO API base URL |
| `EGOV_SSO_PARTNER_CODE` | `TEST_AGENCY` | Partner code |
| `EGOV_SSO_PARTNER_SECRET` | — | *(secret)* Partner secret from the eGov partner dashboard; required to mint the token |
| `EGOV_SSO_AUTHORIZE_URL` | *(unset → dev stand-in page)* | Real eGov login redirect target |
| `EGOV_SSO_USE_CURL` | *(off)* | Experimental: route SSO calls through system `curl` to get past Cloudflare bot-block from datacenter IPs. Set `true` only where a `curl` binary exists |

### eGov AI — journey requirements

Used by `lib/server/egov-ai-journey.ts`. Exchanges the team access code for a
short-lived bearer token, then calls the AI assistant generate endpoint (category PH).
*Journey requirements use eGov AI, not OpenAI.*

| Variable | Description |
|---|---|
| `EGOV_AI_BASE_URL` | eGov AI API base URL |
| `EGOV_AI_ACCESS_CODE` | *(secret)* Hackathon/team access code from the eGov API portal |

### OpenAI — life-event classification / ask-step

Used by `lib/server/ask-step.ts`, `lib/server/classify-life-event.ts`.

| Variable | Default | Description |
|---|---|---|
| `OPENAI_API_KEY` | — | *(secret)* OpenAI API key |
| `OPENAI_ASK_STEP_MODEL` | `gpt-4.1-mini` | Model for the ask-step feature |
| `OPENAI_CLASSIFY_MODEL` | `gpt-4.1-mini` | Model for life-event classification |

### eGovPay — payment gateway

Used by `lib/server/egovpay.ts`. Set all three in the Vercel Production environment,
then redeploy. Paste either the bare portal key or `test_<key>` with no quotes/angle
brackets; the server normalizes a bare sandbox key to the required `test_<key>` header.

| Variable | Default | Description |
|---|---|---|
| `EGOVPAY_BASE_URL` | `https://platforms-api.e.gov.ph/egovpay` | eGovPay API base URL |
| `EGOVPAY_API_TOKEN` | — | *(secret)* Bare portal key or `test_<key>` |
| `EGOVPAY_SETTLEMENT_TEMPLATE_UUID` | — | Settlement template UUID |

### eGov Liveness — face / liveness check

Used by `lib/server/liveness.ts`, `app/api/liveness/session/route.ts`. The base URL
must include `/face-liveness`; a trailing slash is safe (normalized before appending
`/v1/liveness/*`).

| Variable | Default | Description |
|---|---|---|
| `EGOV_LIVENESS_BASE_URL` | `https://platforms-api.e.gov.ph/face-liveness` | Liveness API base URL |
| `EGOV_LIVENESS_API_KEY` | — | *(secret)* Liveness API key |
| `LIVENESS_MOCK` | `true` | Dev-only mock; **ignored in production** even when `true` |

### eMessage — notifications

Used by `lib/server/emessage.ts`.

| Variable | Description |
|---|---|
| `EMESSAGE_BASE_URL` | eMessage API base URL |
| `EMESSAGE_API_TOKEN` | *(secret)* eMessage API token |

### Cloudflare Turnstile — bot protection

Used by `components/auth/TurnstileWidget.tsx`.

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile site key |

---

## Available Scripts

Defined in [`package.json`](package.json):

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `next dev` | Start the local development server (http://localhost:3000) |
| `npm run build` | `next build` | Production build |
| `npm start` | `next start` | Serve the production build (run `build` first) |
| `npm run lint` | `eslint` | Lint the codebase |
| `npm test` | `vitest run` | Run the test suite once |
| `npm run test:watch` | `vitest` | Run tests in watch mode |
| `npm run egov:sso` | `node --env-file=.env.local scripts/egov-sso-smoke.mjs` | eGov SSO smoke test against your `.env.local` credentials |

---

## Dependencies

### Runtime (`dependencies`)

| Package | Version | Purpose |
|---|---|---|
| `next` | `16.2.10` | React framework (App Router) |
| `react` | `19.2.4` | UI library |
| `react-dom` | `19.2.4` | React DOM renderer |
| `@supabase/ssr` | `^0.12.3` | Supabase auth/session helpers for SSR |
| `@supabase/supabase-js` | `^2.110.8` | Supabase client SDK |
| `openai` | `^6.49.0` | OpenAI SDK (classification / ask-step) |
| `server-only` | `^0.0.1` | Guard to keep server code out of client bundles |

### Development (`devDependencies`)

| Package | Version | Purpose |
|---|---|---|
| `typescript` | `^5` | TypeScript compiler |
| `@types/node` | `^20` | Node type definitions |
| `@types/react`, `@types/react-dom` | `^19` | React type definitions |
| `tailwindcss` | `^4` | Utility-first CSS |
| `@tailwindcss/postcss` | `^4` | Tailwind PostCSS plugin |
| `eslint` | `^9` | Linter |
| `eslint-config-next` | `16.2.10` | Next.js ESLint rules |
| `vitest` | `^3.2.7` | Test runner |
| `@vitejs/plugin-react` | `^4.7.0` | React support for Vitest |
| `vite-tsconfig-paths` | `^5.1.4` | Resolve `@/*` path aliases in tests |
| `@testing-library/react` | `^16.3.2` | React component testing |
| `@testing-library/dom` | `^10.4.1` | DOM testing utilities |
| `@testing-library/jest-dom` | `^6.9.1` | Custom DOM matchers |
| `jsdom` | `^25.0.1` | DOM environment for tests |
| `sharp` | `^0.33.5` | Image processing (Next.js image optimization) |

Install everything with `npm install` (uses the committed `package-lock.json`).

---

## Project Structure

```
eHakbang/
├── app/                        # Next.js App Router
│   ├── (app)/                  # Authenticated app shell (home, journeys, wallet, track, account…)
│   ├── (auth)/                 # Login, register, terms
│   ├── api/                    # Route handlers
│   │   ├── ask-step/           # AI "ask about this step"
│   │   ├── journey/            # Journey generation + life-event classify
│   │   ├── liveness/           # Face/liveness session + result
│   │   ├── notifications/      # Step-update notifications (eMessage)
│   │   └── payment/            # eGovPay create / status / webhook
│   ├── actions/                # Server actions (auth, egov)
│   ├── auth/                   # eGov SSO start + OAuth callback
│   ├── layout.tsx / globals.css
├── components/                 # UI components grouped by domain
│   ├── auth/ egov/ ehakbang/ journey/ track/ wallet/ verification/ layout/ …
├── lib/                        # Core logic
│   ├── server/                 # Server-only integrations (egov-sso, egovpay, liveness,
│   │                           #   emessage, egov-ai-journey, journey-requirements, …)
│   ├── supabase/               # Supabase client/server/proxy helpers
│   ├── validation/             # Zod-style input validation (auth, …)
│   ├── journey-*.ts            # Journey engine (eligibility, fees, fields, sync, store…)
│   └── *.test.ts               # Co-located unit tests
├── supabase/migrations/        # SQL migrations (profiles, journeys, id_wallets, RLS…)
├── scripts/                    # Dev/ops scripts (egov-sso smoke test, session check)
├── docs/                       # PRD, API reference, plan
├── proxy.ts                    # Next.js route middleware (Supabase session refresh)
├── next.config.ts              # Next.js config
├── tsconfig.json               # TS config (strict; `@/*` → project root)
├── vitest.config.mts           # Vitest config (jsdom, globals, path aliases)
├── postcss.config.mjs          # PostCSS/Tailwind config
├── eslint.config.mjs           # ESLint flat config
└── .env.example                # Environment template
```

Path alias: `@/*` maps to the project root (see `tsconfig.json` and `vitest.config.mts`).

---

## Database & Migrations (Supabase)

SQL migrations live in [`supabase/migrations/`](supabase/migrations) and cover:

- `profiles` and profile **row-level security (RLS)**
- `journeys` (user-scoped IDs) and `journey_requirements`
- `id_wallets`

Apply them with the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push        # apply migrations to the linked project
```

An MCP server for Supabase is configured in [`.mcp.json`](.mcp.json) for tooling that
supports it. A session-check helper is available at
[`scripts/supabase-session-check.mjs`](scripts/supabase-session-check.mjs).

---

## Testing

Tests use **Vitest** with the **jsdom** environment and Testing Library. Test files are
co-located with source as `*.test.ts` / `*.test.tsx`. Global setup is in
[`vitest.setup.ts`](vitest.setup.ts).

```bash
npm test          # run once
npm run test:watch  # watch mode
```

---

## Deployment

The project targets **Vercel**.

1. Set **all** required environment variables in the Vercel project settings
   (Production and Preview as appropriate). Secrets must be configured server-side —
   only `NEXT_PUBLIC_*` values are exposed to the browser.
2. For eGovPay and eGov Liveness, set their values in the **Production** environment and
   **redeploy** for changes to take effect.
3. `LIVENESS_MOCK` is ignored in production, so a real `EGOV_LIVENESS_API_KEY` is
   required there.

> ⚠️ **Security:** `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and all other *(secret)*
> keys grant access to partner/government APIs. Store them only in your secret manager
> / Vercel env — never in the repo or client bundle.

---

## Troubleshooting

- **Auth doesn't work locally** — confirm `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are set in
  `.env.local`, then restart `npm run dev`.
- **eGov SSO fails from a datacenter IP (e.g. Vercel)** — eGov's Cloudflare may block
  datacenter fetches; try `EGOV_SSO_USE_CURL=true` where a `curl` binary exists.
- **Liveness returns mock data unexpectedly** — `LIVENESS_MOCK=true` is only honored
  outside production; in production supply a real `EGOV_LIVENESS_API_KEY`.
- **eGovPay 401 / header errors** — paste the key with no quotes or angle brackets; a
  bare sandbox key is normalized to the `test_<key>` header automatically.
- **Verify eGov SSO credentials** — run `npm run egov:sso`.
