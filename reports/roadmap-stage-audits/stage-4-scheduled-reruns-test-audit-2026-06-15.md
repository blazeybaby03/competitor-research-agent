# Stage 4 — Scheduled Re-Runs and "What Changed": Test Audit Report

**Date:** 2026-06-15
**Stage:** Stage 4 — Scheduled Re-Runs and "What Changed"
**Goal:** Create a recurring-value loop that justifies subscription retention: let paid users schedule monthly re-runs, generate a short "what changed" summary between the latest and prior report, and surface it clearly — kept lightweight (not a real-time monitoring suite).

---

## Summary of Changes

Stage 4 adds an opt-in monthly re-run for paid businesses, driven by a Vercel Cron job, plus an AI "what changed" summary stored on each scheduled report and shown in the report UI. To avoid a parallel generation path, the scrape→AI→evidence core was extracted into a shared `lib/reportRunner.ts` used by both the existing manual route and the new cron.

### Design decisions

1. **Shared report runner (no parallel system).** The manual `/api/reports/generate` route had its scrape→scrape_jobs→sources→AI core inlined. That core is now `runReport()` in `lib/reportRunner.ts`, used by both the manual route and the cron. The manual route keeps all its caller-specific orchestration (auth, rate limit, quota, trial credit, report-row lifecycle) — behavior is unchanged, and the existing route tests (updated to point at the new location) still guard it.

2. **Scheduling state on `businesses`, not a new table.** `rerun_enabled`, `rerun_last_run_at`, `rerun_last_status` columns (migration 009). A partial index speeds the cron's "enabled" lookup. No new table.

3. **"What changed" stored per report.** `reports.change_summary jsonb` (`{ summary, changes[] }`) + `reports.run_type` (`manual`|`scheduled`). The summary is computed by comparing compact snapshots of the prior vs. current report.

4. **Surfaced in-app, not by email.** The roadmap says "email or surface clearly." No email provider is wired in this codebase (README lists email as future work), so Stage 4 surfaces the "what changed" summary in-app on the report page. Email delivery is a documented, low-risk follow-up (the data is already persisted and ready to email). This keeps Stage 4 lightweight and avoids introducing an email dependency.

5. **Cron security: fail closed.** The cron route requires `Authorization: Bearer ${CRON_SECRET}`; if `CRON_SECRET` is unset it refuses to run. Vercel Cron sends this automatically.

6. **Paid-gated, quota-respecting, trust-preserving.** Only businesses whose owner has an `active` subscription are re-run. Scheduled runs respect the same rolling 30-day report quota as manual generation. Every attempt records `rerun_last_run_at` + `rerun_last_status` (`success`|`failed`) so failures are visible and never silently consume trust. A failed "what changed" summary never fails the whole re-run (the report itself is the value).

### What changed and why

1. **`supabase/migrations/009_scheduled_reruns.sql` (new)** — `businesses.rerun_enabled/last_run_at/last_status`, `reports.change_summary/run_type`, a partial index, and column comments. Additive, `if not exists`, safe to re-run.

2. **`lib/reportRunner.ts` (new)** — `runReport(admin, business, validatedCompetitors)` → `{ reportContent, sources }`; throws on all-scrapes-failed or incomplete AI content. Extracted verbatim from the manual route.

3. **`app/api/reports/generate/route.ts`** — refactored to call `runReport`; persistence/credit/quota logic unchanged.

4. **`lib/changeSummary.ts` (new)** — pure `ReportSnapshot`, `snapshotFromContent`, `parseChangeSummary` (unit-testable; no runtime imports).

5. **`lib/whatChanged.ts` (new)** — thin Anthropic wrapper `summarizeChanges(prev, current)`; returns null when there's no prior report. Re-exports the pure snapshot helper.

6. **`lib/schedule.ts` (new)** — pure `isRerunDue(lastRunAt, now, intervalDays=30)`.

7. **`app/api/cron/scheduled-reruns/route.ts` (new)** — secret-gated GET/POST. Loads enabled businesses, filters to due ones (`isRerunDue`), batches (≤25), keeps only active-subscription owners, checks quota, creates a `run_type: "scheduled"` report, runs `runReport`, computes `summarizeChanges` vs the prior completed report, persists content+sources+change_summary, and records `rerun_last_run_at`/`rerun_last_status`. Failures are logged and recorded.

