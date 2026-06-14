# Stage 2 — Evidence-Backed Reports: Test Audit Report

**Date:** 2026-06-15
**Stage:** Stage 2 — Evidence-Backed Reports
**Goal:** Make trust visible inside the product output by persisting and showing per-competitor source evidence (URLs, scrape status, scrape timestamps, source counts).

---

## Summary of Changes

Stage 2 adds report-scoped source evidence end-to-end: a new JSONB column on `reports`, a typed `ReportSource` model, persistence in the report generation route, and a visible "Sources analysed" section plus a trust line in the report UI. Copy/share export now includes the sources too.

### Design decision — where source evidence lives

The existing `scrape_jobs` table is keyed by `competitor_id` and is **not** linked to a specific `report_id` (this was the gap flagged in `current-product-flow-and-operating-model-2026-06-14.md`). Rather than retrofit a `report_id` join across `scrape_jobs` (which would also complicate RLS and historical reports), Stage 2 stores a small, report-scoped evidence summary directly on the `reports` row as a `sources` JSONB array:

```json
[{ "url": "https://...", "status": "completed" | "failed",
   "scraped_at": "ISO-8601 | null", "error": "text | null" }]
```

This satisfies the roadmap's minimum-boundary rules:
- **Competitor-level evidence, not per-sentence citations** — exactly the v1 scope.
- **Source data stays customer-private and tied to the report** — `reports` already enforces per-user RLS (`auth.uid() = user_id`), so the `sources` column inherits that protection. No new policy needed.
- Avoids over-engineering a `scrape_jobs` ↔ `reports` linkage that the data model does not currently support cleanly.

### AI prompt — intentionally unchanged for v1

The roadmap notes the AI prompt *could* be updated so "key claims can reference source evidence," but the minimum boundary says **not** to attempt sentence-level citation coverage unless the data model supports it cleanly. It does not. So `lib/ai.ts` is unchanged in Stage 2. Evidence is surfaced at the competitor/source level only. This is documented as a deliberate scope boundary, not an omission.

### What changed and why

1. **`supabase/migrations/008_report_sources.sql` (new)** — Adds `sources jsonb` to `public.reports` via `add column if not exists` (safe, additive, re-runnable). Includes a column comment documenting the shape. Existing reports keep `sources = NULL`; the UI degrades gracefully.

2. **`lib/types.ts`** — Added a `ReportSource` interface (`url`, `status`, `scraped_at`, `error`) and a `sources: ReportSource[] | null` field on `Report`. Field is non-optional but nullable, matching the DB (column present, value null for old rows).

3. **`app/api/reports/generate/route.ts`** — Introduced a single `scrapedAt` timestamp per generation run so `scrape_jobs.scraped_at` and the report's source evidence agree on timing (previously each scrape_job row computed its own `new Date()` inline). Built a `sources` array from `validatedCompetitors` + `scrapeResults` and persisted it on the completed-report `update`. No change to validation, rate-limiting, quota, trial-credit, or failure-handling logic.

4. **`components/ReportView.tsx`** —
   - Added a **trust line** near the top of completed reports: *"This report was generated from N of M competitor pages scraped successfully on [date/time]. See sources."* Anchored to the sources section.
   - Added a **"Sources analysed" section** at the bottom listing each source: host (clickable, `rel="noopener noreferrer nofollow"`, opens in new tab), full URL, scrape status badge (Scraped / Failed), scrape timestamp for successes, and a clear "Could not be scraped … Not used in this report" line for failures.
   - The old static provenance line now renders **only as a fallback** for older reports that have no stored `sources` (so pre-Stage-2 reports still show a sensible line).
   - `buildPlainText` (copy/share export) now appends a "SOURCES ANALYSED" block with `[scraped]`/`[failed]` markers and timestamps.

---

## Files Changed

