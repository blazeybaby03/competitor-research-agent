# Claude Code Prompt: Implement Clear Signal Frontend Polish for CompeteIQ

You are acting as a senior Next.js frontend implementation agent for CompeteIQ.

Implement the approved Clear Signal frontend direction using the audit report as the source of truth.

Do not research. Do not redesign from scratch. Do not implement backend changes.

## 1. Project Context

CompeteIQ is a Next.js 15 App Router AI SaaS app for competitor research, competitor intelligence reports, business analysis, dashboards, report generation, and billing/account management.

The backend is already confirmed ready for public launch. This task is frontend-only.

The current product promise must be preserved:

- User signs up.
- User adds a business and competitor URLs.
- User gets one free competitor intelligence report.
- User upgrades to Pro for unlimited reports.
- Stripe, Supabase, URL validation, scraping, AI generation, and trial-credit behavior remain unchanged.

Selected frontend direction: Clear Signal.

Clear Signal means:

- Light, trustworthy, direct SaaS UI.
- Fastest path to public launch.
- Existing Tailwind, existing brand tokens, existing component classes.
- Practical proof over vague AI hype.
- Strong report preview, clear CTA, readable dashboard, answer-first reports, clear billing.

## 2. Source Files to Read First

Read these before editing:

- `AGENTS.md`
- `frontend-design/reports/pre-launch-frontend-design-review.md`
- `frontend-design/index.html`
- `frontend-design/01-research-report.html`
- `frontend-design/02-design-drafts.html`
- `frontend-design/03-tooling-and-recommendation.html`
- `package.json`
- `README.md`
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/reports/page.tsx`
- `app/(dashboard)/reports/[id]/page.tsx`
- `app/(dashboard)/billing/page.tsx`
- `components/DashboardNav.tsx`
- `components/BusinessForm.tsx`
- `components/GenerateReportButton.tsx`
- `components/ReportView.tsx`
- `components/CheckoutButton.tsx`
- `components/BillingPortalButton.tsx`
- `components/UpgradePrompt.tsx`

Treat the HTML files in `frontend-design` as prototype and planning artifacts only. Do not copy raw prototype HTML, inline CSS, CDN patterns, or documentation markup into production.

## 3. Files and Folders Likely to Edit

Primary frontend files:

- `app/page.tsx`
- `app/layout.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/reports/page.tsx`
- `app/(dashboard)/billing/page.tsx`
- `components/DashboardNav.tsx`
- `components/GenerateReportButton.tsx`
- `components/ReportView.tsx`
- `components/CheckoutButton.tsx`
- `components/BillingPortalButton.tsx`
- `components/UpgradePrompt.tsx`

Optional if needed:

- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/globals.css`
- `tailwind.config.ts`

Use optional files only for focused frontend polish. Avoid broad restyling.

## 4. Files and Folders Not to Touch

Do not edit:

- `app/api/**`
- `app/auth/callback/route.ts`
- `lib/supabase/**`
- `lib/validateUrl.ts`
- `lib/ai.ts`
- `lib/scraper.ts`
- `supabase/**`
- `middleware.ts`
- `.env`
- `.env.local`
- production secrets
- database schema
- RLS policies
- Stripe checkout/webhook/portal route logic
- report generation route logic
- trial-credit logic
- scraping logic
- AI prompt/generation logic

Do not edit `package.json` or `package-lock.json` unless a new dependency is explicitly approved. Default to no new dependencies.

## 5. Required Working Boundaries

You must:

- Preserve existing app behavior.
- Preserve auth redirects and protected dashboard behavior.
- Preserve server-side Stripe price allowlisting.
- Preserve Stripe webhook signature verification.
- Preserve Supabase RLS and service-role boundaries.
- Preserve server-side URL validation and SSRF protections.
- Preserve trial-credit consumption and recovery semantics.
- Preserve report generation API behavior.
- Preserve existing form submissions and API payload shapes.

You must not:

- Change backend logic.
- Change database schema.
- Change Stripe/payment logic.
- Change auth logic.
- Introduce unnecessary dependencies.
- Copy CDN React/Babel prototype code into production.
- Use raw prototype HTML directly.
- Overbuild.
- Replace the app architecture.
- Implement Briefing Room or Radar as a full redesign.

## 6. Subagent Instructions

Deploy subagents simultaneously before editing. Keep their scopes narrow.

Subagent 1: Landing and conversion

