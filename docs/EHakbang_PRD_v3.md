# eHakbang — Product Requirements Document

**Electronic — Hakbang sa Gobyerno**
*"Your step-by-step government journey, now automated."*

| | |
|---|---|
| **Document Type** | Product Requirements Document (PRD) |
| **Product Name** | eHakbang |
| **Version** | 3.0 — Automation Update (supersedes v2.0) |
| **Status** | ACTIVE — For Team Development |
| **Platform** | Web Application (Mobile-First) |
| **Event** | eGov PH Hackathon 2025 |
| **Submitted To** | DICT — Department of Information and Communications Technology |

> **What changed from v2.0:** v2.0 defined eHakbang as a *guide* that generates an ordered checklist and links the citizen to official services (manual completion, zero data collected). v3.0 adds an **opt-in Automation Engine** that carries out the journey on the citizen's behalf using **eGov API integrations**, while keeping the guided/manual mode as the default fallback. The "zero data" model is replaced by a **consent-based, data-minimizing** model.

---

## 1. Executive Summary

eHakbang is a web-based, AI-powered **government journey planner and automation assistant** for Filipino citizens. After any significant life event — getting married, having a baby, losing a job, retiring, becoming a PWD or senior, starting a business, or a death in the family — eHakbang:

1. **Generates** a fully ordered, personalized checklist of government steps (reason, documents, step type, official link), and
2. **Optionally automates** those steps end-to-end — preparing forms, paying fees, notifying the citizen, and anchoring tamper-evident receipts — through integrated eGov PH APIs.

Automation is a **reusable, life-event-agnostic engine**: the same pipeline runs against whatever steps a given life event produces. Pregnancy / "had a baby" is the primary worked example and demo scenario, but the engine applies to every life event.

### Core Value Proposition
> "Filipinos don't know what to do after a life change — and even when they do, the process is slow and fragmented. eHakbang tells them the right steps in the right order, then does the paperwork for them."

---

## 2. Product Vision & Goals

### 2.1 Vision
To become the single trusted starting point for every Filipino navigating government after a life change — from *knowing* what to do, to *having it done*.

### 2.2 Goals
- Cut the time to act on a life event from days to minutes.
- Eliminate wrong-office / wrong-document trips by ordering steps correctly and pre-filling them.
- Surface and help claim benefits (SSS, PhilHealth, Pag-IBIG, DSWD, DOLE) citizens don't know they qualify for.
- Automate the mechanical work — form preparation, fee payment, notification, and proof — through eGov APIs.
- Operate **without requiring an account or sign-in**, collecting only what a chosen step needs, with consent.

### 2.3 Design Principles
| Principle | Description |
|---|---|
| Zero friction | A non-tech user completes (or automates) a journey without external help. |
| No sign-in | No account or login is required to use eHakbang. |
| Data minimization | Only data required by a selected step is collected, only at the moment it is needed, with explicit consent. Nothing is stored server-side beyond what an in-flight transaction requires. |
| Guided by default, automated by choice | Manual checklist is the default; automation is explicitly opted into per journey or per step. |
| Honest AI | Never present benefit amounts or eligibility as guaranteed; always cite/route to the official source. |
| Mobile first | All layouts target 375px minimum. |
| Plain language | Every step explained in plain Filipino or English. |
| Demo integrity | Where integrations are simulated (no live environment), the UI clearly labels them as **Simulated**. |

---

## 3. Problem Statement

When a Filipino experiences a major life event, they face invisible obligations and entitlements across multiple agencies. Information is fragmented and outdated; the correct order is unknown; benefits go unclaimed; and even a well-informed citizen must still queue, pay, and file at several offices. The existing eGov PH chatbot names agencies but does not order steps, list documents, link services, track completion, surface benefits, or **act** on the citizen's behalf. eHakbang completes what the chatbot starts — and then automates the legwork.

---

## 4. Target Users

eHakbang serves **every Filipino who has experienced any life event** that triggers government obligations or entitlements, with priority on non-tech-savvy users. (Personas from v2.0 remain valid: Maria — newly married; Nena — new mother/informal worker; Mang Ernesto — retiring; Ate Cynthia — barangay officer assisting constituents.)

**Life events in scope (not exhaustive):** got married, had a baby, lost a job, retired, started a business, became a senior citizen, became a PWD, death in the family — plus free-text description. Automation is generic across all of them.

---

## 5. User Stories (new/updated for v3)

