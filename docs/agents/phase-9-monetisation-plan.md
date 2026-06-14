# Phase 9 — Monetisation Layer Design

**Status:** Plan (no code changes in this phase)
**Date:** 2026-06-08
**Owner:** Product / Revenue
**Depends on:** Phase 6 pricing decisions (complete), stable report generation and preview flow
**Next phase:** Phase 10 — Codex implementation of monetisation layer

---

## 0. Dependency gate

**Report flow stable:** Yes. `ReportView.tsx` renders all seven sections (Executive Summary, Market Gaps, Recommended Actions, Competitor Summaries, Positioning Analysis, Pricing & Offer Analysis, Strengths & Weaknesses). The generate route is live. Copy-to-clipboard is working.

**Phase 6 pricing decided:** Yes. Three tiers confirmed:

| Tier | Price | Reports | Competitors |
|------|-------|---------|-------------|
| Free | A$0 | 1 lifetime | up to 3 |
| Starter | A$39/mo | 10/30 days | up to 3 |
| Pro | A$159/mo | 100/30 days | up to 5 |

Gate passes on both criteria.

---

## 1. Core principle

The free report must be complete and real — every section, no artificial degradation. Monetisation pressure comes from **report volume limits** and **export format**, not from hiding sections of a report the user has already earned. Weakening the free report would undermine the central trust promise in `AGENTS.md` and reduce the activation value that drives upgrades.

---

## 2. Free report preview structure

The one free report a user generates should look and behave exactly as it does today in `ReportView.tsx`:

- All seven sections rendered in full
- Copy-to-clipboard available (plain text, no format conversion)
- Visible "Generated on [date]" timestamp
- Navigation back to report list

**No sections are hidden, blurred, or paywalled within the free report itself.**

What is not available to free users:
- PDF export (paid differentiator, see §5)
- Generating a second report
- Refreshing the report (re-running = a second report slot)
- Adding a 4th or 5th competitor

---

## 3. Free vs paid report content — clear boundaries

The line is on **generation and export**, not on what a generated report contains.

| Capability | Free | Starter | Pro |
|---|---|---|---|
| View generated report (all sections) | ✓ | ✓ | ✓ |
| Copy report to clipboard | ✓ | ✓ | ✓ |
| Number of reports | 1 (lifetime) | 10/30 days | 100/30 days |
| Competitors per report | up to 3 | up to 3 | up to 5 |
| PDF export | ✗ | ✓ | ✓ |
| Report refresh (re-generate) | ✗ (uses slot) | ✓ (uses a slot) | ✓ (uses a slot) |
| Priority support | ✗ | ✗ | ✓ |

**Rationale for PDF as the paid differentiator:** Clipboard copy is already built and costs nothing to leave free — removing it would feel extractive. PDF export requires a new route and has clear utility (sharing with clients, filing, presentations). It is a natural "I got value, now I want to keep it professionally" feature. It's also the most requested format for consulting and agency users, who map to the Pro tier.

---

## 4. Paid unlock moments — where and when to prompt

There are five natural upgrade moments. Each one is honest, specific, and triggered by the user's own action — not by artificial timers or countdown clocks.

### Moment 1 — Dashboard empty state after free report used

**Trigger:** User has used their 1 free report and returns to the dashboard or report list.

**What they see:** The "Generate Report" button is replaced with a soft-upgrade state. The existing free report remains fully visible and accessible.

**Copy:**
```
You've used your free report.

To generate more competitor reports, upgrade to a paid plan —
starting at A$39/month for 10 reports.

[Upgrade to Starter]  [View Pro →]
```

Keep the existing report link prominent. Don't bury it behind the upgrade prompt.

---

### Moment 2 — Report generation blocked (Free, no slots remaining)

**Trigger:** User clicks "Generate Report" after free slot is spent.

**What they see:** Modal or inline block replacing the generation form.

**Copy:**
```
You've already generated your free report.

Starter gives you 10 competitor reports every 30 days for A$39/month.
No long-term contract. Cancel any time.

[Upgrade to Starter — A$39/mo]  [See all plans]
```

Do not show a loading spinner then fail. Check the slot server-side before the user submits the form and block early.

---