- Inspect `app/page.tsx`, `app/layout.tsx`, and the Clear Signal sections in `frontend-design/02-design-drafts.html`.
- Recommend the smallest launch-safe changes for hero hierarchy, report preview, trust strip, pricing clarity, use cases, FAQ, and CTA consistency.
- Do not recommend new dependencies.

Subagent 2: Product flow and dashboard UX

- Inspect `components/DashboardNav.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/reports/page.tsx`, `components/BusinessForm.tsx`, and `components/GenerateReportButton.tsx`.
- Recommend focused improvements for mobile navigation, trial/Pro state, empty states, generation state, and report list readability.
- Do not change API behavior.

Subagent 3: Report and billing readability

- Inspect `components/ReportView.tsx`, `app/(dashboard)/billing/page.tsx`, `components/CheckoutButton.tsx`, `components/BillingPortalButton.tsx`, and `components/UpgradePrompt.tsx`.
- Recommend answer-first report hierarchy, clearer failed/generating states, better copy-report affordance, and billing trust copy.
- Do not change Stripe route logic or price handling.

Subagent 4: Launch safety

- Inspect the proposed edits before implementation.
- Confirm they do not touch backend/auth/payment/database/scraping/AI/trial-credit logic.
- Confirm all proposed changes can be verified with existing scripts.

After subagent review, implement only the agreed frontend presentation changes.

## 7. Step-by-Step Implementation Tasks

1. Run `git status -sb`.

   Preserve unrelated local changes. Do not revert or stage unrelated files.

2. Implement the Clear Signal homepage.

   File: `app/page.tsx`

   Requirements:

   - One primary CTA: "Generate your first report free".
   - Keep login/signup routes intact.
   - Add a real-looking report preview above the fold.
   - Add trust strip: one free report, no credit card required, secure billing via Stripe, built for founders/operators.
   - Add concise 3-step flow.
   - Add practical use cases for founders, solo operators, consultants, agencies, and small businesses.
   - Add clear Pro pricing: $79/month, unlimited reports, up to 5 competitors, secure Stripe billing.
   - Avoid generic AI hype.
   - Keep page fast, responsive, and simple.

3. Improve metadata.

   File: `app/layout.tsx`

   Requirements:

   - Keep `next/font` Inter.
   - Add launch-ready metadata: title, description, title template if useful, Open Graph, Twitter card.
   - Do not introduce external fonts.

4. Fix dashboard mobile navigation.

   File: `components/DashboardNav.tsx`

   Requirements:

   - Mobile users must be able to reach Dashboard, Reports, Billing/account, and sign out.
   - Keep implementation simple.
   - Add accessible labels for icon-only buttons.
   - Do not introduce a heavy sidebar or new menu library.

5. Improve dashboard hierarchy and empty states.

   File: `app/(dashboard)/dashboard/page.tsx`

   Requirements:

   - Show trial/Pro status clearly near the top.
   - Show free report remaining or Pro unlimited state.
   - Make business setup and generate report CTA feel connected.
   - Add useful empty state when there are no recent reports.
   - Preserve existing data fetching and API behavior.

6. Improve generation state.

   File: `components/GenerateReportButton.tsx`

   Requirements:

   - Keep the existing `/api/reports/generate` call unchanged.
   - Keep disabled state when competitor count is zero.
   - Replace generic spinner copy with step-based expectation copy: scraping, reading, analyzing, writing.
   - Do not fake real-time backend progress.

7. Improve report detail readability.

   File: `components/ReportView.tsx`

   Requirements:

   - Completed reports should open with executive summary, market gaps, and recommended actions.
   - Competitor summaries, positioning, pricing, and strengths/weaknesses should follow.
   - Improve generating and failed states with clearer next steps.
   - Keep copy-report behavior intact.
   - Add accessible labels where needed.
   - Keep mobile readability strong.

8. Improve reports list.

   File: `app/(dashboard)/reports/page.tsx`

   Requirements:

   - Keep query behavior unchanged.
   - Improve empty state copy and CTA.
   - Make statuses visually consistent.
   - Keep mobile layout readable.

9. Improve billing/account clarity.

   Files:

   - `app/(dashboard)/billing/page.tsx`
   - `components/CheckoutButton.tsx`
   - `components/BillingPortalButton.tsx`
   - `components/UpgradePrompt.tsx`

   Requirements:

   - Keep Stripe route calls unchanged.
   - Keep `STRIPE_GROWTH_PRICE_ID` usage unchanged.
   - Make Pro plan value clear: $79/month, unlimited reports, secure Stripe billing.
   - Show helpful user/operator copy if checkout is disabled because no price ID is configured.
   - Make active Pro state clear.
   - Make trial-used upgrade state clear.

