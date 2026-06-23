import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutButton from "@/components/CheckoutButton";
import BillingPortalButton from "@/components/BillingPortalButton";
import AutoCheckout from "@/components/AutoCheckout";
import SubscriptionManager from "@/components/SubscriptionManager";
import { CheckCircle, Shield } from "lucide-react";
import { PLANS, resolvePlan, getPlanByStripePriceId } from "@/lib/plans";
import Stripe from "stripe";

interface PaidPlanCard {
  key: "starter" | "pro";
  name: string;
  priceLabel: string;
  reportLimit: number;
  competitorLimit: number;
  stripePriceId?: string;
  period: string;
  envVarName: string;
  description: string;
  highlighted: boolean;
  badge?: string;
  features: string[];
}

const PAID_PLANS: PaidPlanCard[] = [
  {
    ...PLANS.starter,
    key: "starter",
    period: "/month",
    envVarName: "STRIPE_STARTER_PRICE_ID",
    description: "Keep generating fresh competitor analyses when your free report runs out.",
    highlighted: false,
    features: [
      `${PLANS.starter.reportLimit} competitor reports per 30 days`,
      `Up to ${PLANS.starter.competitorLimit} competitors per report`,
      "All 7 report sections included",
      "Scheduled monthly re-runs",
      "Client-ready PDF export",
      "Copy & share reports",
      "Cancel any time",
    ],
  },
  {
    ...PLANS.pro,
    key: "pro",
    period: "/month",
    envVarName: "STRIPE_GROWTH_PRICE_ID",
    description: "Research competitors across clients, markets, and ongoing strategy cycles.",
    highlighted: true,
    badge: "Best for repeat research",
    features: [
      `${PLANS.pro.reportLimit} competitor reports per 30 days`,
      `Up to ${PLANS.pro.competitorLimit} competitors per report`,
      "All 7 report sections included",
      "Scheduled monthly re-runs",
      "Client-ready PDF export",
      "Copy & share reports",
      "Priority support",
      "Cancel any time",
    ],
  },
];

const FREE_PLAN = {
  name: "Free",
  price: "A$0",
  features: [
    "1 full report — yours to keep",
    `Up to ${PLANS.free.competitorLimit} competitors per report`,
    "All 7 report sections included",
    "No credit card required",
  ],
};

interface BillingPageProps {
  searchParams: Promise<{ plan?: string }>;
}

export default async function SettingsBillingPage({ searchParams }: BillingPageProps) {
  const { plan: planParam } = await searchParams;
  const requestedPlan =
    planParam === "starter" || planParam === "pro" ? planParam : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = requestedPlan
      ? `?next=${encodeURIComponent(`/settings/billing?plan=${requestedPlan}`)}`
      : "";
    redirect(`/login${next}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, stripe_subscription_id, plan")
    .eq("id", user!.id)
    .single();

  const isActive = profile?.subscription_status === "active";
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

  const autoCheckout =
    requestedPlan && !isActive && PLANS[requestedPlan].stripePriceId
      ? {
          priceId: PLANS[requestedPlan].stripePriceId as string,
          planName: PLANS[requestedPlan].name,
        }
      : null;
  const availablePaidPlans = PAID_PLANS.filter((plan) => Boolean(plan.stripePriceId));
  const planGridClass =
    availablePaidPlans.length > 1 ? "grid gap-4 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2";

  let subPeriodEndISO: string | null = null;
  let subCancelAtPeriodEnd = false;
  let activePlanKey = resolvePlan(profile?.subscription_status, profile?.plan);
  if (isActive && profile?.stripe_subscription_id) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2025-02-24.acacia",
      });
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      const currentPriceId = sub.items.data[0]?.price?.id ?? null;
      activePlanKey = getPlanByStripePriceId(currentPriceId) ?? activePlanKey;
      subCancelAtPeriodEnd = sub.cancel_at_period_end;
      subPeriodEndISO = sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null;
    } catch (err) {
      console.error("Failed to load subscription for billing page:", err);
    }
  }

  const activePlan = PLANS[activePlanKey];
  const alternatePlans = PAID_PLANS.filter(
    (plan) => Boolean(plan.stripePriceId) && plan.key !== activePlanKey
  ).map((plan) => ({
    key: plan.key,
    name: plan.name,
    priceLabel: plan.priceLabel,
    reportLimit: plan.reportLimit,
    stripePriceId: plan.stripePriceId as string,
    isUpgrade: PLANS[plan.key].reportLimit > activePlan.reportLimit,
  }));
  const renewalText = subCancelAtPeriodEnd
    ? ""
    : subPeriodEndISO
      ? ` Renews ${new Date(subPeriodEndISO).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}.`
      : "";

  return (
    <div className="space-y-8">
      {isActive ? (
        <div className="space-y-6">
          <div className="card p-6 max-w-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="font-semibold text-gray-900">
                  {activePlan.name} — Active
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {activePlan.reportLimit} reports per 30 days and up to{" "}
                  {activePlan.competitorLimit} competitors per report.
                  {renewalText}
                </p>
              </div>
            </div>
          </div>

          <SubscriptionManager
            currentPlanName={activePlan.name}
            alternatePlans={alternatePlans}
            cancelAtPeriodEnd={subCancelAtPeriodEnd}
            periodEndISO={subPeriodEndISO}
          />

          <div className="card p-6 max-w-lg">
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
              <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Payments are processed securely by Stripe.
            </div>
            <div className="max-w-xs">
              <BillingPortalButton
                supportEmail={supportEmail}
                label="Payment methods & invoices"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {autoCheckout && (
            <div className="mb-6">
              <AutoCheckout
                priceId={autoCheckout.priceId}
                planName={autoCheckout.planName}
              />
            </div>
          )}
          <p className="text-sm text-gray-500 mb-6">
            You&apos;ve used your free report. Upgrade to keep running fresh
            competitor analyses — Starter gives you 10 reports per 30 days,
            Pro gives you 100 with up to 5 competitors each.
          </p>
          <div className={planGridClass}>
            <div className="card p-6">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Free
              </div>
              <div className="mb-1">
                <span className="text-3xl font-extrabold text-gray-900">
                  {FREE_PLAN.price}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                A complete first report so you can evaluate the product.
              </p>
              <ul className="space-y-2.5">
                {FREE_PLAN.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {availablePaidPlans.map((plan) => (
              <div
                key={plan.key}
                className={`card p-6 ${plan.highlighted ? "ring-2 ring-brand-600" : ""}`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide">
                    {plan.name}
                  </div>
                  {plan.badge && (
                    <span className="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="mb-1">
                  <span className="text-3xl font-extrabold text-gray-900">
                    {plan.priceLabel}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-5">{plan.description}</p>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                <CheckoutButton
                  priceId={plan.stripePriceId ?? ""}
                  planName={plan.name}
                  highlighted={plan.highlighted}
                  envVarName={plan.envVarName}
                />
              </div>
            ))}
          </div>
          <div className="max-w-sm mt-5">
            <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
              <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Secure payment via Stripe. Cancel any time.
            </div>
            {supportEmail && (
              <p className="text-xs text-gray-400 mt-3">
                Questions?{" "}
                <a href={`mailto:${supportEmail}`} className="text-brand-600 hover:underline">
                  Email us
                </a>
                .
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
