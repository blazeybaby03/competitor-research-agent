<!-- stripe-projects-cli managed:claude-md:start -->
look at AGENTS.md for your rules
<!-- stripe-projects-cli managed:claude-md:end -->

The app is live at https://competeiq.pro, deployed on Railway. Database is Supabase (project ref: yzwkvwcflnnwrcyadqzv, region: ap-southeast-2).

## Production constraints — read before touching auth or deploy

- Supabase auth hook at `/api/auth/send-email` uses **Bearer token comparison** against `SUPABASE_HOOK_SECRET`. **Do NOT apply HMAC verification** — this has broken account creation before and is the wrong method for this hook.
- All 27 emails go through Resend (not Supabase built-in templates). Full reference: `03_PRODUCT/Documentation/Email Templates/EMAIL-SYSTEM-OVERVIEW.md`. Marketing sequences A–D fire automatically from `app/api/auth/send-email/route.ts`, `app/api/billing/webhook/route.ts`, and `app/api/reports/generate/route.ts` — do not remove these triggers.
- Never log `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, or `SUPABASE_HOOK_SECRET` to console or Railway logs.

## Environment

Windows machine. Use PowerShell for shell operations. Prefer MCP-based auth over CLI npm wrappers — the Stripe CLI npm wrapper breaks on Windows. Git pushes use `git-push.ps1`. Verify that `gh` and `vercel` are in PATH before relying on them; if not found, use the Railway MCP or Vercel MCP instead.

## Current production state (as of June 2026)

- Launched June 7–8, 2026 at competeiq.pro
- Serving real users; treat as production at all times — no breaking changes to auth, billing, or rate-limiting without explicit review
- 3 accounts total: 1 real external user, 1 founder (blazeybaby@pm.me), 1 agent test account (agent-codex@agentmail.to)
- 0 paying customers; A$0 revenue as of June 20, 2026
- First revenue target: 1 STARTER subscriber (A$39/mo) by July 20, 2026
- All core product features shipped: guest report flow, 27-email system (post-signup nurture, paid onboarding, usage warnings, cancellation win-back, guest drip, auth emails), Plausible Analytics (@plausible-analytics/tracker — dynamic import in useEffect, see components/Analytics.tsx), evidence-backed reports, suggest competitors, scheduled monthly re-runs with "what changed" summary, PDF export, in-app plan changes
