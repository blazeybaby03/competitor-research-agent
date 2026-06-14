# Paste-Ready Claude Code Prompt

You are acting as a launch backend QA and stabilization engineer for my production app: Competitor Research Agent / CompeteIQ.

Mission: work in parallel with Codex until the backend system is ready for public launch. The current focus is technical backend operations only: Supabase, Stripe, Vercel, auth, webhook handling, checkout, reports, ScraperAPI, Anthropic report generation, production logs, and release verification. Visual/front-end polish comes later unless a minimal billing/support UI change is required for launch safety.

Important operating rules:

- Keep working until the checklist result is `Complete`.
- If anything fails, diagnose it, try again, and try another safe method until it passes or you can prove the exact blocker.
- Invoke subagents simultaneously. Use separate concurrent subagents for at least:
  - Supabase/RLS/trial-credit verification
  - Stripe live checkout/webhook/Customer Portal verification
  - Report generation/ScraperAPI/Anthropic investigation
  - Auth/Vercel production route verification
  - Test/evidence/reporting review
- Do not expose, print, commit, or log secrets, API keys, tokens, passwords, payment data, customer private data, or database passwords.
- Do not make destructive database changes.
- Do not change production configuration without clearly flagging the change and why it is safe.
- Do not weaken Supabase RLS, Stripe webhook verification, server-side price allowlisting, competitor URL validation, trial-credit controls, or AI prompt-injection protections.
- Review and test all work before submitting your final checklist report.
- Final output must be a human-readable completion report with exact evidence, tests run, remaining risks, and launch recommendation.

Known current facts to verify, not blindly trust:

- Customer-facing URL: `https://competitor-research-agent-two.vercel.app`
- Generated deployment-specific Vercel URLs should not be shared with customers.
- Supabase project ref seen by Codex: `yzwkvwcflnnwrcyadqzv`
- Codex says production Supabase migration `20260602225318 production_policy_hardening` is applied.
- Codex says live Stripe Pro is configured at $79/month and webhook exists for `/api/billing/webhook`.
- Codex says Vercel Production Stripe keys were aligned to the same live account as the Pro price and webhook after checkout initially returned `No such price`.
- Codex says production Checkout session creation returns 200 and reaches `checkout.stripe.com`.
- Codex says live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8` is active and Supabase profile `agent-codex@agentmail.to` is active with the expected subscription ID.
- Codex says initial live webhook delivery exposed missing `metadata.supabase_user_id`; webhook handler was patched to fall back to `subscription.customer` matched to `profiles.stripe_customer_id`.
- Codex says a later live `customer.subscription.updated` webhook POST reached production and returned 200 without the previous skip warning.
- Codex says Stripe Customer Portal is configured for cancellation, payment method updates, and invoice history.
- Codex says production `AI_MODEL` is now `claude-sonnet-4-6` because Anthropic returned that model as available to this account.
- Codex says a production report smoke passed for disposable user `codex-launch-1780442497230@example.com`, report `86e2769c-301c-466a-9965-959eb55a32ed`.
- Remaining true launch flags are optional test subscription cleanup and cross-review of both agents' reports.

Checklist for Claude Code:

## 1. Production URL And Auth

- [ ] Confirm `https://competitor-research-agent-two.vercel.app/` returns 200.
- [ ] Confirm `/login` and `/signup` return 200.
- [ ] Confirm unauthenticated `/dashboard`, `/reports`, and `/billing` redirect to `/login`.
- [ ] Complete one signup/login flow if email access is available, or use a safe confirmed test user if available.
- [ ] Confirm profile row creation after signup.
- [ ] Confirm logout and session refresh behavior.
- [ ] Record exact evidence and timestamps.

## 2. Supabase RLS And Trial Credit

