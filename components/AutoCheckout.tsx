"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  priceId: string;
  planName: string;
}

/**
 * Auto-starts Stripe Checkout for a pre-selected plan (e.g. arriving from the
 * landing page pricing buttons via /billing?plan=...). On any failure it falls
 * back gracefully so the normal plan picker below stays usable.
 */
export default function AutoCheckout({ priceId, planName }: Props) {
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priceId }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (res.ok && data.url) {
          window.location.href = data.url;
        } else {
          setError(
            data.error ??
              "We couldn't start checkout automatically. Choose a plan below to continue."
          );
        }
      } catch {
        setError(
          "We couldn't start checkout automatically. Choose a plan below to continue."
        );
      }
    })();
  }, [priceId]);

  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  return (
    <div className="card p-6 flex items-center gap-3">
      <span
        className="h-4 w-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin"
        aria-hidden="true"
      />
      <p className="text-sm text-gray-700">
        Redirecting you to secure checkout for {planName}…
      </p>
    </div>
  );
}