| ID | As a… | I want to… | So that… | Priority |
|---|---|---|---|---|
| US-16 | Citizen | Choose to automate my journey instead of doing each step myself | I save time and avoid errors | High |
| US-17 | Citizen | Have forms pre-filled from what I've already provided | I don't re-enter the same details | High |
| US-18 | Citizen | Pay required government fees inside the app | I don't make separate trips or payments | High |
| US-19 | Citizen | Receive confirmations and status updates | I know what was done and what's pending | High |
| US-20 | Citizen | Get a verifiable receipt for each completed step | I have tamper-evident proof of what was filed | Medium |
| US-21 | Citizen | See which steps were automated vs. still need me | I know exactly what remains | High |
| US-22 | Citizen | Use everything without creating an account | my participation stays low-friction and private | High |
| US-23 | Citizen | Report and track an issue when a step fails or a benefit is delayed | I have a real escalation path with a case number | Medium |

---

## 6. Functional Requirements

### 6.1 Retained from v2.0
- **FR-01** Free-text life-event input (Filipino/English/Taglish).
- **FR-02** Predefined life-event cards (≥8) + "More events".
- **FR-03** AI journey generation (ordered steps, live/official sourcing) — now provided via **eGov AI** (see §9.1).
- **FR-04** Step type classification: Record Update vs. Benefit Claim.
- **FR-05** Step card display (agency, reason, documents, time, official link).
- **FR-06** Manual completion checklist (default mode; unchanged).
- **FR-07** Progress bar & journey summary.
- **FR-08** Journey persistence via localStorage (no account).
- **FR-09** Journey archive ("My Journeys").
- **FR-10** Benefit-claim disclaimer system.
- **FR-11** Language toggle (Filipino / English).
- **FR-12** Step-level AI follow-up chat.

### 6.2 New — Automation Engine

**FR-13 — Automation Mode (opt-in).**
The journey view shall offer an **"Automate for me"** action (per journey, with per-step control). Automation is never the default; the manual checklist (FR-06) remains available. Selecting automation shows what will happen, what data is needed, and requests explicit consent.
- ✓ Clear opt-in with a plain-language summary of actions and data use.
- ✓ User can automate the whole journey or select specific steps.
- ✓ User can cancel/return to manual at any time.

**FR-14 — Automated Record-Update filing (Track A).**
For steps classified as Record Update (e.g., PSA birth registration, civil-status updates, adding a dependent), the engine shall prepare and submit the step using available eGov APIs, presenting progress and a reference number on success.
- ✓ Each step shows: preparing → submitting → result (reference no. or hand-off).
- ✓ Where no agency write-endpoint exists, the step is completed as far as the available APIs allow (prepare, pay, notify, anchor) and clearly **handed off** for final submission.

**FR-15 — Automated Benefit/Loan claims (Track B).**
For steps classified as Benefit Claim (e.g., SSS maternity, PhilHealth reimbursement, Pag-IBIG), the engine shall file/prepare the claim and report status, always retaining the FR-10 disclaimer (amounts/eligibility verified on the official source).

**FR-16 — Inline fee payment (eGovPay).**
When a step has a government fee, the engine shall collect payment through **eGovPay** and attach the payment result to the step.
- ✓ Fee amount shown before payment; explicit confirmation required.
- ✓ Payment reference stored with the step; failure handled gracefully.

**FR-17 — Notifications (eMessage).**
The system shall send confirmations and status updates via **eMessage** (in-app always; SMS/email only if the citizen provides a contact at the point of notification — no account required).
- ✓ In-app status log per journey.
- ✓ Optional SMS/email when a contact is supplied and consented.

**FR-18 — Tamper-evident receipts (eGovChain).**
On completion of a step, the system shall anchor a receipt (hash/metadata, no sensitive PII) to **eGovChain** and display a verifiable reference.
- ✓ Each completed step exposes an anchor reference the user can view/verify.
- ✓ No sensitive personal data is written on-chain — only a verifiable hash + minimal metadata.

**FR-19 — Document intelligence & prefill (eGov AI).**
**eGov AI** shall power journey generation, form pre-filling, translation (FIL/EN), and step Q&A. Pre-filled fields are shown for the user to review/confirm before submission.

**FR-20 — Automation results dashboard.**
After an automated run, the system shall present a results view listing, per step: status (done / handed-off / failed), reference numbers, payments made, notifications sent, and chain receipts.

**FR-21 — Fallback, hand-off & reporting.**
If a step cannot be auto-completed, fails, or is rejected, the system shall clearly mark it, explain why, provide the manual path (official link + instructions), and offer **"Report an issue"** which files a citizen report via **eReport** (OTP-verified, no account) with the step context pre-filled by eGov AI. The returned case number is attached to the step.
- ✓ Report types: failed/rejected step, delayed benefit, incorrect step info/link, and agency/integrity complaints.
- ✓ OTP is sent to a contact the citizen supplies at that moment; no account created.
- ✓ The case number is stored locally and shown on the step and in My Reports (FR-23).

