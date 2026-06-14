# Full System Launch Test Report

## Executive Summary

- Overall status: READY for backend launch.
- Launch recommendation: Backend launch gates are verified. Proceed with public launch after optional cleanup of the paid test subscription/refund.
- Biggest completed backend fix: production report generation now completes end-to-end after replacing the unavailable Anthropic model with `claude-sonnet-4-6`.
- Biggest final backend fix: live subscription webhooks can now resolve users by subscription metadata or by stored Stripe customer ID, covering the real live-mode event that arrived without metadata.
- Customer URL: `https://competitor-research-agent-two.vercel.app`.
- Do not share generated deployment-specific Vercel URLs with customers.

## Test Environment

- Date/time: 2026-06-03 AWST.
- Branch: `main`.
- Production URL: `https://competitor-research-agent-two.vercel.app`.
- Vercel production deployment: `dpl_Cn9PVacbirxHTzvu7go6LAxtBrF2`.
- Supabase project reference: `yzwkvwcflnnwrcyadqzv`.
- Stripe mode: live product, live price, live webhook, and live Customer Portal configuration verified without printing secrets.
- Anthropic model now configured: `claude-sonnet-4-6`.

## Results Matrix

| Area | Status | Evidence | Notes |
|---|---|---|---|
| Landing page | PASS | Customer URL `/` returns 200. | Publicly reachable. |
| Signup | PASS | `/signup` returns 200. | Full email verification with user-owned inbox still useful. |
| Login | PASS | `/login` returns 200; production smoke logged in with disposable confirmed Supabase user. | Auth flow worked for generated test user. |
| Dashboard | PASS | `/dashboard` redirects unauthenticated users to `/login`; production smoke loaded dashboard after login. | Protected route behavior correct. |
| Business save | PASS | Production smoke saved business and competitor through UI/API. | Competitor URL used: `https://example.com`. |
| Report generation | PASS | Production smoke generated completed report `86e2769c-301c-466a-9965-959eb55a32ed`. | Trial credit consumed exactly once. |
| Failed report credit recovery | PASS | Earlier failed report from unavailable Anthropic model left `trial_reports_used = 0`. | Confirms restoration path worked for that failure. |
| Stripe checkout config | PASS | Authenticated production Checkout session creation returns 200 and reaches `checkout.stripe.com`; human live subscription payment completed. | Live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8`. |
| Stripe webhook | PASS | Live webhook endpoint exists, Vercel `STRIPE_WEBHOOK_SECRET` is set, missing-signature request returns 400, and live subscription update POST returned 200 after the fallback fix. | Initial live event exposed missing subscription metadata; fixed by falling back to `stripe_customer_id`. |
| Payment activation follow-up | PASS | Supabase profile `agent-codex@agentmail.to` is `active`, expected subscription ID is stored, and entitlement RPC returns `subscriber`. | Paid entitlement verified. |
| Billing portal | PASS | App route deployed; live Customer Portal configured for cancellation, payment method updates, invoice history. | Cancel/refund test subscription if desired. |
| Supabase database | PASS WITH FLAGS | Hardening migration applied; profile update policy removed; ownership `WITH CHECK` policies present. | Remaining advisor: intentional `replace_competitors` security-definer warning; leaked password protection disabled. |
| Production routes | PASS | `/`, `/login`, `/signup` return 200; `/dashboard`, `/reports`, `/billing` return 307 to `/login`. | PowerShell emitted max-redirect warning after capturing 307, expected for forced no-follow checks. |
| Local automated checks | PASS WITH WRAPPER TIMEOUT | `npm run verify` timed out after about 4 minutes in this turn, but `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` each passed separately. | 14 smoke tests passed. |
| Dependency audit | FLAG | `npm audit` reports 2 moderate Next/PostCSS advisories. | Breaking force-fix not applied. |
| Support contact | PASS | Production billing page shows `agent-codex@agentmail.to` with `mailto:agent-codex@agentmail.to`. | Customer Portal also covers cancellation. |

## Detailed Findings

### Report Generation

- Previous production failure root cause: Anthropic API returned `model not found` for `claude-sonnet-4-20250514`.
- Account-specific Models API returned available models including `claude-sonnet-4-6`.
- Code and production env now use `claude-sonnet-4-6`.
- Production smoke result:
  - user `codex-launch-1780442497230@example.com`
  - report `86e2769c-301c-466a-9965-959eb55a32ed`
  - status `completed`
  - `trial_reports_used = 1`
  - `subscription_status = trial`

### Stripe

- Live Pro product/price created and configured.
- Vercel Production Stripe secret and publishable keys aligned to the same live account as the Pro price/webhook after checkout initially returned `No such price`.
- Authenticated Checkout session creation verified:
  - request used `price_1Te1NDCHQLJhk243PoMxR5HG`
  - `/api/billing/checkout` returned 200
  - browser reached `checkout.stripe.com`
  - Stripe customer was persisted for the test user
- Existing accounts can now recover from stale `stripe_customer_id` values left from the earlier wrong Stripe account configuration:
  - checkout validates the stored customer in the current live Stripe account
  - missing/deleted customers are replaced and saved through the service role
  - session creation failures return safe JSON instead of a generic client crash
- Live webhook endpoint created for `https://competitor-research-agent-two.vercel.app/api/billing/webhook`.
- Webhook events configured:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Vercel Production variables updated:
  - `STRIPE_GROWTH_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
- Webhook route still rejects missing signatures with 400.
- Live Customer Portal config `bpc_1Te1f6CHQLJhk243p4GBsW4o` created with cancellation, payment method update, and invoice history.
- Live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8` completed.
- Initial live webhook for the subscription reached production but logged a skip because the subscription object had no `metadata.supabase_user_id`.
- Webhook handler was patched and deployed to resolve the Supabase user by either `subscription.metadata.supabase_user_id` or `subscription.customer` matched to `profiles.stripe_customer_id`.
- The active subscription was reconciled to Supabase, then metadata was patched on the live subscription.
- A subsequent live `customer.subscription.updated` webhook POST reached `/api/billing/webhook` and returned 200 without the skip warning.
- Supabase now stores the expected subscription ID and marks the paid profile `active`.
- `try_consume_trial_credit` returns `subscriber` for the paid profile.