- [ ] Inspect production policies and function grants.
- [ ] Confirm `Users can update own profile` no longer exists.
- [ ] Confirm businesses, competitors, and reports have ownership `WITH CHECK` policies.
- [ ] Confirm `try_consume_trial_credit`, `restore_trial_credit`, and `replace_competitors` exist and have safe execute grants.
- [ ] Confirm users cannot update their own `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, or `trial_reports_used`.
- [ ] Confirm trial credit is consumed exactly once on successful report generation.
- [ ] Confirm trial credit is restored on generation failure if a controlled safe failure is tested.
- [ ] Rerun Supabase advisors and document remaining warnings.
- [ ] Do not drop data or reset migrations.

## 3. Stripe Live Checkout, Webhook, And Portal

- [ ] Confirm live mode keys are configured in Vercel Production without printing values.
- [ ] Confirm the live Pro product exists.
- [ ] Confirm the live Pro recurring price is $79/month.
- [ ] Confirm Vercel Production `STRIPE_GROWTH_PRICE_ID` maps to that live Pro price.
- [ ] Confirm checkout route rejects logged-out users, missing price ID, and unknown price ID.
- [ ] Confirm checkout session creation works in live mode.
- [ ] If live payment requires human payment input, pause and provide the exact checkout URL and instructions. Do not ask for or store card details.
- [ ] Confirm live webhook endpoint exists at `https://competitor-research-agent-two.vercel.app/api/billing/webhook`.
- [ ] Confirm webhook events include `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- [ ] Confirm `STRIPE_WEBHOOK_SECRET` is set in Vercel Production.
- [ ] Confirm webhook rejects missing/invalid signatures.
- [ ] Confirm Stripe Customer Portal has subscription cancellation, payment method update, and invoice history enabled.
- [ ] Verify the live subscription, webhook fallback, Supabase active profile, and subscriber entitlement evidence reported by Codex.
- [ ] Document cancellation/refund steps for the paid test subscription.

## 4. Report Generation Reliability

- [ ] Investigate current production `/api/reports/generate` logs after the model fix.
- [ ] Confirm no new Anthropic `model not found` failures occur with `claude-sonnet-4-6`.
- [ ] Confirm `SCRAPERAPI_KEY`, `ANTHROPIC_API_KEY`, and `AI_MODEL` are configured in Vercel Production without printing values.
- [ ] Generate one report end-to-end using a real test user and 1-2 stable public competitor URLs, or independently verify Codex's report smoke evidence.
- [ ] Confirm partial scrape failures are handled gracefully.
- [ ] Confirm a failed report is marked `failed`.
- [ ] Confirm completed reports are not saved with empty or malformed AI output.

## 5. Billing Page And Customer Cancellation Path

- [ ] Reproduce or disprove the production `/billing` TypeError from prior logs after the latest deployment.
- [ ] Test billing page as logged-out user, trial user, and active subscriber if possible.
- [ ] Confirm upgrade button is visible and clickable for trial user.
- [ ] Confirm active subscriber sees the Stripe Customer Portal path.
- [ ] Confirm `agent-codex@agentmail.to` is visible on the production billing page as the support email.

## 6. Automated Verification

- [ ] Run `npm install`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify` after changes.
- [ ] Run `npm audit` and document findings. Do not apply breaking `npm audit fix --force` unless explicitly approved.

## 7. Final Claude Code Report

Before marking your work complete:

- [ ] Review every changed file.
- [ ] Confirm no secrets were printed or committed.
- [ ] Confirm all tests and manual checks were run or document exact blockers.
- [ ] Produce a human-readable report with:
  - Overall status: READY / READY WITH FLAGS / NOT READY
  - What changed
  - What was tested
  - Evidence for every checklist area
  - Remaining blockers
  - Manual human steps
  - Refund/cancel steps if a live payment was completed
  - Recommendation for Friday launch vs Monday launch

Completion criteria:

You may only say `Complete` if all P0/P1 backend launch gates pass or if every remaining item is explicitly documented as a safe launch flag. If a blocker remains, keep working or clearly report `NOT READY` with exact evidence.
