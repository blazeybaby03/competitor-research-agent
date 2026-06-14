# CompeteIQ Pre-Launch Frontend Design Review

Date: 4 June 2026
Selected direction: Clear Signal
Scope: frontend audit, design review, implementation planning only. No production frontend changes were made.

## Executive Summary

CompeteIQ is build-ready from a frontend correctness standpoint: `npm run verify` passed after typecheck, lint, smoke tests, and production build completed successfully. The main launch risk is not broken code; it is whether the UI communicates enough trust and value for first-time buyers before they sign up.

The selected Clear Signal direction is the right pre-launch choice. It matches the current Tailwind setup, keeps the existing light UI, avoids new dependencies, and focuses on practical SaaS credibility: real report preview, clear CTA, stronger trust copy, better dashboard states, and answer-first report readability.

The implementation should be a focused frontend polish pass. Do not copy the prototype HTML directly. Convert the concepts into proper Next.js App Router pages, React components, and Tailwind classes while preserving existing auth, Supabase, Stripe, report generation, trial-credit, URL validation, scraping, and AI logic.

## Current Frontend Readiness Status

Status: ready for Claude Code implementation planning, not yet launch-polished.

What is good:

- Existing Next.js 15 App Router project builds successfully.
- TypeScript, ESLint, smoke tests, and production build pass.
- The app already has a simple product flow: homepage, signup, dashboard, reports, report detail, and billing.
- Tailwind global component classes already support the Clear Signal direction.
- The backend-sensitive routes and launch-critical smoke coverage are already in place.

What is not yet strong enough for public launch:

- Homepage does not show a product/report preview above the fold.
- Trust signals are present but thin.
- Report detail page does not lead strongly enough with market gaps and recommended actions.
- Dashboard mobile navigation is incomplete because dashboard route links are hidden below `sm`.
- Loading and generating states are functional but not confidence-building.
- Pricing/billing copy can be clearer about the one free report, Stripe billing, and $79/month Pro plan.
- SEO/social metadata is minimal.

## Design Files Reviewed

Available files in `frontend-design`:

| File | Purpose | Implementation value | Notes |
| --- | --- | --- | --- |
| `frontend-design/index.html` | Entry page linking to the three design strategy documents. | Useful as navigation and context only. | Prototype/documentation HTML with inline CSS. Do not copy into production. |
| `frontend-design/01-research-report.html` | Research report comparing Crayon, Klue, Linear, Similarweb, and Perplexity. | Useful for design rationale, trust patterns, and report UX lessons. | Contains external links and inline CSS. Treat as strategy, not code. |
| `frontend-design/02-design-drafts.html` | Three design drafts: Clear Signal, Briefing Room, Radar. | Primary source for the selected Clear Signal launch direction. | Wireframes and specs are useful; HTML/CSS should not be copied directly. |
| `frontend-design/03-tooling-and-recommendation.html` | Tooling recommendations and phased implementation plan. | Useful for scope, dependency, and sequence decisions. | Correctly recommends existing Tailwind/classes first and shadcn/post-launch tooling later. |

Missing or not present:

- No `Marketing Site.html`, `App.html`, `colors_and_type.css`, `components.css`, `tweaks-panel.jsx`, logo assets, screenshots, or mockup image assets were present in `frontend-design`.
- `C:\Users\emaja\Downloads\Clear Signal.zip` was referenced by the request but was not found on disk. It was not reviewed.

## Existing App Files and Routes Reviewed

Core app/config files:

- `package.json`
- `README.md`
- `AGENTS.md`
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `next.config.ts`
- `middleware.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `.env.example`

Routes reviewed:

- `app/page.tsx` - public landing page.
- `app/(auth)/login/page.tsx` - login.
- `app/(auth)/signup/page.tsx` - signup.
- `app/auth/callback/route.ts` - Supabase auth callback, read for route map only.
- `app/(dashboard)/layout.tsx` - protected dashboard shell.
- `app/(dashboard)/dashboard/page.tsx` - business setup and report generation.
- `app/(dashboard)/reports/page.tsx` - reports list and empty state.
- `app/(dashboard)/reports/[id]/page.tsx` - report detail wrapper.
- `app/(dashboard)/billing/page.tsx` - billing and Pro plan UI.

Frontend components reviewed:

- `components/DashboardNav.tsx`
- `components/BusinessForm.tsx`
- `components/GenerateReportButton.tsx`
- `components/ReportView.tsx`
- `components/CheckoutButton.tsx`
- `components/BillingPortalButton.tsx`
- `components/UpgradePrompt.tsx`

Backend/API files were not edited. They were only considered as boundaries for what Claude Code must not touch.

## Clear Signal Design Summary

Clear Signal is a launch-safe polish pass, not a full redesign. It keeps the current light SaaS UI and improves the hierarchy around one promise: generate a useful competitor intelligence report quickly.

Key Clear Signal decisions to carry forward:

- Keep the existing sky-blue brand palette from `tailwind.config.ts`.
- Use existing global classes in `app/globals.css`: `.btn-primary`, `.btn-secondary`, `.input`, `.card`, `.badge-trial`, `.badge-active`.
- Keep Inter via `next/font` in `app/layout.tsx`; do not add external Google Fonts.
- Use `lucide-react`, already installed, for lightweight icon polish.
- Use one dominant CTA: "Generate your first report free."
- Show a real-looking report preview above the fold.
- Make the report page answer-first: executive summary, market gaps, recommended actions, then deeper competitor detail.
- Improve empty, loading, failed, trial-used, and Pro-active states.
- Keep top navigation for launch; no sidebar migration before launch.
- Defer shadcn/ui, animation libraries, charting, Storybook, and broader design-system work.

## Errors or Risks Found

### Design Artifact Risks

- The design files are raw HTML documents with inline CSS. They are useful for strategy but should not be copied into production.
- The files rely on static HTML wireframes, not React state, Next.js routing, or Tailwind component structure.
- No CDN React, Babel, or external Google Font imports were found in the available `frontend-design` files. If missing zip contents contain those patterns, Claude Code should still reject direct copying.
- External research links inside the HTML docs are fine for documentation but should not become production dependencies.
- Several prototype labels use symbols and low-fidelity wireframe copy. Production UI should use accessible text, semantic markup, and real app data.
- The requested zip file was unavailable, so any assets inside it could not be validated.

### Existing Frontend Risks

- `components/DashboardNav.tsx` hides Dashboard/Reports nav links on mobile with `hidden sm:flex` and does not provide a mobile replacement. This is the clearest frontend launch issue.
- `components/ReportView.tsx` places market gaps and recommended actions after competitor summaries, positioning, pricing, and strengths/weaknesses. That weakens the answer-first promise.
- `components/ReportView.tsx` generating state tells users to refresh the page. This works, but it feels rough for a paid SaaS and can increase abandonment during a roughly 60-second wait.
- `app/page.tsx` has no report preview above the fold, despite AGENTS.md and Clear Signal both calling that out as a trust requirement.
- `app/page.tsx` uses broad marketing copy and feature cards but does not show enough practical proof of what the user receives.
- The pricing CTA says "Start free trial" while the product promise is one free report and then Pro. This should be tightened to avoid trial ambiguity.
- `app/(dashboard)/dashboard/page.tsx` does not show a strong empty state when there are no recent reports.
- `app/(dashboard)/billing/page.tsx` disables checkout when `STRIPE_GROWTH_PRICE_ID` is missing via `CheckoutButton`, but the UI does not explain that setup problem to the user or operator.
- Icon-only buttons should have explicit `aria-label`s, especially sign out in `DashboardNav.tsx` and competitor removal in `BusinessForm.tsx`.
- Global metadata in `app/layout.tsx` is basic and lacks Open Graph/Twitter metadata for launch sharing.
- No route-level `loading.tsx`, `error.tsx`, or `not-found.tsx` files exist for the dashboard/report areas. Not required for launch, but useful for polish.

## Must Fix Before Launch

1. Mobile dashboard navigation

   File: `components/DashboardNav.tsx`

   Add a simple mobile-safe way to reach Dashboard, Reports, Billing/account, and sign out. Keep it lightweight. A compact row, menu button, or visible small nav is enough. Do not introduce a full sidebar or new component library.

2. Landing page proof above the fold

   File: `app/page.tsx`

   Add a real-looking report preview near the hero that shows executive summary, market gaps, recommended actions, and source/trust cues. Keep one primary CTA: "Generate your first report free."

3. Report page answer-first hierarchy

   File: `components/ReportView.tsx`

   Reorder and restyle completed report sections so the user sees executive summary, market gaps, and recommended actions before competitor detail. This is the highest-value Clear Signal product improvement.

4. Report generation wait state

   Files: `components/GenerateReportButton.tsx`, `components/ReportView.tsx`

   Replace generic spinner/refresh copy with a step-based expectation: scraping competitor pages, reading positioning, analyzing gaps, writing the report. Do not fake live backend progress unless the backend exposes it.

5. Pricing and billing clarity

   Files: `app/page.tsx`, `app/(dashboard)/billing/page.tsx`, `components/CheckoutButton.tsx`, `components/UpgradePrompt.tsx`

   Make the one free report and $79/month Pro upgrade unmistakable. Mention secure Stripe billing and unlimited reports for active subscribers. Preserve all Stripe API and price allowlisting behavior.

6. Accessibility labels for icon-only actions

   Files: `components/DashboardNav.tsx`, `components/BusinessForm.tsx`, possibly `components/ReportView.tsx`

   Add explicit labels or visible text where icons are the only affordance.

## Should Fix Before Launch

- Improve dashboard plan/trial status visibility near the top of `app/(dashboard)/dashboard/page.tsx`.
- Add a stronger no-reports empty state to dashboard and reports list surfaces.
- Improve failed report state with a clear next action back to Dashboard.
- Add practical use-case blocks on the homepage for founders, solo operators, consultants, agencies, and small businesses.
- Add a trust strip: one free report, no credit card required, secure billing via Stripe, server-side URL validation/safe scraping phrased in user-friendly terms.
- Add better metadata in `app/layout.tsx`: title template, Open Graph title/description, Twitter card metadata, and canonical app URL if available.
- Ensure CTA text is consistent across homepage, signup, dashboard, upgrade prompt, and billing.
- Tighten mobile spacing on report cards and billing cards after implementation.
- Add visual status consistency for `pending`, `generating`, `completed`, and `failed` reports.

## Post-Launch Improvements

- Add section jump links for long report pages.
- Add source/citation chips if report data later stores source-level evidence.
- Add route-level `loading.tsx` and `error.tsx` files for dashboard/report routes.
- Consider shadcn/Radix for specific primitives after launch, not as a pre-launch migration.
- Add richer form validation with Zod/react-hook-form only if it does not weaken server-side URL validation.
- Add Playwright visual smoke tests if the UI starts changing frequently.
- Add sample report route or public sample report once content can be curated safely.
- Explore Briefing Room as the next visual polish phase.
- Keep Radar as a later brand experiment after paying users validate the core funnel.

## Do Not Prioritize

- New frontend dependencies before launch.
- shadcn/ui migration as a broad rewrite.
- Heavy animation or Framer Motion.
- Charts unless current data genuinely supports them.
- Storybook, Chromatic, or full design-system infrastructure.
- Dark theme/Radar redesign.
- Complex sidebars or command palettes.
- Rewriting auth, billing, report generation, scraping, database, or API logic.
- Copying prototype HTML/CSS into production.
- Generic AI hype copy that cannot be proven inside the product.

## Recommended Implementation Sequence

1. Scope lock

   Confirm Claude Code will edit only frontend presentation files and shared UI components. Run `git status` first and preserve unrelated local changes.

2. Landing page

   Update `app/page.tsx` with Clear Signal hero, report preview, trust strip, practical 3-step flow, use cases, and one Pro pricing card.

3. Dashboard navigation and dashboard state

   Update `components/DashboardNav.tsx` for mobile navigation. Improve `app/(dashboard)/dashboard/page.tsx` hierarchy, trial state, generate panel, and recent reports empty state.

4. Report experience

   Update `components/ReportView.tsx` to be answer-first and improve generating/failed states.

5. Reports list and billing

   Update `app/(dashboard)/reports/page.tsx`, `app/(dashboard)/billing/page.tsx`, `components/CheckoutButton.tsx`, `components/BillingPortalButton.tsx`, and `components/UpgradePrompt.tsx` only as needed for clearer UI copy and states.

6. Metadata and global polish

   Update `app/layout.tsx` metadata and, if needed, small shared style utilities in `app/globals.css`. Avoid broad restyling.

7. Verification

   Run `npm run verify`. If needed, run `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` separately to isolate failures.

## Suggested Files Claude Code Should Edit

Primary:

- `app/page.tsx`
- `components/DashboardNav.tsx`
- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/reports/page.tsx`
- `components/ReportView.tsx`
- `components/GenerateReportButton.tsx`
- `app/(dashboard)/billing/page.tsx`
- `components/CheckoutButton.tsx`
- `components/BillingPortalButton.tsx`
- `components/UpgradePrompt.tsx`