10. Optional auth page polish.

   Files:

   - `app/(auth)/login/page.tsx`
   - `app/(auth)/signup/page.tsx`

   Requirements:

   - Only adjust copy/visual hierarchy if it improves trust and does not risk auth behavior.
   - Keep Supabase auth calls unchanged.

## 8. Visual System Instructions

Use Clear Signal:

- Background: white and `gray-50`.
- Text: `gray-900`, `gray-700`, `gray-500`.
- Brand: existing `brand` colors from `tailwind.config.ts`.
- Success: green.
- Trial/waiting: amber/yellow.
- Failure: red.
- Components: existing `.card`, `.btn-primary`, `.btn-secondary`, `.input`, `.badge-trial`, `.badge-active`.
- Icons: `lucide-react` only.
- Typography: current Inter via `next/font`.
- Radius/shadows: keep existing rounded cards and subtle borders.

Do not add:

- shadcn/ui.
- Radix migration.
- Framer Motion.
- Chart libraries.
- Storybook.
- New icon libraries.
- External Google Font links.
- CDN scripts.

## 9. UX Instructions

Prioritize:

- One obvious CTA per screen.
- Report preview before abstract feature claims.
- Clear trial and Pro states.
- Fast scanability.
- Practical proof.
- Short, direct copy.
- Simple navigation.
- Helpful failed/empty/loading states.

Avoid:

- Generic AI hype.
- Dense dashboard firehose.
- Tab sprawl.
- Feature bloat.
- Decorative-only UI.
- Complex interaction patterns.

## 10. Accessibility Instructions

Must include:

- Semantic headings in order.
- Accessible names for icon-only buttons.
- Visible focus states through existing button/input styles.
- Sufficient color contrast.
- Labels for form controls.
- Buttons for actions, links for navigation.
- Reduced reliance on color alone for status.
- Mobile tap targets that are large enough.

Do not create inaccessible custom menus or dialogs.

## 11. Mobile Responsiveness Instructions

Must verify:

- Homepage hero and report preview stack cleanly.
- Pricing card fits mobile width.
- Dashboard navigation works below `sm`.
- Dashboard cards stack without overflow.
- Competitor URL inputs and remove buttons fit small screens.
- Report detail sections are readable on mobile.
- Copy report and billing buttons do not overflow.
- Long URLs and report titles do not break layout.

Use Tailwind responsive utilities already present in the project.

## 12. SEO and Metadata Instructions

Update metadata in `app/layout.tsx` for launch:

- Strong title.
- Strong description.
- Open Graph title and description.
- Twitter card metadata.
- Use `NEXT_PUBLIC_APP_URL` if the existing project pattern supports it safely; otherwise keep static metadata without runtime risk.

Do not add a dependency for SEO.

## 13. Testing Instructions

After implementation, run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Then run the canonical check if time allows:

```bash
npm run verify
```

If a command fails:

- Diagnose the root cause.
- Fix only frontend issues introduced by this task.
- Do not hide failures.
- If a failure is unrelated or blocked by credentials/local services, document the exact blocker.

Manual verification:

- Open homepage at desktop and mobile widths.
- Check login/signup visual entry points.
- Check dashboard navigation on mobile.
- Check dashboard empty, ready, trial, trial-used, and Pro states where possible.
- Check reports list empty/completed/generating/failed states where possible.
- Check report detail readability.
- Check billing page and checkout disabled/error states.
- Confirm no backend behavior changed.

## 14. Acceptance Criteria

The frontend implementation is acceptable only if:

- `npm run verify` passes, or any blocker is documented precisely.
- No backend/auth/payment/database/scraping/AI/trial-credit logic changed.
- Homepage has a report preview above the fold.
- Homepage has one clear primary CTA.
- Mobile dashboard navigation works.
- Report detail is answer-first.
- Generation state explains the expected wait.
- Billing copy clearly explains Pro and secure Stripe billing.
- Empty/loading/error states are improved.
- Accessibility labels are added for icon-only actions.
- No unnecessary dependency was introduced.
- Existing product behavior is preserved.

## 15. Final Report Format to Return

Return a concise implementation summary with:

1. What changed
2. Why it matters
3. How to run/test it
4. Risks or notes
5. Next best step

Also include:

- Files changed.
- Verification commands run and their results.
- Any manual checks that still need to be done.
- Confirmation that backend/auth/payment/database logic was not changed.
