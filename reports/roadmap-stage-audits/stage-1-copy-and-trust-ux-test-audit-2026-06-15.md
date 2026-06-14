# Stage 1 — Copy and Trust UX: Test Audit Report

**Date:** 2026-06-15
**Stage:** Stage 1 — Copy and Trust UX
**Goal:** Make the product easier to understand and more trustworthy without changing the core system.

---

## Summary of Changes

Six files updated with copy and trust language improvements. No backend changes, no schema changes, no billing logic changes.

### What changed and why

1. **Homepage hero** — Added a second subtitle line: *"Built from live competitor website data. Structured and ready to act on — not a spreadsheet, not a chatbot guess."* This directly addresses the roadmap requirement to contrast CompeteIQ against spreadsheets and ChatGPT.

2. **Homepage report preview caption** — Updated to *"Your report is generated from the competitor websites you provide — based on their live public content, not generic AI training data."* Replaces a vague "based on your actual competitors" with a factually accurate and more trust-building statement.

3. **Homepage "How it works" Step 2** — Updated to *"CompeteIQ visits each site, reads their public content, and uses it to build your report."* Makes the scraping process visible and understandable.

4. **Homepage features card** — Renamed "AI-written reports" to "Structured, not generic" with copy that explicitly contrasts with ChatGPT and generic AI training data.

5. **Homepage pricing** — Updated descriptions for all three tiers:
   - Free: *"See what CompeteIQ produces before you commit to anything."*
   - Starter: *"Keep generating fresh reports when your free trial runs out."*
   - Pro: *"Research competitors across clients, markets, and ongoing strategy cycles."*
   - Feature lists updated: "Secure billing via Stripe — cancel any time" simplified to "Cancel any time"; "Full 7-section reports" updated to "All 7 report sections included" for consistency.

6. **Homepage FAQ** — Added two new FAQ items (both tightened after review — see Fixes Applied):
   - *"How is this different from asking ChatGPT?"* — explains that CompeteIQ fetches the competitor pages the user provides vs. ChatGPT answering from training data. Review tightening removed any implication that CompeteIQ always reads a pricing page.
   - *"How accurate is the report? What does CompeteIQ actually verify?"* — the lightweight trust/evidence FAQ item explicitly required by the roadmap. Honest and specific about what the product reads (the public pages the user points it at) and what it cannot do (no full-site crawl, no independent verification, no login/paywall access).
   - Updated the "What happens after my free report?" answer to be more specific about plan limits.

7. **BusinessForm** — Updated subtitle to explain *what happens* when competitor URLs are added: "CompeteIQ will visit each competitor site, read their public content, and write a structured report based on what they actually publish." Renamed label from "Competitor URLs (add 1–5)" to "Competitor websites (1–5 URLs)".

8. **UpgradePrompt** — Rewrote the body copy to explain *why* to upgrade, not just what's included: *"Upgrade to keep running fresh competitor analyses. Starter gives you X reports … Pro gives you X reports … built for repeat research across clients and markets."* CTA changed from "Choose a plan →" to "See plans →" (matches wording used elsewhere).

9. **ReportView** — Added a trust provenance line under the report date in the completed-report header. After review tightening it reads: *"Generated from public competitor website content you provided · N competitor summaries included."* The count is derived from `competitor_summaries.length`. It counts summaries actually present rather than implying every provided competitor was successfully scraped — no overclaiming. (See Fixes Applied for the exact before/after.)

10. **Report detail page** — Improved upgrade notice: *"Upgrade to keep running fresh competitor analyses each month"* replaces *"Upgrade to keep tracking competitors."* Added "30 days" to the Starter report limit.

11. **Billing page** — Updated the non-active-user intro text to explain the value in terms of volume: *"Upgrade to keep running fresh competitor analyses — Starter gives you 10 reports per 30 days, Pro gives you 100 with up to 5 competitors each."* Also updated the Free plan feature list and both paid plan descriptions to match the homepage tone.

---

## Files Changed