### Moment 3 — Competitor count blocked (Free/Starter trying for 4th–5th competitor)

**Trigger:** User adds a 4th competitor on Free or Starter, or a 6th+ on Pro.

**What they see:** Inline message under the competitor input.

**Copy (Free/Starter → Pro):**
```
Pro plans support up to 5 competitors per report — enough to map
your full competitive landscape in a single view.

[Upgrade to Pro — A$159/mo]
```

This is the only competitor-cap moment. Keep it inline, not a modal. The user is actively building their setup; don't interrupt flow aggressively.

---

### Moment 4 — Starter quota nudge at 80% (Starter → Pro)

**Trigger:** User generates their 8th of 10 monthly reports on Starter.

**What they see:** Subtle banner at the top of the dashboard (not a modal, not a blocker).

**Copy:**
```
You've used 8 of your 10 reports this month.
Pro gives you 100 reports per 30 days — built for teams and recurring research.

[Move to Pro]  [Dismiss]
```

Dismissable once per month. Does not reappear until next quota cycle. No countdown timer.

---

### Moment 5 — Starter quota exhausted (Starter → Pro hard block)

**Trigger:** User clicks "Generate Report" after using all 10 Starter slots.

**What they see:** Same modal pattern as Moment 2.

**Copy:**
```
You've used all 10 reports in your current 30-day window.

Pro gives you 100 reports per 30 days for A$159/month —
designed for regular competitor monitoring across multiple clients.

Your quota resets on [date]. Or upgrade now to keep going.

[Move to Pro — A$159/mo]  [Wait for reset]
```

Show the reset date. "Wait for reset" is a real option and respects the user's choice. Forcing a binary upgrade/cancel is a dark pattern.

---

## 5. Export / access value (PDF download)

PDF export is the single most leverageable paid feature because:
- It is genuinely useful for consultants and agencies (the Pro buyer segment)
- It costs one server route, not a UI overhaul
- It creates a shareable artifact the user can deliver to clients — which also markets the product
- It is easy to explain: "Download a formatted PDF to share with your team or client"

**Implementation spec:**
- Add a "Download PDF" button to `ReportView.tsx`, visible only to Starter and Pro users
- For Free users: show a greyed-out "Download PDF" button with tooltip: "Available on Starter and Pro plans"
- Do not hide the button entirely — its presence signals the value the paid plans unlock
- The PDF should use the same section order as the current view (Executive Summary first, then Market Gaps, Recommended Actions, and so on)
- Include the business name, report date, and a small "Generated by CompeteIQ" footer (trust signal, subtle marketing)

**No watermarks on the free copy-to-clipboard export.** Watermarks on free-tier text output are a trust-damaging pattern. The PDF footer on paid exports is branding, not a punishment.

---

## 6. Upgrade copy — full examples by context

All copy is intended to be concrete, non-manipulative, and cancel-any-time.

**After free report is used (email-style, for potential future AgentMail use):**
```
Subject: Your free CompeteIQ report is ready — here's what's next

You've generated your first competitor intelligence report.

If you'd like to keep tabs on your market — refresh this report,
add more competitors, or research a different business — Starter
gives you 10 reports every 30 days for A$39/month.

[Upgrade to Starter]

No contracts. Cancel any time from your billing page.
```

**Billing page — tier comparison intro text:**
```
Start free. Upgrade when the research becomes a habit.

One free report, no credit card required. When you're ready
for regular competitor monitoring, pick the plan that fits.
```

**Pro plan card headline on billing page:**
```
Pro — A$159/month
For consultants, agencies, and teams who run competitor
research as a repeating workflow.
```

**Starter plan card headline on billing page:**
```
Starter — A$39/month
For founders and operators who need more than one report,
without the Pro volume.
```

**Things to avoid in copy:**
- "Don't miss out" — false scarcity
- "Limited time" (unless it actually is)
- "Unlock the full report" — the free report IS full
- "AI-powered insights" as a standalone claim — describe what the report contains instead
- Countdown timers not tied to a real event

---

## 7. In-app CTA placements

