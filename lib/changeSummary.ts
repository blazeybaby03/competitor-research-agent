// Stage 4: pure snapshot + parsing for the "what changed" summary. Kept free of
// runtime imports (the Anthropic client lives in lib/whatChanged.ts) so these
// can be unit tested in isolation.
import type { ReportContent } from "@/lib/ai";
import type { ChangeSummary, ReportSource } from "@/lib/types";

export const MAX_CHANGES = 6;

// A compact, comparable snapshot of a report — only the fields worth diffing.
export interface ReportSnapshot {
  executiveSummary: string | null;
  positioningAnalysis: string | null;
  pricingAnalysis: string | null;
  marketGaps: string[] | null;
  competitorUrls: string[];
}

export function snapshotFromContent(
  content: ReportContent,
  sources: ReportSource[]
): ReportSnapshot {
  return {
    executiveSummary: content.executiveSummary ?? null,
    positioningAnalysis: content.positioningAnalysis ?? null,
    pricingAnalysis: content.pricingAnalysis ?? null,
    marketGaps: content.marketGaps ?? null,
    competitorUrls: sources.map((s) => s.url),
  };
}

/**
 * Parse the model's JSON "what changed" object. Pure. Throws only when no JSON
 * object can be extracted; tolerates missing fields (defaults to empty) and
 * caps the change list at MAX_CHANGES.
 */
export function parseChangeSummary(rawText: string): ChangeSummary {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Change summary response did not contain a JSON object");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(match[0]);
  } catch {
    throw new Error("Change summary response contained malformed JSON");
  }

  const r = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
  const summary = typeof r.summary === "string" ? r.summary.trim() : "";
  const changes = Array.isArray(r.changes)
    ? r.changes
        .filter((c): c is string => typeof c === "string" && c.trim() !== "")
        .map((c) => c.trim())
        .slice(0, MAX_CHANGES)
    : [];

  return { summary, changes };
}
