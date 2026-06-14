# Claude Backend Report Cross-Review

## Summary

Claude Code's `backend-report-competeIQ.txt` is useful, but it was written against an earlier production state. Several P0/P1 items it lists as manual blockers have since been completed and verified by Codex.

Current status: READY for backend launch.

The previous human live payment/webhook entitlement gate is now resolved. Live subscription `sub_1TeE1bCHQLJhk2437eDW4kJ8` is active, Supabase profile `agent-codex@agentmail.to` is active with the expected subscription ID, and the entitlement RPC returns `subscriber`.

## Claude Findings That Are Still Valid

- The `/billing` expired-session TypeError was a real issue and is fixed by redirecting unauthenticated users before `user!.id` is accessed.
- Report generation needed better failure handling; the current code includes `maxDuration = 60`, all-scrapes-failed guard, trial-credit restore, and Anthropic error wrapping.
- Human live payment testing was required because agents must not enter card details; the user completed a live subscription test.
- Post-launch items are still reasonable:
  - add forgot-password flow
  - display auth callback errors on login
  - consider invoice failure webhook handling
  - add support/contact link beyond billing if desired

## Claude Findings Superseded By Current Evidence

### Stripe Webhook

Claude reported the live webhook endpoint was unconfirmed or missing.

Current state:

- Live webhook endpoint exists for `https://competitor-research-agent-two.vercel.app/api/billing/webhook`.
- Vercel Production has `STRIPE_WEBHOOK_SECRET`.
- Webhook route rejects missing signatures with 400.

Resolved follow-up:

- Initial live webhook delivery exposed a real issue: the subscription event had no `metadata.supabase_user_id`, so the handler skipped the Supabase update.
- Codex patched the webhook to fall back to `subscription.customer` matched against `profiles.stripe_customer_id`.
- The fix was deployed to production and a later live subscription update webhook returned 200 without the skip warning.

### ScraperAPI

Claude reported `SCRAPERAPI_KEY` was likely missing in Vercel Production.

Current state:

- Vercel Production has `SCRAPERAPI_KEY`.
- Production report generation completed end-to-end after the AI model fix.

Evidence:

- Report `86e2769c-301c-466a-9965-959eb55a32ed` completed.

### Supabase Migrations

Claude reported migrations 002-005 needed manual confirmation.

Current state:

- Production hardening migration `20260602225318 production_policy_hardening` was applied.
- `Users can update own profile` no longer exists.
- Ownership `WITH CHECK` policies exist for businesses, competitors, and reports.
- Trial-credit RPC grants remain service-role restricted.

### Support Email

Claude reported `NEXT_PUBLIC_SUPPORT_EMAIL` was not configured.

Current state:

- Vercel Production has `NEXT_PUBLIC_SUPPORT_EMAIL`.
- Production billing page shows `agent-codex@agentmail.to`.
- The link renders as `mailto:agent-codex@agentmail.to`.

### Code Deployment

Claude reported code changes were not deployed.

Current state:

- Production has been redeployed multiple times after backend fixes.
- Latest support-email deployment succeeded and is aliased to `https://competitor-research-agent-two.vercel.app`.

### Stripe Price

Claude's report references an older price ID: `price_1TdX7hFz4UuJljiF4fGn97JG`.

Current state:

- Vercel Production `STRIPE_GROWTH_PRICE_ID` is set.
- Production Checkout session creation now posts the corrected price and reaches `checkout.stripe.com`.
- Stripe customer creation is persisted.
- A user-facing checkout failure later exposed stale `stripe_customer_id` risk for accounts created while Production pointed at the wrong Stripe account.
- Checkout now validates the stored customer and creates a replacement customer in the current live Stripe account if needed.

## Remaining Launch Notes

No backend P0/P1 launch gate remains from Claude's report. Optional cleanup:

1. Cancel the test subscription through Stripe Customer Portal or Stripe Dashboard when no longer needed.
2. Refund the test payment if desired.

## Recommendation

Use Claude's report as historical evidence and keep the Codex-updated reports as the current launch source of truth:

- `reports/codex-prelaunch-progress-report.md`
- `reports/full-system-launch-test-report.md`
- `docs/prelaunch-backend-operations-plan.md`

Do not re-open the superseded blockers unless fresh production evidence contradicts the current checks.