| Location | CTA | Audience |
|---|---|---|
| Dashboard — after free report used | "Upgrade to Starter" primary button | Free (used) |
| Report list page — empty/used state banner | "Get 10 reports/month for A$39" | Free (used) |
| Report generation form — slot exhausted | Modal with tier options | Free (used) / Starter (quota out) |
| Competitor input — on 4th competitor (Free/Starter) | Inline "Pro supports up to 5 competitors" | Free / Starter |
| Dashboard — 80% Starter quota | Dismissable top banner | Starter |
| Report view — PDF button (greyed out) | Tooltip: "Available on Starter and Pro" | Free |
| Billing page — always accessible | Full plan comparison | All tiers |

**CTA hierarchy on any given page:** one primary action (upgrade), one secondary action (see plans or dismiss). Never two competing upgrade CTAs on the same screen.

---

## 8. Risks to avoid

**1. Blurring or hiding sections of the free report**
This is the most common SaaS monetisation mistake in this category. Users who see a degraded free report conclude the product is weak, not that they need to pay more. The trust damage outweighs the upgrade pressure.

**2. Blocking access to a report the user already generated**
The existing report must remain accessible to free users indefinitely. Do not time-gate it. Do not move it behind a paywall on account downgrade.

**3. Fake scarcity**
Do not show "Only X slots remaining at this price" unless it is factually true. Do not add countdown timers to the billing page.

**4. Removing copy-to-clipboard on free tier**
This is their only export on free. Removing it would be punitive and would generate support noise.

**5. Hiding the "wait for reset" option when quota is exhausted**
Always show the reset date and allow the user to choose to wait. Suppressing this option to force an upgrade is a dark pattern.

**6. Using upgrade modals as splash screens**
Upgrade prompts should appear at natural friction points (generation blocked, export attempted, competitor limit hit) — not on dashboard load, not on every page visit.

**7. Overpromising PDF quality without testing**
Only ship PDF export if the output is genuinely readable and correctly formatted. A broken PDF export is worse than no export — it undermines trust at the moment the user is most motivated to upgrade.

---

## 9. Implementation task list

### Claude Code tasks

These are logic, routing, and component changes that Claude Code can implement directly in the codebase.

**CC-1 — Tier-aware generate button**
In `app/(dashboard)/dashboard/page.tsx` (or wherever the generate trigger lives): replace the generate button with a tier-aware component that checks the user's plan and quota server-side before rendering. Show the upgrade CTA instead of the form when the user has no remaining slots. Gate: RLS / server component, not client-side check.

**CC-2 — Competitor count enforcement in UI**
In the business/competitor management UI: disable the "Add competitor" input after the 3rd competitor for Free/Starter users, and after the 5th for Pro. Show an inline message (Moment 3 copy from §4). Mirror the server-side cap that already exists (`MAX_COMPETITORS` in the generate route), but surface it before the user builds a full setup only to be blocked on submit.

**CC-3 — PDF export route**
Add `app/api/reports/[id]/export/route.ts`. Accept GET, verify auth and ownership (same RLS pattern as report view), verify user is on Starter or Pro, return a formatted PDF. Use a headless PDF library (e.g. `@react-pdf/renderer` or `puppeteer`-free `pdfkit`) to render the report sections. Include business name, report date, "Generated by CompeteIQ" footer. Block for Free users with 403 + JSON `{ error: "PDF export requires a Starter or Pro plan" }`.

**CC-4 — PDF button in ReportView**
In `components/ReportView.tsx`: add a "Download PDF" button beside the existing "Copy report" button. Pass the user's plan as a prop from the page (or fetch it server-side). For paid plans: `<a href="/api/reports/[id]/export">Download PDF</a>`. For Free: greyed button with tooltip text from §5. Preserve existing copy-to-clipboard for all tiers.

**CC-5 — Starter quota nudge banner**
Add a server component that queries the user's 30-day report count against their quota. At 80%+, render a dismissable banner on the dashboard. Store the dismiss state in a `dismissed_quota_nudge_at` field on `profiles` (date of last dismiss); re-show after the quota resets. Keep the banner non-blocking — user can continue using the product.

**CC-6 — Report list empty state**
In `app/(dashboard)/reports/page.tsx`: when a Free user has reports = 1 and quota is spent, render the upgrade CTA below the existing report (Moment 1 copy from §4). Do not replace or hide the existing report entry.

