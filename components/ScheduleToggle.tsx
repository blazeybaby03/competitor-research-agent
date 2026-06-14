"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Lock, AlertTriangle, Sparkles } from "lucide-react";
import Link from "next/link";

interface Props {
  businessId: string;
  isActive: boolean; // active paid subscription
  initialEnabled: boolean;
  lastRunAt: string | null;
  lastStatus: "success" | "failed" | null;
}

export default function ScheduleToggle({
  businessId,
  isActive,
  initialEnabled,
  lastRunAt,
  lastStatus,
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lapsed users keep the ability to turn an existing schedule OFF, but can't
  // turn it back ON without an active plan.
  const showSwitch = isActive || enabled;

  async function toggle() {
    setError(null);
    const next = !enabled;
    if (next && !isActive) {
      setError(
        "Scheduled re-runs are a paid feature. Upgrade to Starter or Pro to enable them."
      );
      return;
    }
    setSaving(true);
    // Optimistic update; revert on failure.
    setEnabled(next);
    try {
      const res = await fetch("/api/business/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, enabled: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update schedule.");
      router.refresh();
    } catch (err) {
      setEnabled(!next);
      setError(err instanceof Error ? err.message : "Failed to update schedule.");
    } finally {
      setSaving(false);
    }
  }

  const lastRunText = lastRunAt
    ? `Last re-run ${new Date(lastRunAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}`
    : "Not run yet";

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
          <CalendarClock className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly re-runs
            </h2>
            {showSwitch ? (
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={toggle}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
                  enabled ? "bg-brand-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    enabled ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                Paid feature
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Automatically re-run this report about once a month and get a short
            summary of what changed since the previous run.
          </p>

          {isActive ? (
            <p className="text-xs text-gray-400 mt-3">
              {enabled ? (
                <>
                  On · {lastRunText}
                  {lastStatus === "failed" && (
                    <span className="ml-1 inline-flex items-center gap-1 text-amber-600">
                      <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                      last attempt failed — we&apos;ll retry next cycle
                    </span>
                  )}
                </>
              ) : (
                "Off — turn on to schedule monthly re-runs."
              )}
            </p>
          ) : enabled ? (
            // Lapsed plan but a schedule is still on — let them turn it off.
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" aria-hidden="true" />
              <p className="text-xs text-amber-800">
                Your plan no longer includes scheduled re-runs, so they won&apos;t
                run. Turn this off, or{" "}
                <Link href="/billing" className="font-medium underline hover:no-underline">
                  upgrade
                </Link>{" "}
                to keep them.
              </p>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2">
              <Sparkles className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
              <p className="text-xs text-brand-800">
                Scheduled re-runs are included with Starter and Pro.{" "}
                <Link href="/billing" className="font-medium underline hover:no-underline">
                  See plans
                </Link>
                .
              </p>
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
