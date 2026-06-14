# CompeteIQ — AI Competitor Research SaaS

Generate detailed AI-powered competitor intelligence reports from simple URL inputs.

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Supabase** for auth + database
- **Stripe** for subscriptions
- **ScraperAPI** for website scraping
- **Anthropic Claude** for AI report generation

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

   > Each migration is safe to re-run. RLS is enabled automatically by the migrations — no manual step needed.
3. Copy your credentials from **Settings → API**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
4. In **Authentication → URL Configuration**, add redirect URLs:
   - Local: `http://localhost:3000/auth/callback`
   - Production: `https://your-domain.com/auth/callback`
   - If using Vercel preview deployments, add the preview callback pattern recommended by Supabase for your Vercel team/account.
5. Set **Site URL** to your production domain.
6. Keep **Confirm email** enabled for password signups.
7. If you customize Supabase auth email templates, make sure confirmation links use the redirect target rather than only the Site URL, so `/auth/callback` receives the code in every environment.

### 3. Anthropic (Claude AI)

1. Go to [console.anthropic.com](https://console.anthropic.com) → API keys
2. Create a key → paste as `ANTHROPIC_API_KEY`
3. Optionally set `AI_MODEL` to override the default (`claude-sonnet-4-20250514`)

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

### 6. Configure env

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

## Deploy to Vercel

1. Push this project to a GitHub repo (ensure `.env.local` is NOT committed)
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env.example` to the Vercel project settings
4. Set `NEXT_PUBLIC_APP_URL` to your production domain
5. Deploy
6. After deploying, update your Stripe webhook URL to the production domain
7. Update Supabase allowed redirect URLs to include the production domain

---

## User flow

1. User signs up → email confirmation → redirected to `/dashboard`
2. User fills in business name, industry, and 1–5 competitor URLs → saves
3. User clicks **Generate AI Report** → scraping + AI analysis runs (~60s)
4. User is redirected to the completed report page
5. User can view and copy the report

## Trial limits

- New users get **1 free report**
- Starter is **10 reports per 30 days** at A$39/month
- Pro is **100 reports per 30 days** at A$159/month
- Free and Starter reports support up to 3 competitors per report; Pro supports up to 5

## Not yet implemented (future work)

- PDF / CSV export
- Slack notifications
- Scheduled / recurring reports
- Broader platform-wide rate limiting before scaling
- Stripe customer portal for self-service subscription management

---

## Project structure

```
app/
  page.tsx                  # Landing page
  (auth)/login, signup      # Auth pages
  auth/callback/            # Supabase OAuth callback
  (dashboard)/
    layout.tsx              # Dashboard shell + nav
    dashboard/              # Main dashboard
    reports/                # Report list + detail pages
    billing/                # Stripe billing page
  api/
    business/save/          # Server route: save business + competitors
    reports/generate/       # Core: scrape → AI → save report
    billing/checkout/       # Stripe checkout session
    billing/webhook/        # Stripe subscription event handler
components/                 # Shared UI components
lib/
  supabase/                 # Browser / server / admin / middleware clients
  ai.ts                     # Claude AI report generation
  scraper.ts                # ScraperAPI scraping
  validateUrl.ts            # Server-side URL validation
  types.ts                  # TypeScript interfaces
supabase/migrations/        # SQL schema + security migrations
```