8. **`app/api/business/schedule/route.ts` (new)** — auth + ownership-guarded toggle of `rerun_enabled`. Enabling requires an `active` subscription (403 otherwise); disabling is always allowed.

9. **`components/ScheduleToggle.tsx` (new)** — paid-gated switch on the dashboard with last-run state and a failed-attempt note; non-paid users see a "Paid feature" lock + link to billing.

10. **`app/(dashboard)/dashboard/page.tsx`** — renders `ScheduleToggle` for the saved business.

11. **`components/ReportView.tsx`** — renders a "What changed since your last report" card when `change_summary` is present.

12. **`vercel.json`** — monthly cron (`0 6 1 * *`) for `/api/cron/scheduled-reruns` + its `maxDuration: 300`.

13. **`.env.example`** — documents `CRON_SECRET`.

14. **`lib/types.ts`** — `ChangeSummary` type; new optional fields on `Business` and `Report`.

---

## Files Changed

| File | Change type |
|---|---|
| `supabase/migrations/009_scheduled_reruns.sql` | **New** — scheduling + change-summary columns |
| `lib/reportRunner.ts` | **New** — shared scrape→AI→evidence core |
| `lib/changeSummary.ts` | **New** — pure snapshot + parser |
| `lib/whatChanged.ts` | **New** — Anthropic "what changed" wrapper |
| `lib/schedule.ts` | **New** — pure `isRerunDue` |
| `app/api/cron/scheduled-reruns/route.ts` | **New** — cron re-run engine |
| `app/api/business/schedule/route.ts` | **New** — paid-gated schedule toggle |
| `components/ScheduleToggle.tsx` | **New** — dashboard toggle UI |
| `app/api/reports/generate/route.ts` | Refactored to use `runReport` (behavior unchanged) |
| `app/(dashboard)/dashboard/page.tsx` | Renders the schedule toggle |
| `components/ReportView.tsx` | Renders the "what changed" summary |
| `lib/types.ts` | `ChangeSummary` + new `Business`/`Report` fields |
| `vercel.json` | Monthly cron + cron function duration |
| `.env.example` | `CRON_SECRET` |
| `scripts/stage-4-scheduled-reruns.test.mjs` | **New** — 11 Stage 4 tests |
| `scripts/stage-2-evidence.test.mjs` | Updated 1 test for the runner extraction |
| `scripts/launch-smoke-check.test.mjs` | Updated 2 assertions for the runner extraction |
| `scripts/phase-8-plan-access.test.mjs` | Updated 1 assertion for the runner extraction |

No changes to `lib/ai.ts`, billing, pricing, or auth logic.

### Test assertions updated for the runner extraction

Because the scrape/AI core moved from the manual route into `lib/reportRunner.ts`, three existing tests asserted on strings that moved. They were updated to assert the same guarantees at the new location (not weakened):
- `launch-smoke-check.test.mjs` — the `scrapeUrl(...)` Promise.all and "AI returned incomplete report content" assertions now read `lib/reportRunner.ts`; the route is asserted to delegate via `await runReport(`.
- `stage-2-evidence.test.mjs` — source-building assertions now read the runner; the route is asserted to persist the returned `sources`.
- `phase-8-plan-access.test.mjs` — the "cap before expensive work" ordering now uses `await runReport(` as the expensive-work marker.

---

## Tests Run

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** — No TypeScript errors |
| `npm run lint` | **PASS** — No lint errors |
| `npm run test` | **137 tests, 135 pass, 2 fail** — 12 Stage 4 tests (all pass, incl. the 3 post-review fixes); the 2 failures are the same pre-existing smoke-test string drift, **unrelated to Stage 4** |
| `npm run build` | **PASS** — 19 routes (new `/api/cron/scheduled-reruns` and `/api/business/schedule` included). `.next` cleared first to avoid a transient Windows/Dropbox `EBUSY` lock. |

### Raw pass/fail per command (final, post-review-fixes)

