"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

interface PlanOption {
  key: "starter" | "pro";
  name: string;
  priceLabel: string;
  reportLimit: number;
  stripePriceId: string;
  /** True when this plan costs more than the current one (an upgrade). */
  isUpgrade: boolean;
}

interface Props {
  currentPlanName: string;
  alternatePlans: PlanOption[];
  cancelAtPeriodEnd: boolean;
  periodEndISO: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return "the end of your billing period";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SubscriptionManager({
  currentPlanName,
  alternatePlans,
  cancelAtPeriodEnd,
  periodEndISO,
}: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  async function post(url: string, payload: Record<string, unknown>, key: string) {
    setPending(key);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(null);
      setConfirmingCancel(false);
    }
  }

  return (
    <div className="card p-6 max-w-lg space-y-6">
      {/* Change plan */}
      {alternatePlans.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Change plan</h3>
          <p className="text-sm text-gray-500 mb-4">
            Switch anytime. Upgrades are charged a prorated amount now; downgrades
            apply a credit to your next invoice.
          </p>
          <div className="space-y-2.5">
            {alternatePlans.map((plan) => (
              <button
                key={plan.key}
                type="button"
                disabled={pending !== null}
                onClick={() =>
                  post("/api/billing/change-plan", { priceId: plan.stripePriceId }, plan.key)
                }
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-left hover:border-brand-300 hover:bg-brand-50/40 transition-colors disabled:opacity-60"
              >
                <span className="flex items-center gap-2.5">
                  {plan.isUpgrade ? (
                    <ArrowUpRight className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
                  )}
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {plan.isUpgrade ? "Upgrade to" : "Switch to"} {plan.name}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {plan.reportLimit} reports / 30 days
                    </span>
                  </span>
                </span>
                <span className="text-sm font-semibold text-gray-900 shrink-0">
                  {pending === plan.key ? "Updating…" : `${plan.priceLabel}/mo`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancel / resume */}
      <div className="border-t border-gray-100 pt-5">
        {cancelAtPeriodEnd ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-amber-800">
                Your {currentPlanName} plan is set to cancel on{" "}
                <span className="font-semibold">{formatDate(periodEndISO)}</span>. You
                keep access until then.
              </p>
            </div>
            <button
              type="button"
              disabled={pending !== null}
              onClick={() => post("/api/billing/cancel", { action: "resume" }, "resume")}
              className="btn-primary text-sm"
            >
              {pending === "resume" ? "Resuming…" : "Resume subscription"}
            </button>
          </div>
        ) : confirmingCancel ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              Cancel your {currentPlanName} plan? You&apos;ll keep access until{" "}
              <span className="font-semibold">{formatDate(periodEndISO)}</span>, then
              move to the free plan.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => post("/api/billing/cancel", { action: "cancel" }, "cancel")}
                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg disabled:opacity-60"
              >
                {pending === "cancel" ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button
                type="button"
                disabled={pending !== null}
                onClick={() => setConfirmingCancel(false)}
                className="btn-secondary text-sm"
              >
                Keep my plan
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingCancel(true)}
            className="text-sm text-gray-500 hover:text-red-600 transition-colors"
          >
            Cancel subscription
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
