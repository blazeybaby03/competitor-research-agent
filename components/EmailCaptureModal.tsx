"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props {
  websiteUrl: string;
  competitorUrl: string;
  onClose: () => void;
}

const loadingSteps = [
  "Scraping competitor pages…",
  "Reading their positioning and pricing…",
  "Analysing market gaps…",
  "Writing your report…",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailCaptureModal({ websiteUrl, competitorUrl, onClose }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cycle loading messages every 15 seconds while generating.
  useEffect(() => {
    if (!loading) return;
    intervalRef.current = setInterval(() => {
      setStepIndex((i) => (i + 1) % loadingSteps.length);
    }, 15_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  // Trap focus and close on Escape.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setStepIndex(0);

    // Normalise URL — add https:// if missing.
    const normalise = (url: string) =>
      url.trim() && !url.trim().startsWith("http") ? `https://${url.trim()}` : url.trim();

    try {
      const res = await fetch("/api/reports/generate-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          websiteUrl: normalise(websiteUrl) || undefined,
          competitorUrl: normalise(competitorUrl),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      router.push(`/guest-report/${data.token}`);
    } catch {
      setLoading(false);
      setError("Network error. Please check your connection and try again.");
    }
  }

  function friendlyHost(url: string): string {
    try {
      const u = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-8">
        {!loading && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <p className="text-lg font-semibold text-gray-900 mb-1">Generating your report…</p>
            <p className="text-sm text-gray-500 mb-2">{loadingSteps[stepIndex]}</p>
            <p className="text-xs text-gray-400">This takes about 60 seconds</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Where should we send your report?</h2>
            <p className="text-sm text-gray-500 mb-5">
              Generating a report on{" "}
              <span className="font-medium text-gray-700">{friendlyHost(competitorUrl)}</span>
              {websiteUrl && (
                <>
                  {" "}for{" "}
                  <span className="font-medium text-gray-700">{friendlyHost(websiteUrl)}</span>
                </>
              )}
              . We&apos;ll email you a copy too.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary py-3 text-base disabled:opacity-60"
              >
                Get my free report →
              </button>
              <p className="text-xs text-center text-gray-400">
                No account needed. We&apos;ll send your report link to this email address.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
