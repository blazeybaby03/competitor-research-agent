// Stage 3 (Suggest My Competitors): pure types + parsing for AI competitor
// suggestions. Kept free of runtime imports (the Anthropic client lives in
// lib/suggestCompetitors.ts) so the parser can be unit tested in isolation.

export interface CompetitorSuggestion {
  name: string;
  url: string;
  reason: string;
}

// Hard cap on how many suggestions we ever surface to the user.
export const MAX_SUGGESTIONS = 5;

/**
 * Parse the model's JSON array of suggestions into a clean, typed list.
 * Pure and self-contained. Drops any entry without a usable url; never throws
 * on individual malformed items (only on a missing/invalid top-level array).
 */
export function parseCompetitorSuggestions(rawText: string): CompetitorSuggestion[] {
  const match = rawText.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error("AI response did not contain a JSON array");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error("AI response contained malformed JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("AI response was not a JSON array");
  }

  const suggestions: CompetitorSuggestion[] = [];
  for (const item of parsed) {
    if (item && typeof item === "object") {
      const r = item as Record<string, unknown>;
      const url = typeof r.url === "string" ? r.url.trim() : "";
      if (!url) continue;
      suggestions.push({
        name: typeof r.name === "string" ? r.name.trim() : "",
        url,
        reason: typeof r.reason === "string" ? r.reason.trim() : "",
      });
    }
    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  return suggestions;
}

/**
 * Normalize a URL to its comparable host (lowercased, leading "www." stripped).
 * Returns null if the URL can't be parsed. Pure.
 */
export function normalizeHost(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Dedupe already-validated suggestions by host so e.g. rival.com and
 * rival.com/pricing collapse to a single competitor (first wins). Drops the
 * user's own host and anything that can't be parsed. Caps the result at `max`.
 * Pure — no validation or network here.
 */
export function dedupeSuggestionsByHost(
  items: CompetitorSuggestion[],
  ownHost: string | null,
  max: number
): CompetitorSuggestion[] {
  const seenHosts = new Set<string>();
  const out: CompetitorSuggestion[] = [];

  for (const item of items) {
    const host = normalizeHost(item.url);
    if (!host) continue; // defensive — a validated URL should always parse
    if (ownHost && host === ownHost) continue; // never suggest their own site
    if (seenHosts.has(host)) continue; // one suggestion per competitor host

    seenHosts.add(host);
    out.push(item);
    if (out.length >= max) break;
  }

  return out;
}