| File | Change type |
|---|---|
| `supabase/migrations/008_report_sources.sql` | **New** — adds `reports.sources jsonb` |
| `lib/types.ts` | Added `ReportSource` interface + `sources` field on `Report` |
| `app/api/reports/generate/route.ts` | Shared scrape timestamp; build + persist `sources` array |
| `components/ReportView.tsx` | Trust line, "Sources analysed" section, plain-text export sources |
| `lib/reportSources.ts` | **New (post-review)** — extracted pure `buildReportSources()` for testability |
| `scripts/stage-2-evidence.test.mjs` | **New (post-review)** — focused Stage 2 automated coverage (9 tests) |

### Post-review testability refactor

In response to the Stage 2 review (which flagged "no automated test for source evidence"), the inline `sources`-building map in the generate route was extracted into a pure function, `buildReportSources(competitors, scrapeResults, scrapedAt)`, in `lib/reportSources.ts`. The route now imports and calls it. This is a **testability refactor only** — the persisted JSONB shape, the data model, `lib/ai.ts`, and `scrape_jobs` are all unchanged. The function is import-light (type-only imports) so it can be executed directly in the test VM.

---

## Tests Run

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** — No TypeScript errors |
| `npm run lint` | **PASS** — No lint errors |
| `npm run test` | **111 tests, 109 pass, 2 fail** — 9 new Stage 2 tests added (all pass); the 2 failures are the same pre-existing smoke-test string drift, **unrelated to Stage 2** |
| `npm run build` | **PASS** — Production build compiled cleanly, all 16 routes generated |

### Raw pass/fail per command (final post-review run)

- `npm run typecheck` → exit 0, clean.
- `npm run lint` → exit 0, clean.
- `npm run test` → exit 1. `tests 111 / pass 109 / fail 2`.
- `npm run build` → exit 0. "Compiled successfully", 16/16 static pages generated.

### Stage 2 automated coverage added (`scripts/stage-2-evidence.test.mjs`, 9 tests, all passing)

**Behavioral (runs the real `buildReportSources` mapping):**
1. Successful scrape → `status: "completed"`, `scraped_at` = run timestamp, `error: null`, correct URL.
2. Failed scrape → `status: "failed"`, `scraped_at: null`, populated `error` (the key review ask).
3. Mixed success/failure across 3 competitors → order stays index-aligned with the competitor list; per-source status, timestamp, and error are correct.

**Structural (source-string assertions):**
4. Generate route imports `buildReportSources`, builds `sources` from validated competitors + scrape results, captures a single shared `scrapedAt`, and persists `sources` on the **completed** report update (anchored immediately before `updated_at`).
5. ReportView renders "Sources analysed", the trust line, the successful (Scraped) state, the Failed badge state, and the "Not used in this report" failure message.
6. ReportView guards the evidence UI on `sources && sources.length > 0`, and renders the fallback provenance line under `{!sources && (` for reports where `sources === null`.
7. ReportView's plain-text copy/share export includes a `SOURCES ANALYSED` block with `[scraped]`/`[failed]` markers.
8. Migration 008 alters `public.reports` and adds `sources jsonb` with `if not exists` (safe to re-run).
9. Scope guardrail: `lib/ai.ts` contract has not grown citation fields (no sentence-level citations in v1).

---

## Failures Found

The 2 failing assertions are **identical to Stage 1** and remain unrelated to this stage's changes. Both live in `scripts/launch-smoke-check.test.mjs`:

- **`:94`** — expects literal `router.push("/dashboard")`; the login page uses a safe `next`-redirect fallback (`router.push(next && next.startsWith("/") ? next : "/dashboard")`). The login page was not touched in Stage 1 or Stage 2.
- **`:149`** — expects `currentPlan.name`; the billing page uses `activePlan.name`. Stage 2 did not touch the billing page at all.

Neither failure is caused by Stage 2. No source-evidence code paths are covered by the smoke test today (see Remaining Risks).

---

## Fixes Applied

None required — Stage 2 typecheck, lint, and build are all clean on the first complete run. The 2 smoke-test failures are out of scope for this stage (queued for a test-maintenance pass; suggested one-line fixes were documented in the Stage 1 audit).

