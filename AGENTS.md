# AGENTS.md — CompeteIQ Launch Instructions

## Mission

Prepare this Next.js SaaS app for a Friday morning launch. Prioritise revenue safety, customer trust, and production stability over new features.

This repository is a Next.js 15 App Router project using TypeScript, Tailwind CSS, Supabase auth/database, Stripe subscriptions, ScraperAPI, and Anthropic Claude report generation.

## Launch constraints

- Do not introduce large new features before launch.
- Do not rewrite the architecture unless a blocking issue requires it.
- Do not weaken Supabase RLS, Stripe validation, URL validation, webhook verification, or trial-credit controls.
- Prefer small, reviewable commits.
- Preserve the current product promise: signup, add competitors, generate one free report, upgrade to Pro for 100 reports per 30 days.
- Treat Stripe checkout, webhook handling, report generation, and auth redirects as launch-critical.

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

## Testing focus

Add or improve tests around these paths first:

- Unauthenticated users cannot access `/dashboard` or `/reports`.
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
