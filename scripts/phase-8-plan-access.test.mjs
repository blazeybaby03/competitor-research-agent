import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(file) {
  return readFileSync(file, "utf8");
}

test("Phase 8 migration adds plan access without restoring user billing writes", () => {
  const migration = read("supabase/migrations/006_plan_based_access.sql");

  assert.match(migration, /add column if not exists plan text not null default 'free'/);
  assert.match(migration, /check \(plan in \('free', 'starter', 'pro'\)\)/);
  assert.match(migration, /where subscription_status = 'active'\s+and plan = 'free'/);
  assert.match(migration, /drop policy if exists "Users can update own profile"/);
  assert.doesNotMatch(migration, /for update[\s\S]*auth\.uid\(\) = id/);
});

test("Phase 8 plan config keeps pricing and quotas server-derived", () => {
  const plans = read("lib/plans.ts");

  assert.match(plans, /export type PlanKey = "free" \| "starter" \| "pro"/);
  assert.match(plans, /STRIPE_STARTER_PRICE_ID/);
  assert.match(plans, /STRIPE_GROWTH_PRICE_ID/);
  assert.match(plans, /REPORT_LIMIT_STARTER/);
  assert.match(plans, /REPORT_LIMIT_PRO/);
  assert.match(plans, /COMPETITOR_LIMIT_FREE/);
  assert.match(plans, /COMPETITOR_LIMIT_STARTER/);
  assert.match(plans, /COMPETITOR_LIMIT_PRO/);
  assert.match(plans, /getAllowedPriceIds/);
  assert.match(plans, /getPlanByStripePriceId/);
  assert.match(plans, /if \(subscriptionStatus === "active"\) return "pro"/);
});

test("Phase 8 checkout only accepts configured Stripe plan prices", () => {
  const checkout = read("app/api/billing/checkout/route.ts");

  assert.match(checkout, /const allowed = getAllowedPriceIds\(\)/);
  assert.match(checkout, /if \(!allowed\.has\(priceId\)\)/);
  assert.match(checkout, /selected_plan: selectedPlan \?\? "unknown"/);
  assert.match(checkout, /subscription_data:\s*{[\s\S]*metadata:/);
  assert.match(checkout, /mode:\s*"subscription"/);
});

test("Phase 8 webhook maps Stripe prices to plan entitlements", () => {
  const webhook = read("app/api/billing/webhook/route.ts");

  assert.match(webhook, /constructEvent/);
  assert.match(webhook, /getSubscriptionPriceId/);
  assert.match(webhook, /const plan = getPlanByStripePriceId\(priceId\)/);
  assert.match(webhook, /profileUpdate\.plan = plan/);
  assert.match(webhook, /profileUpdate\.plan = "free"/);
  assert.match(webhook, /\.eq\("stripe_customer_id", customerId\)/);
});

test("Phase 8 report generation enforces plan caps before expensive work", () => {
  const route = read("app/api/reports/generate/route.ts");
  const quotaCheckIndex = route.indexOf("isMonthlyQuotaExceeded");
  const businessFetchIndex = route.indexOf("// Verify business ownership");
  const capCheckIndex = route.indexOf("competitors.length > planConfig.competitorLimit");
  // The expensive scrape+AI work now runs via the shared runReport() (the
  // scrape/AI core moved to lib/reportRunner). Use it as the "expensive work" marker.
  const expensiveWorkIndex = route.indexOf("await runReport(");

  assert.ok(quotaCheckIndex > -1, "report route should check plan quota");
  assert.ok(businessFetchIndex > -1, "report route should fetch business after quota setup");
  assert.ok(quotaCheckIndex < businessFetchIndex, "quota should be checked before business/scrape work");
  assert.ok(capCheckIndex > -1, "report route should check plan competitor cap");
  assert.ok(expensiveWorkIndex > -1, "report route should still run report generation");
  assert.ok(capCheckIndex < expensiveWorkIndex, "competitor cap should be enforced before the expensive scrape+AI run");
  assert.match(route, /planConfig\.reportLimit/);
  assert.match(route, /planConfig\.competitorLimit/);
  assert.match(route, /try_consume_trial_credit/);
  assert.match(route, /restore_trial_credit/);
});

test("Phase 8 billing UI hides unconfigured paid plans", () => {
  const billing = read("app/(dashboard)/billing/page.tsx");

  assert.match(billing, /PAID_PLANS/);
  assert.match(billing, /availablePaidPlans = PAID_PLANS\.filter\(\(plan\) => Boolean\(plan\.stripePriceId\)\)/);
  assert.match(billing, /STRIPE_STARTER_PRICE_ID/);
  assert.match(billing, /STRIPE_GROWTH_PRICE_ID/);
  assert.match(billing, /resolvePlan\(profile\?\.subscription_status, profile\?\.plan\)/);
});
