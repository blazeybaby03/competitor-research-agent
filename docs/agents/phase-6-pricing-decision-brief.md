# Phase 6 — CompeteIQ Pricing Decision Brief

**Status:** Decision brief (no code changes in this phase)
**Date:** 2026-06-08
**Owner:** Pricing / Product
**Next phase:** Phase 7 — Codex implementation (Stripe, database, access rules)

---

## 0. Dependency gate check

The task gate requires either (1) validated current funnel metrics, or (2) a founder decision on target pricing and segment.

- **Validated funnel metrics: NOT available.** CompeteIQ is pre-launch (Friday launch per `AGENTS.md`). There is no analytics/events table in `supabase/migrations`, and no funnel data (signup→report, report→upgrade, free-report usage) exists in `docs/`, `reports/`, or `.projects/`. These numbers cannot be invented.
- **Founder decision: AVAILABLE.** A founder pricing decision is already encoded in the product and `AGENTS.md`: one free report, Pro at **A$159/month for 100 reports per 30 days**, targeting founders, solo operators, consultants, agencies, and small businesses. The live billing page (`app/(dashboard)/billing/page.tsx`) and quota logic (`app/api/reports/generate/route.ts`, `MONTHLY_QUOTA_FOR_SUBSCRIBERS = 100`) confirm it.

Gate is passed via criterion 2. This brief therefore **anchors on the existing founder-set A$159 Pro price** and treats funnel data as a calibration input owed in Phase 7. The absence of metrics is the single biggest caveat below: all limits for the new lower tier are deliberate, conservative starting points to be tuned once real usage data exists, not data-derived optima.

---

## 1. Recommended pricing architecture

A three-rung ladder: one free entry rung and two paid tiers. This is the simplest structure that still creates an upgrade path, and it maps cleanly onto infrastructure that already exists (`STRIPE_STARTER_PRICE_ID` and `STRIPE_GROWTH_PRICE_ID` are both already in the server-side allowlist in `app/api/billing/checkout/route.ts`).

| Tier | Price (AUD/mo) | Reports / 30 days | Competitors per report | Stripe env var |
|------|----------------|-------------------|------------------------|----------------|
| **Free** (trial) | A$0 | 1 (lifetime) | up to 3 | — (no Stripe object) |
| **Starter** | **A$39** | **10** | up to 3 | `STRIPE_STARTER_PRICE_ID` |
| **Pro** | **A$159** *(unchanged)* | **100** | up to 5 | `STRIPE_GROWTH_PRICE_ID` |

Deliberately **not** in v1: annual billing, per-seat pricing, usage add-ons/overages, enterprise/custom, or any "AI platform" bundling. These are explicitly deferred to keep the first paid version simple and cheap to implement.

### Why these numbers
- **A$159 Pro is held constant** for revenue safety and launch-promise continuity. Changing the anchor price during a launch window risks trust and any early checkout flows. Pro stays exactly as the product promises today.
- **A$39 Starter** is a low-friction lead-in roughly one-quarter of Pro — low enough for a solo operator to expense without thought, high enough to be real revenue. It exists to capture the large segment that will never need 100 reports.
- **10 reports** on Starter is a starting guess, not a measured optimum. It is generous enough to be useful for occasional research yet clearly distinct from Pro's volume. **Flag:** with no usage data this number is the most likely thing to need adjustment post-launch — keep it changeable without a code deploy (see Stripe/Codex notes).
- The Starter→Pro gap (A$39→A$159, 10→100 reports, 3→5 competitors) is wide on purpose: it lets price and limits do the segmentation work without a crowded middle tier.

---

## 2. Buyer segment for each tier

- **Free** — Anyone evaluating CompeteIQ. A founder or operator who wants to see one real report on their own competitors before paying. Purpose is activation and trust, not revenue. No credit card.
- **Starter (A$39)** — Solo operators, indie founders, and small-business owners who run competitor research occasionally (a launch, a new market, a quarterly check). They need more than one report and refreshes, but nowhere near 100. Price-sensitive; "expense it without asking" is the bar.
- **Pro (A$159)** — Consultants, agencies, and businesses running competitor research as a repeating workflow, often across multiple clients or markets. They value volume (100/30 days), the higher 5-competitor cap, and priority support. This is the revenue anchor and the tier the billing page should visually default to.

---

## 3. Upgrade trigger for each tier

- **Free → Starter** — Triggered when the user consumes their one free report and wants to (a) run a second report, (b) refresh an existing one, or (c) add more competitors. The empty/used state on the dashboard and billing page is the natural prompt; messaging in §5.
- **Starter → Pro** — Triggered by (a) approaching or hitting the 10-reports/30-days ceiling, (b) needing more than 3 competitors in a single report, or (c) behavioral signals of agency/consultant use (researching many distinct businesses). A usage-meter nudge at ~80% of the Starter quota is the highest-leverage moment.

---

## 4. What stays free vs. what requires payment

**Free (no card required):**
- Signup and account creation.
- Adding and managing competitors.
- Generating **one** full report (lifetime), up to 3 competitors.
- Viewing, copying, and sharing that report.

**Requires payment:**
- Any report beyond the first.
- Report **volume** (10/mo Starter, 100/mo Pro).
- The higher 5-competitor cap (Pro only).
- Priority support (Pro).

The free report stays a complete, real report (not a teaser) — that is the core trust mechanism in `AGENTS.md` ("one free report, no credit card required") and should not be weakened.

---

## 5. Upgrade messaging

Keep it concrete and benefit-led; avoid generic AI hype per `AGENTS.md`.

