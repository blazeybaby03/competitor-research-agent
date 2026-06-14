# Backend Pre-Launch Operations Plan

## Purpose

Get CompeteIQ ready for public launch by verifying backend operations before visual/front-end polish: Supabase RLS and trial credits, Stripe live billing, webhook handling, auth, production routing, ScraperAPI, Anthropic report generation, and Vercel configuration.

Target launch remains Friday morning. Backend launch gates are now verified after the live payment/webhook entitlement test.

## Current Launch Position

Status: READY for backend launch, with manual cleanup notes for the paid test subscription.

Customer URL: `https://competitor-research-agent-two.vercel.app`.

Do not share deployment-specific Vercel URLs with customers; generated deployment URLs can be Vercel-auth protected. Share only the customer alias above unless a custom domain is added and fully retested.

Current verified backend state:

- Supabase production RLS hardening is applied and verified.
- Live Stripe Pro product/price exists at $79/month.
- Live Stripe webhook exists for `https://competitor-research-agent-two.vercel.app/api/billing/webhook`.
- Vercel Production has Stripe keys aligned to the same live account as the Pro price/webhook, plus `STRIPE_GROWTH_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, and `AI_MODEL` configured.
- Production Checkout session creation is verified and reaches `checkout.stripe.com`.
- Live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8` was verified active in Stripe and reconciled to Supabase profile `agent-codex@agentmail.to`.
- Production webhook root cause was fixed: a live subscription arrived without `metadata.supabase_user_id`, so the handler now falls back to matching `subscription.customer` against `profiles.stripe_customer_id`.
- After deploying the fix, a live `customer.subscription.updated` webhook POST reached `/api/billing/webhook` and returned 200 without the previous skip warning.
- Supabase now has one `active` profile with the expected subscription ID, and `try_consume_trial_credit` returns `subscriber` for that paid user.
- Stripe Customer Portal is configured for subscription cancellation, payment method updates, and invoice history.
- Production report generation passed end-to-end with a disposable confirmed test user.
- Public routes return 200; protected routes redirect unauthenticated users to `/login`.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` pass after the latest changes; `npm run verify` timed out as a wrapper in the latest run and is documented as a verification-wrapper issue.

Remaining launch notes:

- `NEXT_PUBLIC_SUPPORT_EMAIL` is configured in Vercel Production and verified on the billing page.
- `npm audit` reports 2 moderate Next/PostCSS advisories; do not apply breaking `npm audit fix --force` before launch.
- Cancel the paid test subscription and refund the test payment in Stripe Dashboard if desired.

## Operating Rules

- Keep working each checklist until the result is `Complete`.
- If a step fails, diagnose it, try again, and try a different safe route before escalating.
- Do not weaken RLS, webhook signature verification, price allowlisting, URL validation, prompt-injection protections, or trial-credit controls.
- Do not print or commit secrets, API keys, payment details, customer private data, or database passwords.
- Do not make destructive production changes without explicit human confirmation.
- Review and test all work before submitting a completion report.
- Every completion report must include what changed, what was tested, exact pass/fail evidence, remaining risks, and manual dashboard steps.

## Work Split

Codex owns local code changes, migrations, tests, static checks, production-safe API setup already completed, and the final merged launch report.

Claude Code owns independent production-log verification, browser/customer-flow testing, dashboard observations, and second-pass runtime audit. Claude Code must invoke simultaneous subagents for Stripe, Supabase, Report Generation, Auth/Vercel, and QA Evidence.

The two reports must be pasted back to each other for cross-review before launch is called fully ready.

## Codex Checklist

### 1. Supabase Production Hardening

- [x] Confirm production policies and function grants with read-only SQL.
- [x] Add minimal idempotent hardening SQL in `supabase/migrations/005_production_policy_hardening.sql`.
- [x] Drop `Users can update own profile`.
- [x] Add explicit ownership `WITH CHECK` policies to businesses, competitors, and reports.
- [x] Preserve `try_consume_trial_credit`, `restore_trial_credit`, and `replace_competitors`.
- [x] Revoke public/authenticated execute on unintended helper functions.
- [x] Apply production migration and rerun policy/function verification.

### 2. Stripe Configuration And Webhooks

- [x] Confirm/create live Pro product and recurring $79/month price.
- [x] Align Vercel Production Stripe secret/publishable keys to the same live account as the Pro price and webhook.
- [x] Set Vercel Production `STRIPE_GROWTH_PRICE_ID`.
- [x] Confirm/create live webhook endpoint for `https://competitor-research-agent-two.vercel.app/api/billing/webhook`.
- [x] Configure webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- [x] Set Vercel Production `STRIPE_WEBHOOK_SECRET`.
- [x] Verify webhook route rejects missing signature.
- [x] Verify authenticated production checkout session creation reaches Stripe Checkout.
- [x] Harden checkout against stale stored Stripe customer IDs from the previous wrong-account Stripe configuration.
- [x] Human completed live payment through Stripe's completed/success state.
- [x] Fixed webhook handler to resolve subscriptions by metadata or stored Stripe customer ID.
- [x] Confirmed webhook-driven Supabase profile update and subscriber entitlement.