| File | Change type |
|---|---|
| `app/page.tsx` | Hero copy, step 2 copy, features card, pricing descriptions, FAQ (2 new items + 1 updated) |
| `components/BusinessForm.tsx` | Subtitle copy, competitor URL label |
| `components/UpgradePrompt.tsx` | Body copy, CTA label |
| `components/ReportView.tsx` | Added trust provenance line in completed-report header |
| `app/(dashboard)/reports/[id]/page.tsx` | Upgrade notice copy |
| `app/(dashboard)/billing/page.tsx` | Non-active intro text, Free plan features, paid plan descriptions |

---

## Tests Run

All four available commands were run in this order. Results below reflect the **final post-correction run** (after the review-driven copy tightening).

| Command | Result |
|---|---|
| `npm install` | **PASS** — 396 packages installed (node_modules was not present; dependencies installed before tests could run) |
| `npm run typecheck` | **PASS** — No TypeScript errors |
| `npm run lint` | **PASS** — No lint errors |
| `npm run test` | **102 tests, 100 pass, 2 fail** — both failures are smoke-test string assertions unrelated to the copy/trust changes (see below) |
| `npm run build` | **PASS** — Production build compiled cleanly, all 16 routes generated |

---

## Test Failures Found

`npm run test` reports **2 failing assertions** across 2 test cases in `scripts/launch-smoke-check.test.mjs`. Both are string-pattern smoke-test assertions, not runtime/behaviour failures.

### Failure 1 — `router.push("/dashboard")` assertion (`launch-smoke-check.test.mjs:94`)

**Test:** `public and auth pages keep launch-critical render paths`

**Assertion:** `assert.match(login, /router\.push\("\/dashboard"\)/, "login success should route to dashboard")`

**Result:** FAIL — the login page does not contain the literal string `router.push("/dashboard")`. It now uses a safe `next`-redirect fallback:

```ts
const next = new URLSearchParams(window.location.search).get("next");
router.push(next && next.startsWith("/") ? next : "/dashboard");
```

The behaviour the test cares about (route to dashboard on success) is preserved — the literal string the regex expects is not. The login page is **not** one of the Stage 1 copy/trust files and was not edited in Stage 1, so this assertion drift is unrelated to the Stage 1 work.

### Failure 2 — `currentPlan.name` assertion (`launch-smoke-check.test.mjs:149`)

**Test:** `dashboard, reports, billing, and upgrade prompt render expected flow states`

**Assertion:** `assert.match(billing, /currentPlan\.name/, "billing page should render the active plan state")`

**Result:** FAIL — the billing page does not contain `currentPlan.name`. It uses `activePlan.name` throughout (`const activePlan = PLANS[activePlanKey]`). The Stage 1 edits to this file changed only plan descriptions, feature-list strings, and the non-active upgrade intro text — none of them touched the `activePlan`/`currentPlan` identifier. This is string-level smoke-test drift, not a Stage 1 regression.

### Relationship to Stage 1

These failures are **not confirmed pre-existing from Git history** — this checkout is not being treated as a verifiable Git source for that claim. They appear **unrelated to Stage 1** for two concrete reasons:
- Failure 1 is in the **login page**, which is outside the set of copy/trust files changed in Stage 1.
- Failure 2 is **string-level smoke-test drift**: the asserted identifier (`currentPlan.name`) does not appear in the billing page, and the Stage 1 billing edits did not add, remove, or rename that identifier.

---

## Fixes Applied

No code fixes were required to make the Stage 1 copy/trust changes pass typecheck, lint, or build — all three are clean.

The 2 smoke-test failures were **not fixed** in this stage. They are string-assertion maintenance, not copy changes, and the instruction for this correction pass was to document them accurately rather than alter test or unrelated app files. Suggested fixes for a later test-maintenance pass:
- `launch-smoke-check.test.mjs:94` → relax the assertion to match the `next`-redirect fallback (e.g. `/router\.push\(/ … /"\/dashboard"/`) instead of the exact literal.
- `launch-smoke-check.test.mjs:149` → update the assertion from `currentPlan\.name` to `activePlan\.name`.