- `npm run typecheck` → exit 0, clean.
- `npm run lint` → exit 0, clean.
- `npm run test` → exit 1. `tests 137 / pass 135 / fail 2`.
- `npm run build` → exit 0. "Compiled successfully", 19/19 static pages.

> Note on the refactor: extracting `runReport` initially surfaced a 3rd failure (`phase-8-plan-access` "enforces plan caps before expensive work") because it asserted on the moved `scrapeUrl(c.url)` string. The assertion was updated to use `await runReport(` as the expensive-work marker — same guarantee, new location — and the suite returned to the 2 known pre-existing failures.

### Stage 4 automated coverage (`scripts/stage-4-scheduled-reruns.test.mjs`, 11 tests, all passing)

**Behavioral:**
1. `isRerunDue` — never-run/undefined/old/unparseable → due; recent → not due.
2. `parseChangeSummary` — parses summary + changes, drops blanks, caps at 6.
3. `parseChangeSummary` — tolerates missing fields; throws when no object can be extracted.
4. `snapshotFromContent` — captures diffable fields + competitor URLs from sources.

**Structural:**
5. Migration 009 adds all columns with the right constraints (safe `if not exists`).
6. Cron is secret-gated and fails closed (no `CRON_SECRET` → refuse; Bearer check; 401).
7. Cron only runs due (`isRerunDue`), scheduling-enabled (`rerun_enabled = true`), active-subscription owners; marks `run_type: "scheduled"`; uses `runReport`; computes `summarizeChanges`; records `rerun_last_status` success/failed; does **not** consume trial credit.
8. Schedule route requires auth + ownership; paid-gates only the enable path (403); persists `rerun_enabled`.
9. Schedule UI gates on paid status, shows the paid-feature lock, calls the schedule API, surfaces last-run state.
10. Report view renders the "what changed" summary from `change_summary`.
11. Manual route and cron both import the shared runner; the manual route no longer inlines AI generation.

---

## Failures Found

Only the 2 pre-existing smoke-test string-drift assertions (`launch-smoke-check.test.mjs:94` `router.push("/dashboard")`, `:149` `currentPlan.name`). Login/billing pages were not touched in Stage 4. Queued for a test-maintenance pass.

---

## Fixes Applied

- Updated the 3 existing test assertions affected by the `runReport` extraction (documented above) so they guard the same behavior at the new location.
- No production-logic fixes were needed; typecheck/lint/build were clean.

---

## Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| Migration 009 must be applied to live Supabase before deploy | **Medium** | Code writes `run_type`/`change_summary` on reports and `rerun_*` on businesses. If the columns are missing in production, scheduled runs and the schedule toggle will error. Additive, safe to re-run. (Plus Stage 2's `008` is still required.) |
| `CRON_SECRET` must be set in production | **Medium** | The cron fails closed without it (good), but that means scheduled re-runs simply won't run until `CRON_SECRET` is configured in Vercel and the cron is enabled. Document in deploy steps. |
| Scheduled re-run cost (AI + scraping) | Medium | Each scheduled run = scrape + report AI + a small "what changed" AI call, for every enabled paid business monthly. Bounded per-invocation by `MAX_BATCH` (25) and by plan quota, but total cost scales with enabled businesses. Monitor gross margin as adoption grows; `MAX_BATCH` and the monthly cadence are the levers. |
| In-app only (no email yet) | Low | Roadmap mentions email; this stage surfaces "what changed" in-app. Data is persisted and email-ready, but users won't be notified proactively until an email provider is added. Documented as a follow-up. |
| Cron batch cap may defer some businesses | Low | With >25 due businesses in one run, the remainder wait for the next monthly invocation (or a manual trigger). Acceptable at current scale; raise `MAX_BATCH` or add pagination if needed. |
| Long cron duration | Low | Sequential processing of up to 25 businesses, each doing scrape+2 AI calls, under a 300s function budget. If runs approach the limit, reduce `MAX_BATCH` or shard the schedule. |
| No live end-to-end verification | Low | The cron path was validated via typecheck, build, and structural/behavioral tests, not a live scheduled execution against real Supabase/AI. |
| 2 pre-existing smoke-test failures | Low | Unrelated string drift. Fix in a test-maintenance pass. |

