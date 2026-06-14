"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle } from "lucide-react";

interface Props {
  businessId: string;
  competitorCount: number;
  trialReportsUsed: number;
  subscriptionStatus: string;
  planName: string;
  competitorLimit: number;
  proCompetitorLimit: number;
}

const loadingSteps = [
  "Scraping competitor pages…",
  "Reading their positioning and pricing…",
  "Analysing market gaps…",
  "Writing your report…",
];

export default function GenerateReportButton({
  businessId,
  competitorCount,
  trialReportsUsed,
  subscriptionStatus,
  planName,
  competitorLimit,
  proCompetitorLimit,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isTrialing = subscriptionStatus !== "active";
  const trialRemaining = Math.max(0, 1 - trialReportsUsed);

  useEffect(() => {
    if (!loading) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % loadingSteps.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [loading]);

  async function handleGenerate() {
    if (competitorCount === 0) {
      setError("Add at least one competitor URL before generating a report.");
      return;
    }
    if (competitorCount > competitorLimit) {
      setError(
        planName === "Pro"
          ? `You can include up to ${competitorLimit} competitors per report.`
          : `${planName} supports up to ${competitorLimit} competitors per report. Upgrade to Pro for up to ${proCompetitorLimit}.`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate report");
      }

      router.push(`/reports/${data.reportId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {isTrialing && trialRemaining > 0 && (
        <p className="text-xs text-gray-500">
          {trialRemaining} free report remaining.{" "}
          <a href="/billing" className="text-brand-600 hover:underline">
            See Starter &amp; Pro plans →
          </a>
        </p>
      )}

      <button
        onClick={handleGenerate}
        disabled={loading || competitorCount === 0 || competitorCount > competitorLimit}
        className="btn-primary"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {loadingSteps[stepIndex]}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate AI Report
          </span>
        )}
      </button>

      {loading && (
        <p className="text-xs text-gray-400">
          This takes about 60 seconds. Stay on this page — you&apos;ll be taken
          to your report automatically.
        </p>
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {competitorCount === 0 && !error && (
        <p className="text-xs text-gray-400">
          Save at least one competitor URL above to enable report generation.
        </p>
      )}
      {competitorCount > competitorLimit && !error && (
        <p className="text-xs text-amber-600">
          {planName === "Pro"
            ? `You can include up to ${competitorLimit} competitors per report.`
            : `${planName} supports up to ${competitorLimit} competitors per report. Upgrade to Pro for up to ${proCompetitorLimit}.`}
        </p>
      )}
    </div>
  );
}