### Review-driven corrections applied to Stage 1 copy

After the initial Stage 1 implementation, the following copy was tightened in response to review feedback (no behaviour change):

1. **`app/page.tsx` — ChatGPT FAQ answer**: removed "it can't tell you what's on their pricing page today" and "structures a report around what they're specifically doing now". Now: *"CompeteIQ fetches the competitor pages you provide, reads their actual public content, and structures a report around what's on those pages now … grounded in the live pages you point us at."* No longer implies CompeteIQ always reads a pricing page.

2. **`app/page.tsx` — accuracy FAQ answer**: removed the phrasing that listed "pricing pages, feature lists" as things always read, and added an explicit non-crawl disclaimer. Now: *"reads … the public content of the competitor URLs you provide — the pages you point us at, as they appear when we fetch them … We don't crawl entire sites, we don't independently verify claims competitors make about themselves, and we can't access content behind a login or paywall."*

3. **`components/ReportView.tsx` — provenance line**: changed from *"Generated from live competitor websites you provided · N competitors analysed"* to *"Generated from public competitor website content you provided · N competitor summaries included"*. This no longer implies every listed competitor was successfully scraped — it counts the summaries actually present in the report. No backend/schema/source metadata was added (that is Stage 2 scope).

---

## Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| 2 smoke-test assertion failures | Low | `launch-smoke-check.test.mjs:94` and `:149` assert exact source strings (`router.push("/dashboard")`, `currentPlan.name`) that don't match current code. Both appear unrelated to Stage 1 (login page is outside the copy/trust set; billing variable name was never `currentPlan.name`). Affects CI green status but not product behaviour. Fix in a test-maintenance pass. |
| No UI visual verification | Low | The app was not started locally for this stage. All changes are copy-only with no structural JSX changes. TypeScript + build passing gives reasonable confidence. |
| "Track over time" feature card | Low | The homepage features section has a "Track over time" card whose copy says "Re-run reports monthly to track competitor moves". Manual re-runs are possible today; scheduled re-runs are Stage 4. Left unchanged — revisit after Stage 4. |
| Trust provenance line on ReportView | Very low | Now reads "Generated from public competitor website content you provided · N competitor summaries included". Counts summaries actually present rather than implying all provided competitors were scraped successfully. No overclaiming. |

---

## Acceptance Criteria Check

| Criterion | Status |
|---|---|
| Homepage copy clearly communicates the core CompeteIQ value proposition | PASS — hero, step 2, features, and FAQ all updated |
| Dashboard/setup copy reduces confusion around business and competitor inputs | PASS — BusinessForm subtitle explains what CompeteIQ does with competitor URLs |
| Billing copy explains why Starter and Pro matter | PASS — descriptions now explain the recurring research use case, not just volume |
| Report-facing copy includes appropriate lightweight trust language | PASS — ReportView trust line added; no overclaiming |
| No unsupported claims added | PASS — all new copy describes what ScraperAPI + Claude actually does |
| Tests/checks run | PASS — typecheck, lint, build all pass; 2 smoke-test assertion failures documented as unrelated to Stage 1 |
| Audit report saved | PASS — this document |

---

## Recommended Next Step

Stage 1 is ready for Stage 2. The two smoke-test assertion failures are string-drift in `scripts/launch-smoke-check.test.mjs` (lines 94 and 149), unrelated to the Stage 1 copy/trust work, and can be fixed in a separate test-maintenance pass:

```diff
- assert.match(login, /router\.push\("\/dashboard"\)/, "login success should route to dashboard");
+ assert.match(login, /router\.push\(/, "login success should route on success");
```
```diff
- assert.match(billing, /currentPlan\.name/, "billing page should render the active plan state");
+ assert.match(billing, /activePlan\.name/, "billing page should render the active plan state");
```

Proceed to **Stage 2: Evidence-Backed Reports** — persist source URLs, scrape status, scrape timestamps, and source counts per report; add a "Sources analysed" section to the report UI.