---

## Acceptance Criteria Check (roadmap Stage 4)

| Criterion | Status |
|---|---|
| Paid users can schedule monthly re-runs for saved businesses | PASS — `ScheduleToggle` + schedule route, paid-gated |
| Generate a short "what changed" summary vs the previous run | PASS — `summarizeChanges` → `reports.change_summary` |
| Surface the summary clearly (email or in-app) | PASS (in-app) — "What changed" card on the report; email is a documented follow-up |
| Lightweight monthly refresh, not a monitoring suite | PASS — one monthly cron, batched, quota-bounded |
| Restrict scheduling to paid plans | PASS — enable requires active subscription; cron skips non-active owners |
| Users can turn scheduled re-runs on/off | PASS — toggle (disabling always allowed) |
| App records when a scheduled run last executed | PASS — `rerun_last_run_at` |
| The "what changed" summary links to the latest report | PASS — it renders on the report itself; recent reports are linked from dashboard/reports list |
| Failed scheduled runs are logged and don't silently consume trust | PASS — `rerun_last_status: "failed"` recorded + logged; failed-attempt note shown in the toggle |
| Do not promise real-time monitoring | PASS — copy says "about once a month" |

---

## Post-Review Corrections (Stage 4 findings)

Three review findings were fixed after the initial Stage 4 implementation. All four checks remain green (137 tests, 135 pass, same 2 pre-existing failures).

### P1 — Cron could starve paid re-runs behind skipped inactive businesses (fixed)

`app/api/cron/scheduled-reruns/route.ts` previously did `slice(0, MAX_BATCH)` on the raw due list, *then* skipped inactive owners inside the loop. If the first 25 due businesses included lapsed/free owners, paid due businesses could be deferred indefinitely depending on DB return order.

**Fix:** resolve owners' plans first, filter the due list to `active` owners (`dueActive`), and **only then** apply `dueActive.slice(0, MAX_BATCH)`. Inactive businesses no longer occupy the batch. The response now reports `processed`, `succeeded`, `failed`, `skippedInactive`, and `deferred` (paid businesses beyond the cap, which run next invocation). Covered by a new ordering test asserting the active filter precedes the cap and the raw `due` list is never sliced.

### P2 — Lapsed users couldn't turn off an existing schedule (fixed)

`components/ScheduleToggle.tsx` only rendered the switch when `isActive`, so a lapsed user with `rerun_enabled === true` saw "Paid feature" and couldn't disable — contradicting the "disabling always allowed" design.

**Fix:** the switch now renders when `showSwitch = isActive || enabled`. A lapsed-but-enabled user sees an amber "your plan no longer includes scheduled re-runs — turn this off or upgrade" note **with a working switch they can turn off**. Re-enabling while not active is blocked client-side (`if (next && !isActive)`) in addition to the server's 403. The "Paid feature" lock now only shows for non-paid users who don't already have a schedule on. Covered by updated UI tests.

### P3 — Schedule toggle could report success on a no-op update (fixed)

`app/api/business/schedule/route.ts` updated by `id`+`user_id` but didn't verify a row was affected, so a missing/non-owned `businessId` could return `{ rerunEnabled }` despite changing nothing.

**Fix:** the update now `.select("id")`s the affected row; if none is returned it responds **404 "Business not found"** instead of a false success. Covered by updated schedule-route tests.

---

## Recommended Next Step

1. **Apply migrations `008` and `009` to live Supabase**, and **set `CRON_SECRET`** in Vercel, before/with deploying Stage 4. These are the hard prerequisites.
2. (Future, optional) Add email delivery of the "what changed" summary once an email provider is chosen — the data is already persisted.
3. (Optional, low priority) Fix the 2 pre-existing string-drift assertions in `launch-smoke-check.test.mjs` (lines 94, 149).
4. Proceed to **Stage 5: Agency and Consultant Pro Features** — client-ready PDF export and shareable report bundles first (export before complex multi-client workspace features), including the Stage 2 source/evidence context in exports.