**CC-7 — Billing page tier comparison update**
In `app/(dashboard)/billing/page.tsx`: update to render all three tiers (Free, Starter, Pro) using the copy from §6. Highlight Pro visually (recommended badge). Add "Current plan" indicator for the user's active tier. This update is additive and does not touch the Stripe checkout logic.

---

### Codex tasks

These require Stripe objects, database changes, or webhook logic that should go through the Codex + approval workflow.

**CX-1 — Tier-aware quota map in generate route**
Replace `MONTHLY_QUOTA_FOR_SUBSCRIBERS = 100` in `app/api/reports/generate/route.ts` with a plan→quota map derived from the user's `plan` field on `profiles`. Map: `{ free: 1 (lifetime check), starter: 10, pro: 100 }`. The lifetime check for free is different from the rolling 30-day window — enforce it separately. Keep the rolling window logic for Starter and Pro unchanged.

**CX-2 — Competitor cap by tier in generate route**
Add a tier→competitor-cap check at the start of report generation: `{ free: 3, starter: 3, pro: 5 }`. Return 403 with a structured error if the submitted competitor count exceeds the cap. Return the tier and cap in the error body so the frontend can show the correct upgrade CTA.

**CX-3 — Plan field on profiles (migration)**
Add `plan text not null default 'free' check (plan in ('free','starter','pro'))` to the `profiles` table. RLS must block user writes to this field (same as subscription_status). Set by webhook only.

**CX-4 — Webhook tier mapping**
In the Stripe webhook handler: when `customer.subscription.created` or `updated`, read the subscription item's price ID, map to tier server-side (`STRIPE_STARTER_PRICE_ID` → `starter`, `STRIPE_GROWTH_PRICE_ID` → `pro`), and write `plan` to `profiles` via the admin client. On `deleted`: set `plan = 'free'`. Keep signature verification unchanged.

**CX-5 — Stripe products and prices**
Create Starter (A$39/mo) and Pro (A$159/mo) Products and Prices in Stripe test mode first, then mirror in live mode. Populate `STRIPE_STARTER_PRICE_ID` and `STRIPE_GROWTH_PRICE_ID` env vars. Both are already in the checkout allowlist — no allowlist code change needed. Test the full checkout → webhook → plan update loop before going live.

**CX-6 — Quota and cap in server config**
Move report quota limits and competitor caps to server-side config (env or a constants file imported only in server routes). This allows limits to be tuned from day-one data without a full redeploy. Document the config location in `AGENTS.md` or a `CONFIG.md`.

---

## 10. Launch sequencing

Match the Phase 6 recommendation:

**Friday launch (Free + Pro only, unchanged):**
- No billing changes on the critical path
- CC-7 billing page update can ship (additive, no Stripe changes)
- CC-4 PDF button ships as greyed-out for Free, functional for Pro (if PDF route is ready)
- CC-6 report list empty state upgrade CTA ships

**Fast-follow (Starter + full tier logic):**
- CX-1 through CX-6 (Starter tier, plan field, webhook mapping)
- CC-1 through CC-5 (tier-aware UI, quota nudge, competitor cap enforcement)

This sequencing means the monetisation layer is visible at launch (billing page, upgrade CTAs) but the Starter-specific plumbing goes in post-launch when it can be tested properly without touching the Stripe critical path.

---

## 11. Open questions for founder before Codex begins

1. **PDF export at launch?** Is PDF export in scope for Friday, or fast-follow? The route is a new dependency and adds testing surface.
2. **Quota nudge dismiss storage:** Confirm adding `dismissed_quota_nudge_at` to `profiles` is acceptable, or prefer a cookie/localStorage approach instead (simpler, no migration, but resets on device change).
3. **Starter at Friday launch or fast-follow?** Phase 6 recommends fast-follow — confirm this is still the intent before Codex begins CX-1 through CX-6.
4. **PDF footer branding:** Confirm "Generated by CompeteIQ" in the PDF footer is desired (subtle marketing in shared artifacts).
5. **Competitor-cap UI:** Should the 4th-competitor block happen before or after the user submits the form? Before (disable input at 3) is recommended — confirm.