**FR-22 — Simulated-environment labeling.**
While integrations run against simulated clients (no live/sandbox environment), the automated flow shall display a persistent **"Simulated"** indicator so no user mistakes it for a real government submission.

**FR-23 — Report tracking ("My Reports").**
The system shall provide a **My Reports** view (mirroring My Journeys) that lists reports filed via eReport with their **case number** and current **status** (fetched by case number). Case numbers persist in localStorage; no account is required.
- ✓ Each entry shows: related life event/step, case number, status, date.
- ✓ Status can be refreshed on demand via eReport's view-by-case-number.
- ✓ Accessible from primary navigation alongside My Journeys.

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Journey generation rendered under ~8s; page load under ~3s on 4G. |
| NFR-02 | Accessibility | Body text ≥16px; touch targets ≥48×48px; contrast ≥4.5:1 (WCAG AA). |
| NFR-03 | No sign-in | No account/login required for any feature. |
| NFR-04 | Data minimization | Collect only fields a selected step requires, only when needed, with consent. Do not persist PII server-side beyond an in-flight transaction. |
| NFR-05 | Secrets handling | All eGov API credentials/keys live **server-side** (route handlers / server functions); never shipped to the browser. |
| NFR-06 | Resilience | Per-API timeouts, one retry on transient failure, and graceful degradation to the manual path. |
| NFR-07 | Persistence | Journey/progress stored client-side (localStorage); functional in-memory fallback. |
| NFR-08 | Privacy/Legal | Consent captured per data use; aligned with the Data Privacy Act (R.A. 10173); on-chain data contains no sensitive PII. |
| NFR-09 | Demo integrity | Simulated integrations clearly labeled (FR-22). |
| NFR-10 | Portability | A single config switch repoints simulated clients to real eGov endpoints without UI changes. |

---

## 8. System Architecture

### 8.1 Overview
v3 introduces a lightweight **server-side integration layer** (the v2.0 "no backend" constraint no longer holds, because API credentials and eGov calls must not run in the browser).

```
Client (Next.js, mobile-first UI)
  │  journey UI, automation UI, results, localStorage (journeys/progress)
  ▼
Server integration layer (Next.js route handlers / server functions)
  │  holds credentials; orchestrates the automation pipeline
  ▼
eGov API clients (currently SIMULATED; swappable to real endpoints)
  ├─ eGov AI      → journey generation, prefill, translation, Q&A
  ├─ eGovPay      → fee collection
  ├─ eMessage     → SMS / email / in-app notifications
  ├─ eGovChain    → tamper-evident receipts (anchor)
  └─ eReport      → citizen reports & tracking (fallback / escalation)
```

### 8.2 Automation pipeline (per step)
```
prepare (eGov AI prefill) → review & consent → [pay fee via eGovPay if any]
→ submit / hand-off → anchor receipt (eGovChain) → notify (eMessage)
→ record result in results dashboard
→ on failure / rejection: offer eReport (file + track by case number)
```

### 8.3 Components
| Component | Tech | Responsibility |
|---|---|---|
| Frontend | React / Next.js | UI, journey rendering, automation flow, results, localStorage |
| Integration layer | Next.js server routes | Credential custody, pipeline orchestration, error handling |
| eGov clients | `lib/egov/*` (typed, simulated) | One client per core API; realistic simulated responses; config-swappable |
| State | React + localStorage | Journeys, progress, language preference |

---

## 9. API Specifications (Core — 5 in scope)

> All four run through the server integration layer. No sandbox/live environment is used yet; clients return realistic **simulated** responses behind the same interfaces a real client would expose.

### 9.1 eGov AI — AI services
- **Role:** Journey generation (ordered steps), document intelligence & form prefill, FIL/EN translation, conversational step Q&A.
- **In flow:** generates the journey (FR-03) and prepares each step (FR-19).
- **Output (journey):** structured JSON — `life_event`, `summary`, `total_steps`, `record_updates`, `benefit_claims`, `steps[]` (step_number, agency, code, title, type, reason, documents, estimated_time, note, official service reference). *(Same schema shape as v2.0 §9.1.2.)*

### 9.2 eGovPay — digital payments
- **Role:** Collect and reconcile government fees for a step; return payment reference/status.
- **In flow:** FR-16, only for steps with a fee; explicit confirmation before charge.

### 9.3 eMessage — notifications
- **Role:** Deliver SMS, email, and in-app notices via one messaging interface.
- **In flow:** FR-17; in-app always; SMS/email only with a supplied, consented contact.