- **Free → Starter (after free report used):**
  "You've used your free report. Starter gives you 10 competitor reports every 30 days for A$39/month — enough to keep tabs on your market and refresh whenever something changes." CTA: *Upgrade to Starter*.
- **Starter → Pro (at ~80% of quota / on competitor-cap block):**
  "You're running low on reports this cycle. Pro raises you to 100 reports per 30 days and up to 5 competitors per report — built for repeat research across clients and markets." CTA: *Move to Pro*.
- **Competitor-cap block (Free/Starter trying for a 4th–5th competitor):**
  "Pro lets you compare up to 5 competitors in a single report." CTA: *Upgrade to Pro*.

Tone: practical, no urgency-manipulation, cancel-any-time reassurance retained.

---

## 6. Rollout sequencing & risk

### Recommended sequencing (important launch-safety call)
`AGENTS.md` forbids large new features before Friday's launch and treats Stripe as launch-critical. To respect that **while still delivering the tiered architecture**:

1. **Launch Friday with Free + Pro exactly as they are today.** Zero billing changes on the critical path. This is the no-risk option and preserves the current promise verbatim.
2. **Add Starter as an immediate fast-follow** once the price→quota mapping and webhook tier logic are wired and tested (Phase 7). Starter is purely additive — it does not touch the existing Pro path or the A$159 anchor.

### Risks and mitigations
- **No funnel data → limits are guesses.** Starter's 10-report quota could be too generous (no upgrade pressure) or too tight (churn). *Mitigation:* instrument signup→report, report→upgrade, and quota-utilization events from day one; treat the first 60–90 days as calibration; keep quotas in server config so they can change without a redeploy.
- **Three options can cause decision paralysis** and lower conversion. *Mitigation:* visually default/highlight Pro, present Starter as the "lighter" option, keep Free as a low-emphasis trial path.
- **Anchor-price disturbance.** *Mitigation:* do not move A$159; grandfather any subscriber who signs up before Starter ships onto Pro at their current price.
- **Free-report abuse (multi-account).** *Mitigation:* keep the existing atomic, server-enforced one-free-report-per-account control (`AGENTS.md` trial-credit rules); do not over-build anti-abuse in v1, but log repeat-signup patterns.
- **Tier/quota tampering.** *Mitigation:* plan and quota must be derived server-side from the Stripe subscription via webhook only; never client-supplied; RLS continues to block users from editing billing/quota fields.

---

## 7. Stripe & implementation notes for Codex (Phase 7)

This phase requests **no code changes**. The following is the handoff spec.

**Stripe objects**
- Create two recurring monthly **Prices** in AUD: Starter A$39, Pro A$159. Recommend two distinct **Products** ("CompeteIQ Starter", "CompeteIQ Pro") for clean Stripe reporting. Create in **test mode first**, then mirror in live; keep test/live IDs clearly separated per `AGENTS.md`.
- Wire env vars: `STRIPE_STARTER_PRICE_ID` (Starter), `STRIPE_GROWTH_PRICE_ID` (Pro). Both are **already in the checkout allowlist** (`getAllowedPriceIds()`), so no allowlist code change is needed — just populate the env values.

**Server-side access rules (the real work)**
- Replace the hardcoded `MONTHLY_QUOTA_FOR_SUBSCRIBERS = 100` in `app/api/reports/generate/route.ts` with a **tier→quota map**: `{ free: 1 (lifetime), starter: 10, pro: 100 }` over the existing rolling 30-day window.
- Add a **competitor-cap-by-tier** check: `{ free: 3, starter: 3, pro: 5 }`, enforced server-side at report generation.
- Persist a **plan/tier field** on `profiles` (e.g. `plan = 'free' | 'starter' | 'pro'`), set **only** by the Stripe webhook from the subscription's active price ID. Never trust client input. Keep RLS blocking user edits to plan/quota/status.
- **Webhook:** on `customer.subscription.created/updated`, read the subscription item's price ID → map to tier server-side → persist plan + status. On `deleted` → revert to `free`. Keep signature verification.
- Keep quota/cap numbers in **server config or env** (not deep in code) so Starter limits can be tuned from launch data without a code deploy.

**Billing UI**
- Update `app/(dashboard)/billing/page.tsx` to render Free state + Starter + Pro, with Pro highlighted. Currently it hardcodes a single Pro plan.
- Enable plan switching (Starter↔Pro) via the Stripe billing portal; use Stripe default proration on upgrade.

**Out of scope for Phase 7 v1:** annual prices, seats, overage/add-on metering, coupons beyond what the portal already supports.

---

## 8. Open questions to resolve before Phase 7

These need a founder answer (and ideally early data) before implementation locks:

1. **Starter quota:** confirm 10 reports/30 days. This is a no-data guess and the most likely number to change.
2. **Starter price:** confirm A$39 (vs. e.g. A$29 or A$49).
3. **Free report scope:** 1 **lifetime** (recommended, safest for revenue) vs. 1 per 30 days. Confirm.
4. **Competitor caps:** confirm Free/Starter = 3, Pro = 5.
5. **Launch scope:** confirm Free + Pro only at Friday launch, Starter as fast-follow (recommended) — or require all three at launch.
6. **Grandfathering:** confirm any pre-Starter subscriber stays on current Pro terms.
7. **Currency:** AUD only at launch (recommended) or add USD pricing?
8. **Annual billing:** defer to a later phase (recommended) — confirm.

---

### Summary recommendation
Hold Pro at A$159 / 100 reports, keep the single free report as the trust hook, launch Friday with Free + Pro unchanged, and add a A$39 Starter / 10-report tier as an additive fast-follow — reusing the Stripe price IDs and quota plumbing that already exist, with all limits kept in config so they can be tuned the moment real funnel data arrives.
