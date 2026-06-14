// Stage 3 (Suggest My Competitors): use Claude to propose likely competitor
// URLs from a business's name/industry/website, for users who don't know who
// to enter. This is a SUGGESTION aid only — suggestions are never saved or used
// for a report until the user confirms them in the form and saves through the
// existing validated save path. Kept separate from lib/ai.ts so the report
// generation contract is untouched. The pure parser lives in
// lib/competitorSuggestions.ts so it can be unit tested without this client.
import Anthropic from "@anthropic-ai/sdk";
import {
  parseCompetitorSuggestions,
  MAX_SUGGESTIONS,
  type CompetitorSuggestion,
} from "@/lib/competitorSuggestions";

const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const AI_TIMEOUT_MS = 30_000;

export type { CompetitorSuggestion };

export interface SuggestBusinessContext {
  name?: string | null;
  industry: string;
  websiteUrl?: string | null;
}

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function suggestCompetitors(
  business: SuggestBusinessContext
): Promise<CompetitorSuggestion[]> {
  const prompt = `You are a competitive research assistant. Suggest real, likely direct competitors for the business below, to help the owner who is not sure who their competitors are.

## Business
- Name: ${business.name?.trim() || "Not provided"}
- Industry: ${business.industry.trim()}
- Website: ${business.websiteUrl?.trim() || "Not provided"}

## Instructions
- Suggest between 3 and ${MAX_SUGGESTIONS} businesses that genuinely compete with the one above.
- Prefer well-known, currently-operating companies whose public website is likely reachable.
- Use the real root domain for each (https://example.com). Do not invent domains you are unsure about.
- Do NOT include the business's own website.
- These are SUGGESTIONS the user will review, not verified facts.

Respond with raw JSON only (no markdown) as an array of objects with EXACTLY this shape:
[
  { "name": "Competitor name", "url": "https://competitor.com", "reason": "one short sentence on why they compete" }
]`;

  const model = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const client = getClient();

  let message: Awaited<ReturnType<typeof client.messages.create>>;
  try {
    message = await client.messages.create(
      {
        model,
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      },
      { maxRetries: 0, timeout: AI_TIMEOUT_MS }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`Anthropic API call failed: ${msg}`);
  }

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  return parseCompetitorSuggestions(rawText);
}