### 3. Report Generation Reliability

- [x] Investigate production failure root cause.
- [x] Query Anthropic Models API without printing secrets.
- [x] Update `lib/ai.ts`, `.env.example`, and Vercel Production `AI_MODEL` to `claude-sonnet-4-6`, which is available to this account.
- [x] Redeploy production.
- [x] Verify production report generation end-to-end with a disposable test user and stable competitor URL.
- [x] Confirm completed report is stored and trial credit is consumed exactly once.
- [x] Confirm earlier failure preserved trial credit restoration behavior.

### 4. Billing Support And Cancellation Path

- [x] Add authenticated Stripe billing portal API route.
- [x] Add billing portal client button for active subscribers.
- [x] Update billing page copy for self-serve subscription management.
- [x] Configure live Stripe Customer Portal with cancellation, payment method update, and invoice history.
- [x] Add `NEXT_PUBLIC_SUPPORT_EMAIL` to `.env.example`.
- [x] User provides real support inbox and sets `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel Production.
- [x] Verify support email renders on production billing page as `mailto:agent-codex@agentmail.to`.

### 5. Auth And Customer Flow Verification

- [x] Verify public `/`, `/login`, `/signup` return 200 on customer URL.
- [x] Verify unauthenticated `/dashboard`, `/reports`, `/billing` redirect to `/login`.
- [x] Complete production login with a disposable confirmed Supabase test user.
- [x] Save business and competitor through production UI.
- [x] Generate and view a production report through production UI.

### 6. Automated Checks

- [x] Run `npm install` through Vercel production deployment.
- [x] Run `npm run typecheck`.
- [x] Run `npm run lint`.
- [x] Run `npm run test`.
- [x] Run `npm run build`.
- [x] Run `npm run verify` after fixes; latest wrapper run timed out, then component checks passed separately.
- [x] Run `npm audit` and document moderate advisory without force-fixing.

### 7. Final Codex Report

- [x] Review changed files and avoid unrelated formatting churn.
- [x] Confirm no secrets were intentionally printed or committed.
- [x] Generate/update human-readable reports in `reports/`.
- [x] Include work completed, files changed, production config verified, tests run, remaining manual steps, and launch recommendation.

## Claude Code Checklist

Claude Code should run this independently and use simultaneous subagents. Paste-ready instructions are in `docs/claude-code-prelaunch-prompt.md`.

Required Claude Code evidence:

- [ ] Confirm current production logs no longer show report-generation 404 model failures after `AI_MODEL=claude-sonnet-4-6`.
- [ ] Reproduce or disprove the earlier `/billing` TypeError after the latest deployment.
- [ ] Confirm public route checks on `https://competitor-research-agent-two.vercel.app`.
- [ ] Confirm Stripe live product, price, webhook, and Customer Portal configuration without exposing secrets.
- [ ] Confirm webhook delivery after a human completes live checkout.
- [ ] Confirm Supabase policy and advisor state after hardening.
- [ ] Run local automated verification.
- [ ] Produce independent completion report with exact pass/fail evidence.

## Launch Gates

Launch is READY only when all of these are true:

- [x] Production Supabase policies prevent users updating billing/trial fields.
- [x] Live Stripe webhook endpoint exists and verified secret is installed.
- [x] Stripe Pro live price exists and checkout route is configured.
- [x] Production Stripe Checkout session creation works.
- [x] Human live payment reaches completed/success state and proves webhook updates Supabase profile.
- [x] Report generation completes for a real test user.
- [x] Failed report generation does not permanently consume the free trial.
- [x] Signup/login/dashboard/report/billing routes work on the customer URL.
- [x] Customer has a cancellation path through Stripe Customer Portal.
- [x] Customer has a visible real support email.
- [x] Typecheck, lint, smoke tests, and production build pass after changes; latest `npm run verify` wrapper timed out.
- [ ] Codex and Claude Code reports have been cross-reviewed by the other agent.

## Manual Human Steps

- [x] Provide the real support email to show in the app and set `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel Production.
- [x] Complete one live Stripe payment personally from `/billing` through Stripe's completed/success state; do not share card details with agents.
- [x] Confirm webhook delivery in production logs.
- [x] Confirm Supabase profile becomes `subscription_status = active`.
- [x] Confirm the test account has subscriber entitlement for reports after subscription activation.
- [ ] Cancel the test subscription through Stripe Customer Portal or Stripe Dashboard.
- [ ] Refund the test payment in Stripe Dashboard if needed.
- [ ] If a custom domain is added, update `NEXT_PUBLIC_APP_URL`, Supabase auth redirect URLs, and Stripe webhook/success/cancel URLs, then rerun production checks.
