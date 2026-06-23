# Launch Readiness Checklist — CompeteIQ

> **Status: Launched.** The app went live at competeiq.pro in June 2026. This checklist is kept as a historical record of pre-launch work. Items below may or may not have been explicitly checked off before launch.

~~Target launch: Friday morning, 5 June 2026~~

~~Payment confidence deadline: Thursday, 5pm~~

## Phase 1 — Code quality and hidden-error audit

### Baseline checks

- [ ] Run `npm install`.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Add `typecheck` script if missing.
- [ ] Add test scripts if missing.
- [ ] Confirm no secrets are committed.
- [ ] Confirm `.env.local` is ignored.
- [ ] Confirm Railway build/start settings match `railway.toml`.
- [ ] Confirm `NEXT_PUBLIC_APP_URL` is the production app host and not the Supabase project URL.
- [ ] Confirm Supabase Auth Site URL and allowed redirect URLs use the production app host.

### Auth and dashboard flow

- [ ] Homepage loads successfully.
- [ ] Unauthenticated users can access `/`, `/login`, and `/signup`.
- [ ] Unauthenticated users are redirected away from `/dashboard`.
- [ ] Unauthenticated users are redirected away from `/reports`.
- [ ] Authenticated users are redirected away from `/login` and `/signup`.
- [ ] Dashboard loads for authenticated users.
- [ ] New users receive a profile row after signup.

### Business and competitor flow

- [ ] Business can be created.
- [ ] Business can be updated.
- [ ] Competitor URLs can be added.
- [ ] Competitor URLs can be replaced atomically.
- [ ] Invalid URLs are rejected server-side.
- [ ] Private/internal URLs are rejected server-side.
- [ ] More than five competitor URLs are rejected.

### Report generation flow

- [ ] Missing `businessId` returns a safe error.
- [ ] Non-owned business ID is rejected.
- [ ] Zero competitors returns a safe error.
- [ ] Report row is created before trial credit consumption.
- [ ] Trial credit is restored after scrape/AI failure.
- [ ] Failed report is marked `failed`.
- [ ] Completed report cannot be saved with empty AI output.
- [ ] Partial scrape failure still produces useful output where possible.
- [ ] Rate limit blocks excessive report generation.

## Phase 2 — Stripe and payout validation

### Stripe checkout

- [ ] Confirm live Starter and Pro products exist in Stripe.
- [ ] Confirm the `A$39/mo` Starter price is correct.
- [ ] Confirm the `A$159/mo` Pro price is correct.
- [ ] Confirm `STRIPE_STARTER_PRICE_ID` matches the Starter price in Stripe.
- [ ] Confirm `STRIPE_GROWTH_PRICE_ID` matches the Pro price in Stripe.
- [ ] Confirm only configured plan price IDs are accepted (server-side allowlist).
- [ ] Confirm checkout route rejects logged-out users.
- [ ] Confirm checkout route rejects missing price ID.
- [ ] Confirm checkout route rejects unknown price ID.
- [ ] Confirm checkout creates a subscription checkout session.
- [ ] Confirm success URL returns to `/billing?success=true`.
- [ ] Confirm cancel URL returns to `/billing?canceled=true`.
- [ ] Confirm neither checkout nor portal return URLs contain `yzwkvwcflnnwrcyadqzv.supabase.co`.

### Stripe webhook

- [ ] Confirm production webhook points to `/api/billing/webhook`.
- [ ] Confirm webhook secret is installed in the production hosting environment.
- [ ] Confirm missing Stripe signature is rejected.
- [ ] Confirm invalid signature is rejected.
- [ ] Confirm `customer.subscription.created` marks profile active.
- [ ] Confirm `customer.subscription.updated` updates profile status.
- [ ] Confirm `customer.subscription.deleted` marks profile canceled.
- [ ] Confirm the stored plan (`starter`/`pro`) is synced from the subscription's price ID.
- [ ] Confirm Starter subscribers can generate up to 10 reports per 30 days.
- [ ] Confirm Pro subscribers can generate up to 100 reports per 30 days.
- [ ] Confirm plan changes (upgrade/downgrade) reprice with prorations.
- [ ] Confirm canceled users lose paid report access.

### Stripe payouts

- [ ] Confirm Stripe account identity verification is complete.
- [ ] Confirm payout bank account is added.
- [ ] Confirm payout currency and country settings are correct.
- [ ] Confirm payout schedule is visible in Stripe Dashboard.
- [ ] Confirm first payout timing is understood.

## Phase 3 — Landing page trust upgrade

- [ ] Add stronger hero copy.
- [ ] Add product/report preview visual.
- [ ] Add clearer first-report-free positioning.
- [ ] Add secure billing/trust messaging.
- [ ] Add target customer use cases.
- [ ] Add stronger CTA hierarchy.
- [ ] Confirm mobile view.
- [ ] Confirm Lighthouse/performance is acceptable.

## Phase 4 — Social launch system

- [ ] Draft 14-day Twitter/X content.
- [ ] Draft 14-day LinkedIn personal content.
- [ ] Draft LinkedIn business page content.
- [ ] Create Reddit account.
- [ ] Create WordPress account.
- [ ] Draft two WordPress posts.
- [ ] Identify posts that need visual assets.
- [ ] Schedule approved posts in Buffer.
- [ ] Monitor analytics after posts go live.

## Phase 5 — Automation backlog

- [ ] Capture every repeated launch task.
- [ ] Mark each task as automate, template, delegate, or ignore.
- [ ] Create post-launch automation backlog.
- [ ] Prioritise automations that reduce support, testing, or content scheduling time.
