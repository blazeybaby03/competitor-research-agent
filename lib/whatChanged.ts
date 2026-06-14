// Stage 4: build a short "what changed" summary between a business's previous
// report and the newly generated one. Lightweight by design — a few bullet
// points on pricing/positioning/messaging/new-or-failed sources, not a full
// monitoring diff. The pure snapshot/parser live in lib/changeSummary.ts (unit
// tested); this file is the thin AI wrapper. Kept separate from lib/ai.ts.
import Anthropic from "@anthropic-ai/sdk";
import {
  parseChangeSummary,
  MAX_CHANGES,
  type ReportSnapshot,
} from "@/lib/changeSummary";
import type { ChangeSummary } from "@/lib/types";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const AI_TIMEOUT_MS = 30_000;

export { snapshotFromContent } from "@/lib/changeSummary";
export type { ReportSnapshot } from "@/lib/changeSummary";

/**
 * Generate a "what changed" summary comparing the previous snapshot to the
 * current one. Returns null when there is no prior report to compare against.
 */
export async function summarizeChanges(
  previous: ReportSnapshot | null,
  current: ReportSnapshot
): Promise<ChangeSummary | null> {
  if (!previous) return null;

  const prompt = `You compare two competitor-research reports for the same business and summarise what changed since the previous run. The content below is prior AI analysis (trusted), not raw web content.

Focus only on meaningful changes in: pricing, positioning/messaging, market gaps, and the set of competitor sources (added/removed/failed). If little or nothing changed, say so honestly.

## Previous report
- Executive summary: ${previous.executiveSummary ?? "(none)"}
- Positioning: ${previous.positioningAnalysis ?? "(none)"}
- Pricing: ${previous.pricingAnalysis ?? "(none)"}
- Market gaps: ${(previous.marketGaps ?? []).join("; ") || "(none)"}
- Competitor sources: ${previous.competitorUrls.join(", ") || "(none)"}

## Current report
- Executive summary: ${current.executiveSummary ?? "(none)"}
- Positioning: ${current.positioningAnalysis ?? "(none)"}
- Pricing: ${current.pricingAnalysis ?? "(none)"}
- Market gaps: ${(current.marketGaps ?? []).join("; ") || "(none)"}
- Competitor sources: ${current.competitorUrls.join(", ") || "(none)"}

Respond with raw JSON only (no markdown), EXACTLY:
{
  "summary": "one or two sentences on the overall change since last time",
  "changes": ["short bullet on a specific change", "..."]
}
Keep it to at most ${MAX_CHANGES} bullets. Do not invent changes that aren't supported by the two reports.`;

  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let message: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    message = await client.messages.create(
      { model, max_tokens: 700, messages: [{ role: "user", content: prompt }] },
      { maxRetries: 0, timeout: AI_TIMEOUT_MS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Anthropic API call failed: ${msg}`);
  }

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  return parseChangeSummary(rawText);
}