Secondary if needed:

- `app/layout.tsx`
- `app/globals.css`
- `tailwind.config.ts` only for tiny token additions if truly necessary. Clear Signal can probably avoid this.
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`

## Suggested Files Claude Code Should Not Touch

Do not touch:

- `app/api/**`
- `app/auth/callback/route.ts`
- `lib/supabase/**`
- `lib/validateUrl.ts`
- `lib/ai.ts`
- `lib/scraper.ts`
- `lib/types.ts` unless a purely frontend typing bug requires it.
- `supabase/**`
- `middleware.ts` unless there is a proven frontend navigation reason, which is unlikely.
- `.env`, `.env.local`, `.env.example` unless only adding non-secret placeholder documentation is explicitly requested.
- `package.json` and `package-lock.json` unless a new dependency is explicitly approved. Default: no new dependencies.
- Stripe checkout, webhook, portal, subscription, or price allowlist logic.
- Trial-credit behavior.
- Database schema or RLS policies.

## Testing and Checklist Commands After Implementation

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Preferred single command:

```bash
npm run verify
```

Optional if a dev server/browser check is feasible:

```bash
npm run dev
```

Manual frontend checklist:

- Homepage loads on desktop and mobile.
- Homepage has one obvious primary CTA.
- Report preview is visible above the fold.
- Signup/login entry points still work visually.
- Dashboard mobile navigation exposes Dashboard, Reports, Billing/account, and sign out.
- Business form still supports 1-5 competitor URLs.
- Generate button is disabled when there are no competitors.
- Trial user sees one free report state.
- Trial-used user sees upgrade state.
- Pro user sees unlimited report state.
- Reports list has useful empty, generating, failed, and completed states.
- Report detail opens with summary, gaps, and actions.
- Copy report button still works.
- Billing page clearly shows Pro $79/month and secure Stripe billing.
- No production secrets appear in UI, logs, or committed files.

Verification baseline from this audit:

- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run test` passed with 14/14 launch smoke tests.
- `npm run build` passed.
- `npm run verify` passed with a longer timeout.

## Acceptance Criteria for Launch-Ready Frontend

- The app still passes `npm run verify`.
- No backend, auth, Stripe, Supabase, database, scraping, AI, URL validation, or trial-credit behavior is changed.
- Homepage clearly explains what the user gets and shows a report preview above the fold.
- Primary CTA is consistent: generate the first report free.
- Pricing is clear: one free report, then Pro at $79/month for unlimited reports.
- Mobile users can navigate the dashboard area.
- Report detail is answer-first and readable on mobile.
- Loading, failed, empty, trial, and Pro states are understandable.
- Icon-only controls have accessible labels.
- Metadata is suitable for public launch sharing.
- No new dependency was added unless explicitly justified and verified.

## Final Recommendation

Proceed with Claude Code implementation of Clear Signal as a focused frontend polish pass. The app is technically healthy enough for implementation because verification passes. The highest-value work is improving trust, mobile navigation, report readability, and billing clarity without changing backend behavior.

Do not attempt Briefing Room or Radar before launch. Use Clear Signal now, borrow only the lowest-risk Briefing Room ideas, and defer larger design-system or brand experiments until the public funnel has real users.
