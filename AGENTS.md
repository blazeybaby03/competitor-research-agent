# AGENTS.md — CompeteIQ Development Guide

## Mission

Maintain and grow a live Next.js SaaS at competeiq.pro. Prioritise revenue safety, customer trust, and production stability. The app is deployed on Railway and serving real users.

## Production state

- Live at competeiq.pro since June 7–8, 2026, deployed on Railway
- Supabase project: yzwkvwcflnnwrcyadqzv (ap-southeast-2)
- Serving real users: no changes to auth, billing, or rate-limiting without explicit review
- 0 paying customers as of June 20, 2026; first revenue target is A$39/month STARTER by July 20, 2026
- All core features shipped: guest report flow, 5-email drip, evidence-backed reports, suggest competitors, scheduled re-runs, PDF export, in-app plan changes

This repository is a Next.js 16 App Router project using TypeScript, Tailwind CSS, Supabase auth/database, Stripe subscriptions, ScraperAPI, Anthropic Claude report generation, and Resend for transactional email.

## Development principles

- Do not rewrite the architecture unless a blocking issue requires it.
- Do not weaken Supabase RLS, Stripe validation, URL validation, webhook verification, or trial-credit controls.
- Prefer small, reviewable commits.
- New features must build, lint, and typecheck cleanly before deployment.
- The product has two entry points: guest report (no signup) and authenticated account. Keep both working.
- Treat Stripe checkout, webhook handling, report generation, auth redirects, and the guest report flow as production-critical.

## Required checks before marking work complete

Run these commands when possible:

```bash
npm install
npm run lint
npm run build
```

If adding scripts, prefer:

```bash
npm run typecheck
npm run test
npm run test:e2e
```

If a command cannot be run because credentials or local services are missing, document the exact blocker and the manual verification needed.

## Priority order

1. Build/lint/typecheck correctness.
2. Stripe checkout and webhook reliability.
3. Supabase auth, RLS, and trial-credit behaviour.
4. Report generation success/failure states.
5. Landing page trust/conversion improvements.
6. Minor UX polish only if it does not risk launch stability.

## Stripe rules

- Never trust client-supplied price IDs.
- Keep server-side price allowlisting.
- Keep webhook signature verification.
- Verify subscription status changes through webhook events.
- Do not log secrets, payment data, bank details, or full customer-sensitive data.
- Keep test-mode and live-mode configuration clearly separated.

## Supabase rules

- Auth hook (`/api/auth/send-email`) uses **Bearer token comparison** against `SUPABASE_HOOK_SECRET`. **Do not apply HMAC verification** — this has broken account creation before and is the wrong method for this hook.
- Keep RLS enabled.
- Do not allow users to update their own billing fields, subscription status, or trial report counters.
- Use service role only in server-only routes/utilities.
- Do not expose service role keys to client components.
- Preserve atomic trial-credit consumption and restoration semantics.

## Scraping and AI rules

- Validate competitor URLs server-side before scraping.
- Do not remove SSRF protections from `lib/validateUrl.ts`.
- Keep prompt-injection warnings around scraped competitor content.
- Ensure report generation handles partial scrape failures gracefully.
- Do not store completed reports with empty or malformed AI output.

## Resend and email rules

- All transactional email goes through Resend via `lib/email.ts` using `accounts@mail.competeiq.pro`.
- **27-email system** across 6 sequences — full reference: `03_PRODUCT/Documentation/Email Templates/EMAIL-SYSTEM-OVERVIEW.md`.
- Sequence triggers (never remove these without updating the sequence):
  - **Sequence A (post-signup nurture, 4 emails)** — fired from `app/api/auth/send-email/route.ts` on `email_action_type === "signup"`
  - **Sequence B (paid onboarding, 2 emails)** — fired from `app/api/billing/webhook/route.ts` on `customer.subscription.created`
  - **Sequence C (usage warnings, 2 emails)** — fired from `app/api/reports/generate/route.ts` at 80% and 100% of monthly quota
  - **Sequence D (cancellation win-back, 2 emails)** — fired from `app/api/billing/webhook/route.ts` on `customer.subscription.deleted`
- All marketing sequence sends are fire-and-forget (`.catch(console.error)`) — they must never block or throw in a request handler.
- Do not log email addresses in server output beyond what is needed for debugging.
- `RESEND_API_KEY` is required in production; `lib/email.ts` throws on startup if unset.

## Testing focus

Add or improve tests around these paths first:

- Unauthenticated users cannot access `/dashboard` or `/reports`.
- `/guest-report/[token]` is accessible without auth; expired tokens return 404.
- Guest report API (`/api/reports/generate-guest`) rejects duplicate email within 24 hours.
- Guest report API rejects more than 3 requests per IP per hour.
- Business save rejects invalid competitor URLs.
- Report generation rejects missing business IDs and missing competitors.
- Trial users can generate only one free report.
- Active subscribers can generate up to 100 reports per 30 days.
- Checkout rejects unknown price IDs.
- Webhook rejects missing/invalid Stripe signatures.
- Subscription created/updated/deleted events update profiles correctly.

## Landing page guidance

The homepage should build trust quickly. Favour practical proof over vague marketing language.

Useful additions:

- Product/report preview above the fold.
- Clear explanation of what the user receives.
- Trust points: one free report, no credit card required, secure billing via Stripe.
- Specific use cases for founders, solo operators, consultants, agencies, and small businesses.

Avoid:

- Heavy animations that hurt performance.
- Generic AI hype.
- Claims that cannot be proven inside the product.

## Definition of done

A launch-prep task is complete only when:

- The code builds.
- Lint/type errors are handled or documented.
- Relevant tests or manual verification notes are included.
- Stripe/payment implications are checked if touched.
- No secrets are committed.
- The PR description explains what changed, why, and how it was verified.

<!-- stripe-projects-cli managed:agents-md:start -->
## Stripe Projects CLI

This repository is initialized for the Stripe project "Competitor Research Agent".

## Tools used

- [Stripe CLI](https://docs.stripe.com/stripe-cli) with the `projects` plugin to manage third-party services, credentials, and deployments for this project. Use the stripe-projects-cli to manage deploying and access to third party services.
<!-- stripe-projects-cli managed:agents-md:end -->
