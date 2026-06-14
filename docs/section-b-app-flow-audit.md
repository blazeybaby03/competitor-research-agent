# Section B App Flow Audit

Date: 2026-06-02

Scope: homepage, signup, login, auth redirects, dashboard protection, business save, competitor URL validation, reports, billing, and trial-used upgrade prompt.

## Summary

The current app-flow coverage is now split into two layers:

- Automated local guardrails in `scripts/launch-smoke-check.test.mjs`, run by `npm run verify`.
- Manual credential-backed checks for flows that require live Supabase, Stripe, ScraperAPI, or Anthropic behavior.

No product behavior changes were required during this audit.

## Automated Now

These checks are covered without adding dependencies:

- Homepage source renders the CompeteIQ brand and links to `/login` and `/signup`.
- Login page renders Supabase password auth and routes successful login to `/dashboard`.
- Signup page renders Supabase signup, uses `/auth/callback`, and shows the email-confirmation state.
- Middleware protects `/dashboard` and `/reports`.
- Middleware redirects authenticated users away from `/login` and `/signup`.
- Dashboard layout re-checks server-side auth and redirects missing users to `/login`.
- Dashboard source renders business setup, report generation, subscriber/trial gating, and `UpgradePrompt`.
- Reports list and report detail pages filter by `user_id`; detail page returns `notFound()` for missing/non-owned reports.
- Billing page renders Pro checkout for inactive users and active subscription state for active users.
- Business save route requires auth, required fields, length caps, ownership checks, server-side competitor URL validation, and atomic `replace_competitors` RPC.
- Competitor URL validation directly rejects localhost, private IPv4/IPv6, internal hostnames, embedded credentials, non-http protocols, and more than five URLs.
- Report generation route rejects missing `businessId`, non-owned businesses, zero competitors, too many competitors, and excessive generation.
- Report generation route keeps report-row creation before trial-credit consumption, server-side URL revalidation, failed report marking, trial-credit restoration, and incomplete AI-output rejection.
- Stripe checkout and webhook safety checks from the previous smoke suite remain covered.

## Manual Verification Required

These checks need configured external services or live auth state:

- Homepage load in browser on local and production URLs.
- Unauthenticated `/`, `/login`, and `/signup` access in a real browser.
- Authenticated redirect away from `/login` and `/signup` after Supabase cookies are set.
- Dashboard loads for an authenticated user.
- New signup creates a `profiles` row through the Supabase trigger.
- Business create and update persist to Supabase.
- Competitor replacement is atomic in the live database RPC.
- Report generation creates scrape jobs through ScraperAPI.
- Partial scrape failure still produces useful Anthropic output.
- Trial users can generate exactly one free report in live state.
- Trial credit is restored after real scrape or Anthropic failure.
- Active Stripe subscribers can generate up to 100 reports per 30 days.
- Billing checkout creates a real Stripe subscription checkout session.
- Webhook subscription events update profile billing status.

## Recommended Manual Test Script

1. Start from a clean test email in Supabase.
2. Visit `/`, `/signup`, and `/login` while logged out.
3. Confirm `/dashboard` and `/reports` redirect to `/login`.
4. Sign up, confirm email, and confirm `/auth/callback` lands on `/dashboard`.
5. Confirm a profile row exists with `subscription_status = trial` and `trial_reports_used = 0`.
6. Save a business with one valid competitor URL.
7. Try saving a private URL such as `http://127.0.0.1` and confirm the route rejects it.
8. Generate the first report and confirm the report moves from `generating` to `completed`.
9. Confirm `trial_reports_used = 1`.
10. Return to `/dashboard` and confirm the upgrade prompt appears.
11. Visit `/billing` and start Stripe test checkout.
12. Complete checkout with a Stripe test card and confirm the webhook marks the profile active.
13. Generate a second report as an active subscriber.

## Risks And Notes

- The automated tests are intentionally source-level and pure-function tests. They catch accidental removal of launch-critical safeguards, but they do not replace browser or integration testing.
- Supabase RLS, trigger behavior, Stripe webhook delivery, ScraperAPI availability, and Anthropic output quality still need live credential-backed verification before launch.
- The app still depends on email confirmation being configured correctly in Supabase redirect URLs.
