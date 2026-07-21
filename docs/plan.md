# Implementation Plan — eHakbang UI (eGovPH-style clone)

## Problem Statement
Build the front-end interface for eHakbang inside the existing Next.js directory, styled as a faithful clone of the eGovPH super app. Scope: all 4 PRD screens, UI-only with mock data, plus a scaffolded (empty, ready-to-fill) API integration folder. No real Claude/eGov calls yet.

## Requirements (confirmed with user)
1. Faithful eGovPH clone — government-blue aesthetic, card/tile layout, mobile-first, bottom tab navigation.
2. All 4 screens — Landing/Life Event Input, Journey Steps, Journey Complete, My Journeys Archive.
3. UI only with mock/hardcoded journey data, but create a prepared folder structure for future API integration (Claude + eGov proxy).

## Background / Findings
- Stack: Next.js 16.2.10 (App Router), React 19, Tailwind CSS 4, TypeScript. Currently just default create-next-app boilerplate.
- AGENTS.md warns this Next.js version has breaking changes — consult node_modules/next/dist/docs/ before writing framework-specific code.
- Ignore the design-system-rules.md steering file (dark-purple "Raffy Portfolio") — it conflicts with the eGov look.
- eGovPH design language to replicate:
  - Palette: Philippine-flag-derived blues — primary royal blue #0D47A1 / #1560BD, deep navy #0038A8, red accent #CE1126, yellow accent #FCD116, white surfaces, light grey background #F4F6F9.
  - Layout: blue gradient dashboard header with greeting, rounded white cards with soft shadows, colorful rounded-square icon tiles in a grid, sticky bottom tab bar.
  - Type: clean sans-serif (Geist/Inter), large legible sizes (senior-friendly per PRD NFR-03).
  - Feel: friendly, rounded (rounded-2xl), soft elevation, generous touch targets (48px+).

## Design

### Screen ↔ Route map
- / → Landing + Life Event Input → (Generate Journey) → /journey Journey Steps
- /journey → (all steps done) → /journey/complete Journey Complete
- /journey/complete → (Archive / View) → /journeys My Journeys Archive
- /journeys → (Continue) → /journey ; (Start New) → /
- Bottom Tab Bar: Home · My Journeys · About

### eGov-style component inventory
- AppShell — mobile-frame container (max-w-md, centered on desktop), blue status-bar-style top, bottom tab bar.
- DashboardHeader — blue gradient header with greeting, tagline, "no personal data" note.
- BottomTabBar — Home / My Journeys / About, active state in blue.
- SearchInput — hero life-event text field (auto-focused) + "Generate My Journey" button.
- EventCard / EventCardGrid — 8 predefined life-event tiles (emoji, Filipino label, English sublabel), 2-col mobile grid, "More events" expansion.
- ProgressBar — sticky, "X of Y steps complete", blue→green fill.
- StepCard — number badge, agency, StepTypeBadge, title, reason, document list, time estimate, note, "Go to Official Service" + "Mark as Done", collapsible "Ask about this step".
- StepTypeBadge — blue "Record Update" (doc icon) / green "Benefit Claim" (currency icon).
- DisclaimerBox — amber warning box for benefit claims.
- JourneySummaryHeader — event label, summary, count badges.
- CompletionCard — celebration state (green check, totals, date).
- JourneyListItem — archive row (emoji, label, status badge, date, Continue/View).
- LanguageToggle — FIL/EN (UI stub, persists to localStorage later).

### Folder structure
```
app/
├── layout.tsx                # fonts + AppShell wrapper
├── globals.css               # eGov design tokens (@theme)
├── page.tsx                  # Screen 1: Landing
├── journey/
│   ├── page.tsx              # Screen 2: Journey Steps
│   └── complete/page.tsx     # Screen 3: Journey Complete
└── journeys/page.tsx         # Screen 4: My Journeys Archive
components/
├── layout/ (AppShell, DashboardHeader, BottomTabBar)
├── input/  (SearchInput, EventCard, EventCardGrid, LanguageToggle)
├── journey/(StepCard, StepTypeBadge, DisclaimerBox, ProgressBar,
│            JourneySummaryHeader, AskAboutStep)
└── archive/(CompletionCard, JourneyListItem)
lib/
├── types.ts                  # Journey/Step interfaces (matches PRD §9.1.2 schema)
├── mock-data.ts              # Sample journeys (e.g. "Had a Baby", "Got Married")
└── events.ts                 # 8 predefined life events
api/                          # ← scaffolded for later, not wired
├── README.md                 # integration notes (Claude proxy, eGov catalog)
├── claude/                   # placeholder for serverless proxy route
└── egov/                     # placeholder for service-catalog client
```
Note: the real Claude call will live in a server route (e.g. app/api/journey/route.ts) to avoid PRD risk R-07 (client-side key exposure). This round only creates the placeholder folder + notes.

### Testing approach
Set up Vitest + React Testing Library (standard, lightweight). Tests focus on rendering and prop-driven behavior of key components; not exhaustive. Each task ends with a runnable, viewable increment.

## Task Breakdown
1. Foundation — design tokens, fonts, and test setup. Replace boilerplate globals.css with eGovPH tokens via Tailwind 4 @theme; configure fonts + metadata in layout.tsx; add Vitest + RTL. Demo: dev shows correct bg color/font; tests pass.
2. App shell + bottom tab navigation. AppShell (centered mobile frame) + BottomTabBar wired into layout.tsx; placeholder routes. Demo: mobile frame with working bottom tabs.
3. Data layer — types, events, mock journeys. lib/types.ts (mirror PRD §9.1.2), lib/events.ts (8 events), lib/mock-data.ts (2 full journeys incl. "Had a Baby" with benefit-claim steps). Demo: typed importable data.
4. Screen 1 — Landing & Life Event Input. DashboardHeader, SearchInput, EventCard, EventCardGrid (2-col + More events), no-personal-data note; selecting card/submitting routes to /journey. Demo: eGov-style landing routes to journey.
5. Screen 2 — Journey Steps. JourneySummaryHeader, sticky ProgressBar, StepTypeBadge, DisclaimerBox, StepCard (all PRD fields + Go to Official Service + Mark as Done), collapsible AskAboutStep stub; local completion state; live progress; amber disclaimer on benefit claims. Demo: scrollable journey, progress advances.
6. Screen 3 — Journey Complete. CompletionCard (green check, event title, totals, date) + Archive/Start New; reached when all steps complete. Demo: completing steps leads to celebration screen.
7. Screen 4 — My Journeys Archive. JourneyListItem + /journeys list (active + archived, status badge, date, Continue/View), Start New + Clear All (UI only). Demo: archive lists journeys, navigation works.
8. API integration scaffold + polish. api/ folder with README (Claude proxy + eGov catalog, ref PRD §9 + R-07), empty claude/ and egov/ placeholders, typed lib/api-client.ts stub returning mock data (single swap point). Final pass: consistent styling, LanguageToggle stub, accessibility (labels, 48px targets, focus rings), full build + tests. Demo: complete 4-screen clickable prototype + ready-to-fill API folder.