### 9.4 eGovChain — blockchain (Hyperledger Besu, JSON-RPC)
- **Role:** Anchor a tamper-evident record (hash + minimal metadata) for each completed step; verifiable state.
- **In flow:** FR-18; **no sensitive PII on-chain**.

### 9.5 eReport — citizen reports
- **Role:** File and track citizen complaints/reports — submit a report, verify by **OTP**, then list/view status by **case number**.
- **In flow:** FR-21 fallback (failed/rejected/handed-off steps, delayed benefits, incorrect info/links, agency & integrity complaints) and FR-23 tracking.
- **No account:** OTP is per-report, sent to a contact the citizen supplies at that moment — accountability without sign-in.
- **Privacy:** only the returned case number is stored locally; contact captured solely for the OTP.

### 9.6 Out of scope for v3 (available, not used now)
- **eGov SSO (1):** excluded — eHakbang requires no sign-in.
- **National ID eVerify (2) + Face Liveness (8):** excluded for now — no identity verification in this scope (engine prepares/pays/notifies/anchors and hands off final agency submission where identity would be required).
- **DBM Compass (9):** candidate future transparency widget.

### 9.7 Error handling
| Scenario | Behavior |
|---|---|
| eGov AI timeout / invalid output | Show retry; fall back to manual checklist. |
| eGovPay failure | Do not mark step paid; offer retry or manual payment link. |
| eMessage failure | Keep in-app status; silently skip external send. |
| eGovChain unavailable | Mark step done without anchor; note "receipt pending". |
| eReport submit / OTP failure | Allow OTP resend or retry; keep the manual path available. |
| Any step non-automatable | Mark handed-off with official link + instructions (FR-21). |

---

## 10. Data & Privacy

- **No account, no login** (NFR-03).
- **Data minimization** (NFR-04): only step-required fields, collected at point of need, with consent; not persisted server-side beyond the in-flight transaction.
- **Secrets server-side only** (NFR-05).
- **On-chain data**: verifiable hash + minimal metadata only — no sensitive PII (FR-18).
- **DPA (R.A. 10173) alignment** via consent + minimization (NFR-08).
- **Client storage**: journeys/progress in localStorage, device-local.

---

## 11. Out of Scope (v3)
- Sign-in / accounts (SSO).
- Identity verification (eVerify, Face Liveness).
- DBM Compass transparency (future candidate).
- Real/live or sandbox eGov environment (integrations are simulated; §9, FR-22).
- Multi-user / shared journeys; native mobile app; push notifications.

---

## 12. Risks & Mitigations
| ID | Risk | Mitigation |
|---|---|---|
| R-01 | AI generates inaccurate steps/amounts | FR-10 disclaimers; official-source routing; never guarantee amounts. |
| R-02 | No real agency write-API for some steps | Automate as far as APIs allow; explicit hand-off (FR-21). |
| R-03 | API credentials exposed | Server-side only (NFR-05). |
| R-04 | Simulated flow mistaken for real filing | Persistent "Simulated" label (FR-22). |
| R-05 | Handling PII without accounts | Data minimization + consent; no server-side persistence beyond in-flight (NFR-04/08). |
| R-06 | API latency/flakiness | Timeouts, single retry, manual fallback (NFR-06). |

---

## 13. Success Metrics
- **Demo:** for the pregnancy scenario, a full automated run completes (prepare → pay → anchor → notify → results) with clear hand-offs; the same engine visibly works on a second life event (e.g., "Got Married").
- **Clarity:** a non-tech observer understands what was automated vs. handed off within the results view.
- **Breadth:** all 5 core eGov APIs are exercised across a journey (AI, Pay, Message, Chain, and eReport on a failure path).
- **Resilience:** a failed or handed-off step can be reported via eReport and tracked by case number in My Reports.

---

## 14. Glossary (additions to v2.0)
- **Automation Engine** — the reusable pipeline that prepares, pays, files/hands-off, anchors, and notifies for the steps of any life-event journey.
- **Hand-off** — a step the engine cannot fully complete via available APIs, handed to the citizen with the official link and instructions.
- **Anchor (eGovChain)** — writing a tamper-evident hash + minimal metadata of a completed step to the government blockchain for later verification.
- **Simulated** — an integration running against a local stand-in client (no live environment), clearly labeled in the UI.
- **eReport / case number** — a filed citizen report or complaint identified by a case number; eHakbang uses it as the fallback when a step fails, is rejected or delayed, or needs escalation, and tracks it in My Reports.

---

*eHakbang | Product Requirements Document v3.0 | eGov Hackathon 2025 | DICT — Department of Information and Communications Technology*