### Supabase

- Production migration `20260602225318 production_policy_hardening` applied.
- `Users can update own profile` no longer exists.
- Businesses, competitors, and reports have ownership `WITH CHECK` policies.
- Helper function execute grants restricted.
- Trial-credit consume/restore RPCs remain service-role only.
- `replace_competitors` remains authenticated and service role callable with ownership validation.

### Auth And Routing

- Public route checks:
  - `/` 200
  - `/login` 200
  - `/signup` 200
- Protected route checks:
  - `/dashboard` 307 `/login`
  - `/reports` 307 `/login`
  - `/billing` 307 `/login`
- Production UI smoke logged in with a disposable confirmed user, saved business details, generated a report, and reached the report detail URL.

### Automated Verification

- `npm run verify` timed out after about 4 minutes in this turn, but its component checks passed separately:
  - TypeScript typecheck passed.
  - ESLint passed.
  - 14 launch smoke tests passed.
  - Next.js production build passed.
- Vercel production deployment also ran `npm install` and `npm run build` successfully.
- `npm audit` still flags 2 moderate advisories via Next/PostCSS; `npm audit fix --force` was not applied because it suggested a breaking path.

## Remaining Launch Notes

- Test subscription should be cancelled through Stripe Customer Portal or Stripe Dashboard when no longer needed.
- Test payment can be refunded in Stripe Dashboard if desired.
- Claude Code can independently review this updated report and current production state as a second-pass QA step.

## Launch Recommendation

Backend systems are ready for public launch. Live checkout, webhook delivery, Supabase entitlement, report-generation entitlement, support contact, and cancellation path configuration are verified. Optional cleanup remains for the paid test subscription.
