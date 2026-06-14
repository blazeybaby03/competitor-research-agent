"use client";

import { useState } from "react";
import { PlusCircle, Trash2, Save, Sparkles, Check, X } from "lucide-react";
import type { Business, Competitor } from "@/lib/types";
import { useRouter } from "next/navigation";

interface SuggestedCompetitor {
  name: string;
  url: string;
  reason: string;
}

interface BusinessWithCompetitors extends Business {
  competitors?: Competitor[];
}

interface Props {
  initialBusiness: BusinessWithCompetitors | null;
  competitorLimit?: number;
  planName?: string;
}

export default function BusinessForm({ initialBusiness, competitorLimit, planName }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialBusiness?.name ?? "");
  const [industry, setIndustry] = useState(initialBusiness?.industry ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initialBusiness?.website_url ?? "");
  const [competitors, setCompetitors] = useState<string[]>(
    initialBusiness?.competitors?.map((c) => c.url) ?? ["", "", ""]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stage 3 — "Suggest my competitors" assisted flow. Suggestions are held in
  // local state only and never saved until the user adds them to the form and
  // saves the business through the normal validated path.
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedCompetitor[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestNotice, setSuggestNotice] = useState<string | null>(null);

  function addCompetitor() {
    if (competitors.length < 5) setCompetitors([...competitors, ""]);
  }

  async function fetchSuggestions() {
    setSuggestError(null);
    setSuggestNotice(null);
    if (!industry.trim()) {
      setSuggestError("Add your industry above first so we can suggest relevant competitors.");
      return;
    }
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/competitors/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, industry, websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Couldn't generate suggestions.");
      }
      const list = (data.suggestions ?? []) as SuggestedCompetitor[];
      if (list.length === 0) {
        setSuggestNotice(
          "We couldn't find confident suggestions. Please add competitor URLs manually."
        );
        return;
      }
      setSuggestions(list);
      setSelected(list.map(() => true));
    } catch (err) {
      setSuggestError(
        err instanceof Error ? err.message : "Couldn't generate suggestions. Please try again."
      );
    } finally {
      setSuggesting(false);
    }
  }

  function toggleSuggestion(index: number) {
    setSelected((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }

  // Add the user-confirmed suggestions into the competitor inputs. They still
  // aren't persisted — the user reviews them and clicks Save business details.
  function addSelectedSuggestions() {
    const chosen = suggestions.filter((_, i) => selected[i]).map((s) => s.url);
    if (chosen.length === 0) {
      setSuggestError("Select at least one suggestion to add, or dismiss them.");
      return;
    }
    const existing = competitors.map((u) => u.trim()).filter(Boolean);
    const merged = [...existing];
    let added = 0;
    for (const url of chosen) {
      if (merged.length >= 5) break;
      if (!merged.includes(url)) {
        merged.push(url);
        added += 1;
      }
    }
    const next = [...merged];
    if (next.length < 5) next.push(""); // keep a spare slot for manual edits
    if (next.length === 0) next.push("");
    setCompetitors(next);
    dismissSuggestions();
    setSuggestNotice(
      added > 0
        ? `Added ${added} suggested competitor${added === 1 ? "" : "s"} below. Review or edit them, then click Save business details.`
        : "Those suggestions were already in your list."
    );
  }

  function dismissSuggestions() {
    setSuggestions([]);
    setSelected([]);
    setSuggestError(null);
  }

  function removeCompetitor(index: number) {
    setCompetitors(competitors.filter((_, i) => i !== index));
  }

  function updateCompetitor(index: number, value: string) {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/business/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: initialBusiness?.id,
          name,
          industry,
          websiteUrl,
          competitorUrls: competitors.filter((u) => u.trim() !== ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Your business</h2>
      <p className="text-sm text-gray-500 mb-6">
        Tell us about your business and add competitor URLs. CompeteIQ will visit
        each competitor site, read their public content, and write a structured
        report based on what they actually publish. The number of competitors per
        report depends on your plan.
      </p>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business name *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input"
              placeholder="e.g. SaaS, E-commerce, Consulting"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your website (optional)
          </label>
          <input
            type="url"
            maxLength={2048}
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="input"
            placeholder="https://yoursite.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Competitor websites (1–5 URLs)
            </label>
            <button
              type="button"
              onClick={fetchSuggestions}
              disabled={suggesting}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {suggesting ? "Finding competitors…" : "Suggest competitors"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Not sure who your competitors are? We can suggest a few from your
            industry — you review and confirm before anything is saved.
          </p>

          {suggestError && (
            <p className="mb-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {suggestError}
            </p>
          )}
          {suggestNotice && (
            <p className="mb-3 text-xs text-brand-700 bg-brand-50 px-3 py-2 rounded-lg">
              {suggestNotice}
            </p>
          )}

          {/* Suggestions panel — confirmation required before adding */}
          {suggestions.length > 0 && (
            <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="text-sm font-semibold text-gray-900">
                  Suggested competitors
                </p>
                <button
                  type="button"
                  onClick={dismissSuggestions}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Dismiss suggestions"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                These are AI suggestions, not verified competitors. Tick the ones
                to add, then confirm. Nothing is saved until you save your
                business details.
              </p>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={s.url}>
                    <label className="flex items-start gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected[i] ?? false}
                        onChange={() => toggleSuggestion(i)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {s.name || s.url}
                        </p>
                        <p className="text-xs text-gray-400 break-all">{s.url}</p>
                        {s.reason && (
                          <p className="text-xs text-gray-500 mt-0.5">{s.reason}</p>
                        )}
                      </div>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={addSelectedSuggestions}
                  className="btn-primary text-sm inline-flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Add selected
                </button>
                <button
                  type="button"
                  onClick={dismissSuggestions}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {competitors.map((url, i) => (
              <div key={i} className="flex gap-2">
                <input
                  type="url"
                  maxLength={2048}
                  value={url}
                  onChange={(e) => updateCompetitor(i, e.target.value)}
                  className="input"
                  placeholder={`https://competitor${i + 1}.com`}
                />
                {competitors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCompetitor(i)}
                    aria-label={`Remove competitor ${i + 1}`}
                    className="p-2.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {competitors.length < 5 && (
            <button
              type="button"
              onClick={addCompetitor}
              className="mt-2 flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
            >
              <PlusCircle className="h-4 w-4" />
              Add competitor
            </button>
          )}
          {competitorLimit !== undefined &&
            planName !== undefined &&
            competitors.filter((u) => u.trim() !== "").length >
              competitorLimit && (
              <p className="mt-2 text-xs text-amber-600">
                {planName} supports up to {competitorLimit} competitors per
                report. Remove{" "}
                {competitors.filter((u) => u.trim() !== "").length -
                  competitorLimit}{" "}
                to enable report generation, or upgrade your plan.
              </p>
            )}
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? (
            "Saving…"
          ) : saved ? (
            "Saved ✓"
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save business details
            </>
          )}
        </button>
      </form>
    </div>
  );
}
