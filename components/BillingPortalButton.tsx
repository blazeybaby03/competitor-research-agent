"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface Props {
  supportEmail?: string;
  label?: string;
}

export default function BillingPortalButton({ supportEmail, label }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Unable to open billing portal");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button onClick={openPortal} disabled={loading} className="btn-primary">
        <span className="flex items-center justify-center gap-2">
          <ExternalLink className="h-4 w-4" />
          {loading ? "Opening billing portal..." : label ?? "Manage subscription"}
        </span>
      </button>

      {supportEmail && (
        <p className="text-sm text-gray-500">
          Need help? Email{" "}
          <a href={`mailto:${supportEmail}`} className="text-brand-600 hover:underline">
            {supportEmail}
          </a>
          .
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
    </div>
  );
}
