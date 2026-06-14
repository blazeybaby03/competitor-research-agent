"use client";

import { useState } from "react";

interface Props {
  priceId: string;
  planName: string;
  highlighted: boolean;
  envVarName: string;
}

export default function CheckoutButton({ priceId, planName, highlighted, envVarName }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
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
        setError(data.error ?? "Failed to start checkout. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!priceId) {
    return (
      <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        Checkout is not yet configured. If you&apos;re the site operator, set{" "}
        <code className="font-mono text-xs">{envVarName}</code> in your
        environment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={highlighted ? "btn-primary w-full" : "btn-secondary w-full"}
      >
        {loading ? "Redirecting to Stripe…" : `Upgrade to ${planName}`}
      </button>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
