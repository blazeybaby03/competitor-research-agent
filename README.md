# CompeteIQ — AI Competitor Research SaaS

Generate detailed AI-powered competitor intelligence reports from simple URL inputs.

## Tech stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Supabase** for auth + database
- **Stripe** for subscriptions
- **ScraperAPI** for website scraping
- **Anthropic Claude** for AI report generation
- **Resend** for transactional email (27 emails across 6 sequences)

---

## ⚠️ Key rotation notice

If you have ever committed or shared `.env.local`, rotate all keys immediately:
- Supabase: Settings → API → regenerate service role key
- Anthropic: console.anthropic.com → API Keys → delete and recreate
- ScraperAPI: dashboard → regenerate API key
- Stripe: Developers → API Keys → roll secret key

`.env*.local` is in `.gitignore` and must never be committed.

---

## Setup guide

### 1. Clone & install

```bash
cd "Competitor Research Agent"
npm install
```

### 2. Supabase

1. Go to [supabase.com](https://supabase.com) → create a new project
2. In the SQL Editor, run all migration files in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_security_hardening.sql`
   - `supabase/migrations/003_competitor_rls.sql`
   - `supabase/migrations/004_rls_hardening.sql`
   - `supabase/migrations/005_production_policy_hardening.sql`
   - `supabase/migrations/006_plan_based_access.sql`
   - `supabase/migrations/007_analytics_views.sql`
   - `supabase/migrations/008_report_sources.sql`
   - `supabase/migrations/009_scheduled_reruns.sql`
   - `supabase/migrations/010_guest_reports.sql`

   > Each migration is safe to re-run. RLS is enabled automatically by the migrations — no manual step needed.
3. Copy your credentials from **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
4. In **Authentication → URL Configuration**, add redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
   - If using deployment previews, add the preview callback pattern recommended by your hosting provider.
5. Set **Site URL** to your production domain.
6. Keep **Confirm email** enabled for password signups.
7. If you customize Supabase auth email templates, make sure confirmation links use the redirect target rather than only the Site URL, so `/auth/callback` receives the code in every environment.

### 3. Anthropic (Claude AI)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API keys
2. Create a key → paste as `ANTHROPIC_API_KEY`
3. Optionally set `AI_MODEL` to override the default (`claude-haiku-4-5-20251001`)

### 4. ScraperAPI

1. Sign up at [scraperapi.com](https://scraperapi.com) (free tier available)
2. Copy your API key → paste as `SCRAPERAPI_KEY`

### 5. Stripe

1. Go to [stripe.com](https://stripe.com) → Developers → API keys
2. Copy publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copy secret key → `STRIPE_SECRET_KEY`
4. Create two monthly subscription products/prices in Stripe:
   - **Starter (A$39/mo, 10 reports per 30 days)** → `STRIPE_STARTER_PRICE_ID`
   - **Pro (A$159/mo, 100 reports per 30 days)** → `STRIPE_GROWTH_PRICE_ID`
   - Copy the **Price IDs** and set:
     ```
     STRIPE_STARTER_PRICE_ID=price_xxx
     STRIPE_GROWTH_PRICE_ID=price_xxx
     ```
5. Create a webhook pointing to `https://your-domain.com/api/billing/webhook`
   - Events to listen for:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret → `STRIPE_WEBHOOK_SECRET`
   - For local testing: `stripe listen --forward-to localhost:3000/api/billing/webhook`

### 6. Resend

1. Sign up at [resend.com](https://resend.com) and verify your sending domain
2. Copy your API key → `RESEND_API_KEY`
3. The sending address is `accounts@mail.competeiq.pro` — update `lib/email.ts` if your domain differs
4. In Supabase Dashboard → Authentication → Hooks → Add hook → **Send Email** → HTTP → URL: `https://your-domain.com/api/auth/send-email` → paste `SUPABASE_HOOK_SECRET` as the secret. This routes all auth emails through Resend instead of Supabase's built-in templates.

### 7. Configure env

```bash
cp .env.example .env.local
# Fill in all values
```

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Railway

1. Push this project to a GitHub repo (ensure `.env.local` is NOT committed)
2. Create or link the Railway project from the app root
3. Deploy the web service using `railway.toml`
4. Add all environment variables from `.env.example` to Railway
5. Set `NEXT_PUBLIC_APP_URL` to your Railway or custom production domain
6. Confirm `NEXT_PUBLIC_APP_URL` is not the Supabase project URL
7. After deploying, update your Stripe webhook URL to the production domain
8. Update Supabase Auth Site URL and allowed redirect URLs to include the production domain
9. Create a separate Railway cron service that runs `npm run cron:scheduled-reruns` on `0 6 1 * *`

See `docs/railway-migration-runbook.md` for the cutover checklist and billing verification steps.

---

## User flows

### Guest flow (no account needed)
1. Visitor enters their website URL (optional) and one competitor URL on the landing page
2. A popup prompts for their email address
3. Report generates (~60s) and opens at `/guest-report/[token]`
4. Visitor receives 5 emails over 7 days via Resend (report link → insights → social proof → upgrade CTA → expiry notice)
5. Guest reports expire after 30 days; the signup CTA converts them to an account

### Authenticated flow
1. User signs up → email confirmation → redirected to `/dashboard`
2. Post-signup nurture sequence (4 emails over 14 days) fires automatically to convert free accounts to subscribers
3. User upgrades via Stripe → welcome email + 2-email onboarding sequence fires (Days 2 and 7)
4. User fills in business name, industry, and 1–5 competitor URLs → saves
5. User clicks **Generate AI Report** → scraping + AI analysis runs (~60s)
6. User is redirected to the completed report page
7. User can view, copy, and export the report as PDF
8. At 80% of monthly quota → usage warning email fires automatically
9. Paid users can enable scheduled monthly re-runs → "what changed" email on completion

## Plan limits

- Authenticated report generation requires an active subscription (guest flow handles the free report)
- Guest users get **1 free report per email address per 24 hours** (no signup required)
- Starter is **10 reports per 30 days** at A$39/month — up to 3 competitors per report
- Pro is **100 reports per 30 days** at A$159/month — up to 5 competitors per report
- Rate limit: 3 report attempts per user per hour

## Recently shipped

- **Plausible Analytics** — `@plausible-analytics/tracker` npm package; `components/Analytics.tsx` initialises via dynamic `import()` in `useEffect` (required to avoid `location.href` SSR error); custom event helpers in `lib/analytics.ts`
- **Email marketing workflows** — 4 automated sequences: post-signup nurture (4 emails, Days 1/3/7/14), paid onboarding (Days 2/7), usage limit warnings (80% + reached), cancellation win-back (immediate + Day 7)
- **27-email system** — all auth, guest drip, transactional, and marketing sequences in `lib/email.ts`; see `docs/` → Email Templates → `EMAIL-SYSTEM-OVERVIEW.md`
- **Guest report flow** — generate a free report with no signup; email captured post-form
- **Forgot password / reset password** — full self-serve password recovery flow
- **Account settings page** — profile and account management for authenticated users
- Client-ready PDF export (browser print-to-PDF with a branded cover page)
- Scheduled monthly re-runs for paid plans, with an AI "what changed" summary
- Evidence-backed reports — per-source scrape status and timestamps
- "Suggest my competitors" AI suggestions
- Stripe customer portal + in-app plan changes (upgrade/downgrade with prorations)

## Future work

- CSV export
- Slack notifications
- Webhook-based report delivery

---

## Project structure

```
app/
  page.tsx                       # Landing page (includes guest report form)
  layout.tsx, globals.css        # Root layout + global styles
  guest-report/[token]/          # Public guest report view (no auth, token = credential)
  (auth)/
    login/, signup/              # Auth pages
    forgot-password/             # Request password reset email
    reset-password/              # Set new password via reset link
    email-confirmed/             # Post-confirmation landing page
  auth/callback/                 # Supabase OAuth callback
  (dashboard)/
    layout.tsx                   # Dashboard shell + nav
    dashboard/                   # Main dashboard
    reports/                     # Report list + [id] detail pages
    billing/                     # Stripe billing page
    settings/                    # Account settings (profile, account management)
  legal/                         # Legal pages (terms, privacy, etc.)
  sample-reports/                # Marketing: example reports
  use-cases/                     # Marketing: per-industry use cases
  research-sources/              # Marketing: how reports are sourced
  api/
    business/save/               # Save business + competitors
    business/schedule/           # Toggle scheduled monthly re-runs
    competitors/suggest/         # AI "suggest my competitors"
    reports/generate/            # Core: scrape → AI → save report (authenticated)
    reports/generate-guest/      # Guest report generation (no auth, rate-limited by email + IP)
    cron/scheduled-reruns/       # Scheduler endpoint for monthly re-runs
    billing/checkout/            # Stripe checkout session
    billing/portal/              # Stripe customer portal session
    billing/change-plan/         # Upgrade/downgrade with prorations
    billing/cancel/              # Cancel subscription
    billing/webhook/             # Stripe subscription event handler (triggers onboarding + cancellation sequences)
    auth/send-email/             # Supabase auth hook → Resend (triggers post-signup nurture on signup)
components/                      # Shared UI components
  GuestReportForm.tsx            # Landing page URL input form
  EmailCaptureModal.tsx          # Email popup + loading state for guest flow
lib/
  supabase/                      # Browser / server / admin / middleware clients
  ai.ts                          # Claude AI report generation
  reportRunner.ts                # Shared scrape → AI → validate core (authenticated)
  guestReportRunner.ts           # Guest scrape → AI → validate (no DB competitor rows)
  reportSources.ts               # Per-report source evidence
  email.ts                       # Resend integration: 27-email system (auth, guest drip, marketing sequences A–D)
  appUrl.ts                      # Centralised production URL helper
  scraper.ts                     # ScraperAPI scraping
  validateUrl.ts                 # Server-side URL validation (SSRF guard)
  plans.ts                       # Plan config + Stripe price allowlist
  usage.ts, rateLimit.ts         # Quotas + rate limiting
  schedule.ts, whatChanged.ts    # Scheduled re-runs + "what changed" diff
  changeSummary.ts               # Pure snapshot/diff helpers
  suggestCompetitors.ts          # AI competitor suggestions
  competitorSuggestions.ts       # Pure parsing/dedupe for suggestions
  export.ts                      # Client-ready export helpers
  legal.ts, sampleReports.ts     # Marketing content loaders
  agentOps*.ts                   # Draft-only agent-ops harness (not live)
  types.ts                       # TypeScript interfaces
supabase/migrations/             # SQL schema + security migrations (001–010)
```
