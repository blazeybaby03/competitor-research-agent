# Stage 5 — Agency and Consultant Pro Features: Test Audit Report

**Date:** 2026-06-15
**Stage:** Stage 5 — Agency and Consultant Pro Features
**Goal:** Make Pro more valuable to repeat-use buyers by adding client-ready export — prioritising PDF/export before any complex multi-client workspace features — including the Stage 2 source/evidence context.

---

## Summary of Changes

Stage 5 adds a **client-ready PDF export** with a light white-label cover page (prepared-for client / prepared-by consultant), built on the browser's print-to-PDF path so it adds **zero dependencies** and no server-side PDF service. The full report — including the Stage 2 "Sources analysed" evidence — is included in the export; interactive chrome (nav, buttons) is excluded.

### Design decisions

1. **Print-to-PDF, not a PDF library/headless browser.** Server-side PDF (puppeteer/playwright) would add a heavy dependency and slow serverless functions. Instead, a `@media print` stylesheet + `window.print()` produces a clean PDF via the browser's "Save as PDF". This is the lightweight, roadmap-aligned choice ("export first; do not build a full CRM"). No new npm packages.

2. **Export before share-links / workspaces.** Per the roadmap's "prioritise PDF/export before complex multi-client workspace features", Stage 5 ships export only. A public shareable link (token + auth-bypassing route) is intentionally deferred — it expands the access-control surface, which the roadmap says to keep simple.

3. **Light white-label, no schema.** The cover page takes a "Prepared for" (client) and "Prepared by" (consultant/agency) value entered at export time. "Prepared by" is remembered in `localStorage` so a consultant types it once. No DB columns, no profile writes — keeps the stage lightweight.

4. **Paid-gated (Pro/agency value).** Client-ready export is gated to active paid subscribers (the Stage 5 success metric is paid/Pro conversion). Free/trial users see a locked "Export PDF" button that routes to billing. The gate is a soft, conversion-oriented gate on the polished branded experience (raw browser print is always available via the browser menu) — documented as such.

5. **Evidence included automatically.** Because the Stage 2 "Sources analysed" section is part of the report (and not marked `no-print`), exported PDFs include source URLs, scrape status, and timestamps — satisfying the roadmap's "exported reports include source/evidence context once Stage 2 exists."

### What changed and why

1. **`lib/export.ts` (new)** — pure `exportDocumentTitle(reportTitle, clientName)` (builds the client-branded PDF filename via `document.title`) and `preparedByLabel(preparedBy)` (falls back to "CompeteIQ"). Unit-tested.

2. **`app/globals.css`** — print rules: `.no-print` hides chrome, `.print-only` reveals the cover page, cards lose shadows/avoid breaking, `.report-cover` breaks to its own page, links print as plain text.

3. **`components/ReportView.tsx`** — added `isActive` prop; white-label state (`clientName`, `preparedBy` with `localStorage` persistence); an "Export PDF" control (working for paid, billing-link for free); a paid-only export panel with the two white-label inputs; a print-only white-label cover page; and `handleExport` which sets a client-branded `document.title`, calls `window.print()`, and restores the title on `afterprint`. Interactive chrome marked `no-print`.

4. **`app/(dashboard)/reports/[id]/page.tsx`** — passes `isActive` into `ReportView`; marks the back-link and upgrade notice `no-print`.

5. **`components/DashboardNav.tsx`** — root nav marked `no-print` so it's excluded from exported PDFs.

6. **`app/(dashboard)/billing/page.tsx` + `app/page.tsx`** — added "Scheduled monthly re-runs" (Stage 4) and "Client-ready PDF export" (Stage 5) to the Starter and Pro feature lists, aligning pricing copy with shipped paid value.

---

## Files Changed

| File | Change type |
|---|---|
| `lib/export.ts` | **New** — pure export-title / prepared-by helpers |
| `components/ReportView.tsx` | Export controls, white-label panel, print-only cover page, `handleExport` |
| `app/globals.css` | `@media print` rules + `.no-print`/`.print-only` |
| `components/DashboardNav.tsx` | Nav marked `no-print` |
| `app/(dashboard)/reports/[id]/page.tsx` | Passes `isActive`; marks chrome `no-print` |
| `app/(dashboard)/billing/page.tsx` | Paid plan feature lists (re-runs + PDF export) |
| `app/page.tsx` | Homepage paid plan feature lists |
| `scripts/stage-5-export.test.mjs` | **New** — 9 Stage 5 tests |

No schema changes. No changes to `lib/ai.ts`, billing/pricing logic, auth, scrape jobs, or report generation.

---

## Tests Run

