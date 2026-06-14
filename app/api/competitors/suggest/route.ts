import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestCompetitors } from "@/lib/suggestCompetitors";
import { dedupeSuggestionsByHost, normalizeHost } from "@/lib/competitorSuggestions";
import { validateCompetitorUrl } from "@/lib/validateUrl";
import { checkRateLimit } from "@/lib/rateLimit";

export const maxDuration = 30;

const MAX_INDUSTRY_LEN = 100;
const MAX_NAME_LEN = 100;
const MAX_URL_LEN = 2048;
const MAX_RETURNED = 5;

// Lightweight per-user cost guard for the AI suggestion call.
const SUGGEST_LIMIT_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; industry?: string; websiteUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim() || null;
  const industry = body.industry?.trim() || "";
  const websiteUrl = body.websiteUrl?.trim() || null;

  // Industry is the minimum context we need to make a useful suggestion.
  if (!industry) {
    return NextResponse.json(
      { error: "Add your industry first so we can suggest relevant competitors." },
      { status: 400 }
    );
  }
  if (
    industry.length > MAX_INDUSTRY_LEN ||
    (name && name.length > MAX_NAME_LEN) ||
    (websiteUrl && websiteUrl.length > MAX_URL_LEN)
  ) {
    return NextResponse.json({ error: "Input is too long." }, { status: 400 });
  }

  // Per-user cost guard — runs BEFORE the Anthropic call so abusive/looping
  // requests can't run up AI spend. In-memory per-instance soft limit; a
  // friendly 429 keeps the door open to manual entry.
  const rate = checkRateLimit(`suggest:${user.id}`, SUGGEST_LIMIT_PER_HOUR, HOUR_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          "You've requested competitor suggestions several times recently. Please wait a little while before trying again, or add competitor URLs manually.",
      },
      { status: 429 }
    );
  }

  let rawSuggestions;
  try {
    rawSuggestions = await suggestCompetitors({ name, industry, websiteUrl });
  } catch (err) {
    console.error("Competitor suggestion failed:", err);
    return NextResponse.json(
      { error: "Couldn't generate suggestions right now. Please try again or add competitors manually." },
      { status: 502 }
    );
  }

  // Suggested URLs must pass exactly the same validation as manually-entered
  // competitor URLs. Validate + normalize first, then dedupe by host (so e.g.
  // rival.com and rival.com/pricing collapse to one), drop the user's own site,
  // and cap at MAX_RETURNED. Nothing here is saved — these are returned for the
  // user to confirm.
  const validated = [];
  for (const s of rawSuggestions) {
    const check = validateCompetitorUrl(s.url);
    if (!check.valid) continue;
    validated.push({ name: s.name, url: check.normalized, reason: s.reason });
  }

  const ownHost = normalizeHost(websiteUrl);
  const suggestions = dedupeSuggestionsByHost(validated, ownHost, MAX_RETURNED);

  return NextResponse.json({ suggestions });
}
