# Codex Pre-Launch Progress Report

## Executive Summary

- Overall status: READY for backend launch.
- Launch recommendation: Backend launch gates are verified. Proceed with public launch after optional cleanup of the paid test subscription/refund.
- Biggest completed backend fixes: Supabase RLS hardening, live Stripe product/price/webhook setup, Stripe Customer Portal setup, production AI model fix, and successful production report-generation smoke.
- Remaining launch flags: no backend P0/P1 launch blockers remain. Optional cleanup: cancel/refund the paid test subscription.
- Customer URL: `https://competitor-research-agent-two.vercel.app`.

## Work Completed

### Supabase Production Hardening

- Added repo migration: `supabase/migrations/005_production_policy_hardening.sql`.
- Applied production Supabase migration `20260602225318 production_policy_hardening`.
- Removed `Users can update own profile` from production.
- Recreated ownership policies with explicit `WITH CHECK` for:
  - `public.businesses`
  - `public.competitors`
  - `public.reports`
- Recreated `scrape_jobs` select policy using `(select auth.uid())`.
- Revoked public/authenticated execute on helper functions:
  - `handle_new_user`
  - `rls_auto_enable`
- Confirmed service-role-only grants for:
  - `try_consume_trial_credit`
  - `restore_trial_credit`
- Preserved authenticated `replace_competitors` RPC with ownership validation.
- Added `idx_scrape_jobs_competitor_id`.

### Stripe Billing And Cancellation

- Created/verified live Pro product and $79/month recurring price.
- Aligned Vercel Production Stripe secret and publishable keys to the same live account as the Pro price and webhook.
- Created live webhook endpoint for:
  - `https://competitor-research-agent-two.vercel.app/api/billing/webhook`
- Configured webhook events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Set Vercel Production:
  - `STRIPE_SECRET_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_GROWTH_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
- Added authenticated Stripe billing portal route:
  - `app/api/billing/portal/route.ts`
- Added client button:
  - `components/BillingPortalButton.tsx`
- Hardened checkout against stale stored Stripe customer IDs:
  - validates existing `profiles.stripe_customer_id` against the current live Stripe account
  - creates and persists a replacement customer if the stored customer is missing/deleted
  - returns a safe JSON error if Checkout session creation fails
- Replaced generic checkout browser alert with an inline error message.
- Fixed live webhook entitlement handling for subscriptions that arrive without `metadata.supabase_user_id`:
  - webhook still prefers subscription metadata when present
  - falls back to matching `subscription.customer` against `profiles.stripe_customer_id`
  - applies the same fallback for create/update/delete subscription events
- Updated billing page so active subscribers can manage subscription, invoices, payment details, or cancellation through Stripe Customer Portal.
- Configured live Stripe Customer Portal:
  - subscription cancellation enabled at period end
  - payment method update enabled
  - invoice history enabled
- Added optional `NEXT_PUBLIC_SUPPORT_EMAIL` fallback display on billing page and documented it in `.env.example`.
- Set Vercel Production `NEXT_PUBLIC_SUPPORT_EMAIL=agent-codex@agentmail.to`.
- Verified production billing page renders `agent-codex@agentmail.to` with `mailto:agent-codex@agentmail.to`.

### Report Generation

- Investigated production report-generation failure.
- Found prior root cause: Anthropic returned `model not found` for `claude-sonnet-4-20250514`.
- Queried Anthropic Models API with the account key without printing secrets.
- Confirmed available Sonnet model: `claude-sonnet-4-6`.
- Updated:
  - `lib/ai.ts`
  - `.env.example`
  - Vercel Production `AI_MODEL`
- Redeployed production.
- Ran production end-to-end report smoke:
  - disposable user: `codex-launch-1780442497230@example.com`
  - report URL: `https://competitor-research-agent-two.vercel.app/reports/86e2769c-301c-466a-9965-959eb55a32ed`
  - Supabase latest report status: `completed`
  - `trial_reports_used`: `1`
  - `subscription_status`: `trial`

### Launch Planning

- Updated backend operations plan:
  - `docs/prelaunch-backend-operations-plan.md`
- Updated paste-ready Claude Code prompt:
  - `docs/claude-code-prelaunch-prompt.md`
- Updated full launch report:
  - `reports/full-system-launch-test-report.md`

## Verification Completed

Commands and checks:

| Check | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript compile check passed inside `npm run verify`. |
| `npm run lint` | PASS | ESLint passed inside `npm run verify`. |
| `npm run test` | PASS | 8 launch smoke tests passed. |
| `npm run build` | PASS | Next.js production build passed; `/api/billing/portal` included. |
| `npm run verify` | TIMEOUT | Wrapper timed out after about 4 minutes in this turn; component checks below passed separately. |
| `npm run typecheck` | PASS | `tsc --noEmit` passed. |
| `npm run lint` | PASS | ESLint passed. |
| `npm run test` | PASS | 14 launch smoke tests passed. |
| `npm run build` | PASS | Next.js production build passed. |
| Vercel production deploy | PASS | Deployment `dpl_4r7wyeKFXs2E8mDKxTA7VyUDFEYF`, aliased to customer URL. |
| Production public routes | PASS | `/`, `/login`, `/signup` return 200. |
| Protected route redirects | PASS | `/dashboard`, `/reports`, `/billing` return 307 to `/login`; PowerShell also emitted expected max-redirect warnings after status capture. |
| Production report smoke | PASS | Test user generated completed report `86e2769c-301c-466a-9965-959eb55a32ed`. |
| Production checkout session smoke | PASS | Authenticated test user posted corrected price ID, `/api/billing/checkout` returned 200, redirected to `checkout.stripe.com`, and persisted a Stripe customer. |
| Checkout stale customer recovery | PASS | After patch/deploy, production checkout with corrected price returned 200, reached `checkout.stripe.com`, and persisted a Stripe customer. |
| Live payment entitlement | PASS | Live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8` verified active, Supabase profile `agent-codex@agentmail.to` is `active`, expected subscription ID is stored, and `try_consume_trial_credit` returns `subscriber`. |
| Webhook metadata fallback | PASS | Initial live webhook returned 200 but skipped because subscription metadata was missing; patched/deployed fallback to `stripe_customer_id`, then a live subscription update POST reached `/api/billing/webhook` and returned 200 without the skip warning. |
| Stripe Customer Portal config | PASS | Created config `bpc_1Te1f6CHQLJhk243p4GBsW4o`; cancellation, payment updates, invoice history enabled. |
| Production support email | PASS | Authenticated billing page shows `agent-codex@agentmail.to` and links to `mailto:agent-codex@agentmail.to`. |
| `npm audit` | FLAG | 2 moderate Next/PostCSS advisories; breaking force-fix not applied. |

## Remaining Launch Gates

### Optional Human Cleanup

- Cancel the test subscription through Stripe Customer Portal or Stripe Dashboard when no longer needed.
- Refund the test payment in Stripe Dashboard if desired.

### Safe Post-Launch / Follow-Up

- Enable Supabase leaked password protection in the Auth dashboard.
- Keep `replace_competitors` security-definer advisor under review; it is intentional because it validates `auth.uid()` ownership internally.
- Resolve npm audit's moderate Next/PostCSS advisory through a safe non-breaking framework update.
- Add more automated tests around authenticated checkout, webhook state transitions, and subscriber quota behavior.

## Current Recommendation

Backend launch readiness is verified. The remaining work is operational cleanup only: cancel/refund the live test subscription if desired, then move on to visual/front-end launch polish.