| Command | Result |
|---|---|
| `npm run typecheck` | **PASS** — No TypeScript errors |
| `npm run lint` | **PASS** — No lint errors |
| `npm run test` | **146 tests, 144 pass, 2 fail** — 9 new Stage 5 tests (all pass); the 2 failures are the same pre-existing smoke-test string drift, **unrelated to Stage 5** |
| `npm run build` | **PASS** — 19 routes. `.next` cleared first to avoid a transient Windows/Dropbox `EBUSY` lock. |

### Raw pass/fail per command

- `npm run typecheck` → exit 0, clean.
- `npm run lint` → exit 0, clean.
- `npm run test` → exit 1. `tests 146 / pass 144 / fail 2`.
- `npm run build` → exit 0. "Compiled successfully", 19/19 static pages.

### Stage 5 automated coverage (`scripts/stage-5-export.test.mjs`, 9 tests, all passing)

**Behavioral:**
1. `exportDocumentTitle` prefixes the client name; ignores blank/null client.
2. `exportDocumentTitle` falls back to "Competitor Report" for an empty title.
3. `preparedByLabel` falls back to "CompeteIQ" when blank/null.

**Structural:**
4. Report view gates export behind paid status — paid users get `handleExport`/`window.print()`; free users get a billing link.
5. Report view builds a print-only white-label cover page (`Prepared for`, `preparedByLabel`), sets a client-branded `document.title`, and persists "prepared by" to `localStorage`.
6. Source evidence ("Sources analysed") is part of the printable output; interactive chrome is `no-print`.
7. Global CSS defines `@media print`, `.no-print` (display none), `.print-only`, and the `.report-cover` page break.
8. Dashboard nav is `no-print`.
9. Report detail page derives paid status and passes `isActive` to `ReportView`.

---

## Failures Found

Only the 2 pre-existing smoke-test string-drift assertions (`launch-smoke-check.test.mjs:94` `router.push("/dashboard")`, `:149` `currentPlan.name`). Login/billing-variable code was not touched in Stage 5. Queued for a test-maintenance pass.

---

## Fixes Applied

None — Stage 5 was clean across typecheck, lint, build on the first complete run.

---

## Remaining Risks

| Risk | Severity | Notes |
|---|---|---|
| Print fidelity varies by browser | Low–Medium | Browser print-to-PDF output (margins, page breaks, colour) differs slightly across Chrome/Safari/Firefox. The CSS avoids breaking inside cards and gives the cover page its own page, but exact pagination isn't pixel-controlled. Acceptable for a lightweight v1; a server-side renderer could follow if pixel-perfect output is needed. |
| Export gate is soft | Low | Gating hides the branded export button/panel for free users, but `window.print()` is always reachable via the browser menu (without the white-label cover/branding). This is intended — the paid value is the branded, client-ready experience, not blocking printing outright. |
| No automated visual/print verification | Low | The print output was validated via structural tests (CSS rules, print-only/no-print markers) and build, not a rendered PDF. A manual print preview is recommended before relying on it for a client deliverable. |
| White-label not persisted server-side | Low | "Prepared by" lives in `localStorage` (per-browser), "prepared for" is per-export. Fine for v1; persisting agency branding on the profile is a future nicety. |
| 2 pre-existing smoke-test failures | Low | Unrelated string drift. Fix in a test-maintenance pass. |

---

## Acceptance Criteria Check (roadmap Stage 5)

| Criterion | Status |
|---|---|
| Client-ready PDF export | PASS — print-to-PDF with white-label cover page |
| Prioritise export before complex multi-client workspace features | PASS — export only; share-links / workspaces deferred |
| Light white-label (client name, consultant/agency name, simple cover page) | PASS — "Prepared for" + "Prepared by" cover page |
| A consultant can produce a presentable report without manual copying | PASS — one-click export of the full formatted report |
| Exported reports include source/evidence context (Stage 2) | PASS — "Sources analysed" prints with the report |
| Keep report privacy and access control simple | PASS — no new public routes/tokens; export is local to the authed report view |
| Multi-client organisation only if volume proves the need | PASS — deliberately not built |

---

## Recommended Next Step

1. **Manual print-preview check** of a real report PDF (cover page + sections + sources) in Chrome before promoting export as a client deliverable.
2. (Future, optional) Add a public shareable report link (token-scoped, read-only) if demand appears — kept out of Stage 5 to preserve simple access control.
3. (Future, optional) Persist agency branding ("prepared by", logo) on the profile for repeat consultants.
4. (Optional, low priority) Fix the 2 pre-existing string-drift assertions in `launch-smoke-check.test.mjs` (lines 94, 149).

> Roadmap status: Stages 1–5 of the research-led roadmap are now implemented, tested, and audited. Deploy prerequisites carried forward: apply migrations **008** and **009** to live Supabase, and set **`CRON_SECRET`** in Vercel, before/with shipping the code that depends on them.