---

## Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| Migration must be applied to live Supabase | **Medium** | `008_report_sources.sql` must be run in the live Supabase SQL editor **before deploying any code that writes `sources`**. If the column is missing in production, the completed-report `update` will fail on the `sources` key and report generation will error. The migration is additive and safe to re-run. **Hard prerequisite — confirmed still open.** |
| `sources` is owner-writable via the Data API (tamper-resistance) | Low–Medium (future hardening) | `sources` lives on `public.reports`, which keeps it **private** via per-user RLS (`auth.uid() = user_id`) — no cross-user exposure. However, the existing policy is `for all` (the migration-001 "Users can CRUD own reports" owner policy), so an authenticated user with Data-API access could in principle update their **own** report rows, including `sources`, after generation. In practice the app only writes `sources` server-side during generation and never exposes an update path, and a user editing their own private evidence only deceives themselves. This is therefore a **future hardening consideration, not a Stage 2 blocker**. If/when reports become shareable or client-facing (Stage 5), tighten to restrict post-generation writes (e.g. split read vs. update policies, or move completion writes behind the service role with a no-user-update policy on result columns). |
| No live UI visual verification | Low | App was not started against a live DB for this stage. Rendering logic is guarded (`sources && sources.length > 0`) and typechecks; old reports fall back cleanly. Source-string and behavioral tests now cover the render branches and the success/failure mapping. |
| Scrape timestamp is app-side, not ScraperAPI-side | Low | `scraped_at` is the time CompeteIQ recorded the scrape result, not a header from the competitor server. This is accurate for "when we read the page" and is described that way in the UI ("Scraped [time]"). No overclaiming. |
| 2 pre-existing smoke-test failures | Low | Unrelated string-assertion drift (`launch-smoke-check.test.mjs:94`, `:149`), carried over from before Stage 1. Fix in test-maintenance pass. |

### Resolved since first draft

- **"No automated test for source evidence"** — resolved. `scripts/stage-2-evidence.test.mjs` adds 9 passing tests: behavioral coverage of the success/failure mapping (including the required failed-scrape case) and structural coverage of route persistence, the four ReportView render states, the null fallback, the plain-text export, and the migration.

---

## Acceptance Criteria Check (roadmap Stage 2)

| Criterion | Status |
|---|---|
| Every completed report shows the source URLs analysed | PASS — "Sources analysed" section lists every provided URL |
| Every completed report shows scrape timestamps where available | PASS — each successful source shows "Scraped [date/time]"; trust line shows run date |
| Partial scrape failures are visible and understandable | PASS — failed sources show a red "Failed" badge + "Could not be scraped … Not used in this report" |
| Report generation still succeeds when at least one competitor scrape succeeds | PASS — unchanged behaviour; route still fails only when *all* scrapes fail |
| Competitor-level evidence (not full sentence citations) | PASS — deliberate v1 boundary; AI prompt unchanged |
| Source data customer-private and tied to the report | PASS — stored on `reports` row under existing per-user RLS |

---

## Recommended Next Step

1. **Apply `008_report_sources.sql` to the live Supabase project** before deploying any code that writes `sources` — this remains the one hard prerequisite for Stage 2 to function in production.
2. (Done) Automated Stage 2 coverage added in `scripts/stage-2-evidence.test.mjs`.
3. (Optional, low priority) Fix the 2 pre-existing string-drift assertions in `launch-smoke-check.test.mjs` (lines 94 and 149) in a separate test-maintenance pass.
4. (Future hardening, not now) Tighten report write policies before reports become shareable/client-facing (Stage 5), so result columns including `sources` can't be altered post-generation via the Data API.
5. Proceed to **Stage 3: Suggest My Competitors** — an assisted path for users who don't know competitor URLs (enter website/industry → suggested competitors → user confirmation before saving), keeping manual URL entry fully available.
