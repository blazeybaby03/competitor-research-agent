"use client";

import { useState } from "react";
import EmailCaptureModal from "@/components/EmailCaptureModal";

export default function GuestReportForm() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!competitorUrl.trim()) {
      setError("Please enter a competitor URL.");
      return;
    }

    // Basic client-side check — server validates fully.
    try {
      const url = competitorUrl.trim().startsWith("http")
        ? competitorUrl.trim()
        : `https://${competitorUrl.trim()}`;
      new URL(url);
    } catch {
      setError("Please enter a valid competitor URL (e.g. https://competitor.com).");
      return;
    }

    setModalOpen(true);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto">
        <div className="flex flex-col gap-3">
          <input
            type="url"
            placeholder="Your website (optional) — e.g. https://yoursite.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <input
            type="url"
            placeholder="Competitor URL — e.g. https://competitor.com"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary px-8 py-3 text-base">
            Generate free report →
          </button>
        </div>
      </form>

      {modalOpen && (
        <EmailCaptureModal
          websiteUrl={websiteUrl}
          competitorUrl={competitorUrl}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
