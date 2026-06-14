import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateCompetitorUrls } from "@/lib/validateUrl";

const MAX_NAME_LEN = 100;
const MAX_INDUSTRY_LEN = 100;
const MAX_URL_LEN = 2048;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    businessId?: string;
    name?: string;
    industry?: string;
    websiteUrl?: string;
    competitorUrls?: unknown[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { businessId, name, industry, websiteUrl, competitorUrls = [] } = body;

  if (!name?.trim() || !industry?.trim()) {
    return NextResponse.json({ error: "Business name and industry are required" }, { status: 400 });
  }

  const trimmedName = name.trim();
  const trimmedIndustry = industry.trim();
  const trimmedWebsite = websiteUrl?.trim() || null;

  // Server-side length caps
  if (trimmedName.length > MAX_NAME_LEN) {
    return NextResponse.json(
      { error: `Business name must be ${MAX_NAME_LEN} characters or fewer` },
      { status: 400 }
    );
  }
  if (trimmedIndustry.length > MAX_INDUSTRY_LEN) {
    return NextResponse.json(
      { error: `Industry must be ${MAX_INDUSTRY_LEN} characters or fewer` },
      { status: 400 }
    );
  }
  if (trimmedWebsite && trimmedWebsite.length > MAX_URL_LEN) {
    return NextResponse.json({ error: "Website URL is too long" }, { status: 400 });
  }

  // Validate all competitor URLs server-side before touching the database.
  // Use the normalized URLs returned by validation — never store raw/credential-bearing input.
  const nonEmpty = (competitorUrls as string[]).filter((u) => typeof u === "string" && u.trim());
  let normalizedUrls: string[] = [];
  if (nonEmpty.length > 0) {
    const validation = validateCompetitorUrls(nonEmpty);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    normalizedUrls = validation.normalized;
  }

  try {
    let resolvedBusinessId = businessId;

    if (resolvedBusinessId) {
      // Verify ownership before updating
      const { data: existing } = await supabase
        .from("businesses")
        .select("id")
        .eq("id", resolvedBusinessId)
        .eq("user_id", user.id)
        .single();

      if (!existing) {
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }

      const { error } = await supabase
        .from("businesses")
        .update({
          name: trimmedName,
          industry: trimmedIndustry,
          website_url: trimmedWebsite,
          updated_at: new Date().toISOString(),
        })
        .eq("id", resolvedBusinessId)
        .eq("user_id", user.id);

      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from("businesses")
        .insert({
          user_id: user.id,
          name: trimmedName,
          industry: trimmedIndustry,
          website_url: trimmedWebsite,
        })
        .select("id")
        .single();

      if (error || !data) throw error ?? new Error("Failed to create business");
      resolvedBusinessId = data.id;
    }

    // Replace competitors atomically via DB function (delete + insert in one transaction).
    // A plain delete-then-insert risks losing all competitors if the insert fails
    // after the delete has already committed.
    const { error: replaceError } = await supabase
      .rpc("replace_competitors", {
        p_business_id: resolvedBusinessId,
        p_urls: normalizedUrls,
      });
    if (replaceError) throw replaceError;

    return NextResponse.json({ businessId: resolvedBusinessId });
  } catch (err) {
    console.error("Business save error:", err);
    return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
  }
}
