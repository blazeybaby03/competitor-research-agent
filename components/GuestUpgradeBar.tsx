"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, CheckCircle, TrendingUp } from "lucide-react";

const plans = [
  {
    key: "starter" as const,
    name: "Starter",
    price: "A$39",
    period: "/month",
    reports: "10 reports per 30 days",
    competitors: "Up to 3 competitors",
    highlighted: false,
    badge: null,
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: "A$159",
    period: "/month",
    reports: "100 reports per 30 days",
    competitors: "Up to 5 competitors",
    highlighted: true,
    badge: "Most popular",
  },
];

const sharedFeatures = [
  "Monthly auto-monitoring with \"what changed\" summaries",
  "Client-ready PDF export",
  "All 7 report sections",
  "Cancel any time",
];

export default function GuestUpgradeBar() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [minimised, setMinimised] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!visible || dismissed) return null;

  if (minimised) {
    return (
      <div className="fixed bottom-0 inset-x-0 z-50 bg-brand-600 text-white py-2.5 px-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">Monitor competitors monthly — from A$39/mo</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMinimised(false)}
            className="text-white/90 hover:text-white text-sm font-medium underline"
          >
            See plans
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss"
            className="text-white/70 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t-2 border-brand-100 shadow-2xl no-print">
      <div className="mx-auto max-w-5xl px-4 py-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-base font-bold text-gray-900">
              Save this report and monitor competitors every month
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Your free report expires in 30 days. Subscribe to keep it and run fresh analyses.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button
              onClick={() => setMinimised(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Minimise
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {plans.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                plan.highlighted
                  ? "border-brand-300 bg-brand-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${plan.highlighted ? "text-brand-700" : "text-gray-800"}`}>
                    {plan.name}
                  </span>
                  {plan.badge && (
                    <span className="rounded-full bg-brand-600 text-white text-[10px] font-semibold px-1.5 py-0.5">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{plan.reports} · {plan.competitors}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-xl font-extrabold text-gray-900">{plan.price}</span>
                  <span className="text-xs text-gray-500">{plan.period}</span>
                </div>
                <Link
                  href={`/signup?plan=${plan.key}`}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold whitespace-nowrap ${
                    plan.highlighted
                      ? "bg-brand-600 text-white hover:bg-brand-700"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  Subscribe →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Shared features */}
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {sharedFeatures.map((f) => (
            <span key={f} className="flex items-center gap-1 text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
