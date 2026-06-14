export type PlanKey = "free" | "starter" | "pro";

export interface PlanConfig {
  key: PlanKey;
  name: string;
  priceLabel: string;
  reportLimit: number;
  competitorLimit: number;
  stripePriceId?: string;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const PLANS: Record<PlanKey, PlanConfig> = {
  free: {
    key: "free",
    name: "Free",
    priceLabel: "A$0",
    reportLimit: 1,
    competitorLimit: envInt("COMPETITOR_LIMIT_FREE", 3),
  },
  starter: {
    key: "starter",
    name: "Starter",
    priceLabel: "A$39",
    reportLimit: envInt("REPORT_LIMIT_STARTER", 10),
    competitorLimit: envInt("COMPETITOR_LIMIT_STARTER", 3),
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceLabel: "A$159",
    reportLimit: envInt("REPORT_LIMIT_PRO", 100),
    competitorLimit: envInt("COMPETITOR_LIMIT_PRO", 5),
    stripePriceId: process.env.STRIPE_GROWTH_PRICE_ID,
  },
};

export function getPlanByStripePriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;

  if (PLANS.starter.stripePriceId && priceId === PLANS.starter.stripePriceId) {
    return "starter";
  }
  if (PLANS.pro.stripePriceId && priceId === PLANS.pro.stripePriceId) {
    return "pro";
  }

  return null;
}

export function getAllowedPriceIds(): Set<string> {
  const ids = new Set<string>();
  if (PLANS.starter.stripePriceId) ids.add(PLANS.starter.stripePriceId);
  if (PLANS.pro.stripePriceId) ids.add(PLANS.pro.stripePriceId);
  return ids;
}

export function resolvePlan(
  subscriptionStatus: string | null | undefined,
  storedPlan: string | null | undefined
): PlanKey {
  if (storedPlan === "starter" || storedPlan === "pro") return storedPlan;

  // Backward compatibility for active subscribers created before profiles.plan.
  if (subscriptionStatus === "active") return "pro";

  return "free";
}
