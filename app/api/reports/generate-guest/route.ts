import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCompetitorUrl } from "@/lib/validateUrl";
import { runGuestReport } from "@/lib/guestReportRunner";
import { scheduleGuestEmailSequence } from "@/lib/email";
import { getAppBaseUrl } from "@/lib/appUrl";

export const maxDuration = 60;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return null;
}

export async function POST(request: Request) {
  let body: { email?: string; websiteUrl?: string; competitorUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, websiteUrl, competitorUrl } = body;

  // Validate email
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();

  // Validate competitor URL (required)
  if (!competitorUrl || typeof competitorUrl !== "string") {
    return NextResponse.json({ error: "A competitor URL is required." }, { status: 400 });
  }
  const competitorCheck = validateCompetitorUrl(competitorUrl);
  if (!competitorCheck.valid) {
    return NextResponse.json({ error: `Competitor URL: ${competitorCheck.error}` }, { status: 400 });
  }

  // Validate website URL (optional)
  let normalizedWebsiteUrl: string | null = null;
  if (websiteUrl && websiteUrl.trim()) {
    const websiteCheck = validateCompetitorUrl(websiteUrl.trim());
    if (!websiteCheck.valid) {
      return NextResponse.json({ error: `Your website URL: ${websiteCheck.error}` }, { status: 400 });
    }
    normalizedWebsiteUrl = websiteCheck.normalized;
  }

  const adminSupabase = createAdminClient();
  const ip = getClientIp(request);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // One report per email per 24 hours
  const { count: emailCount } = await adminSupabase
    .from("guest_reports")
    .select("*", { count: "exact", head: true })
    .eq("email", cleanEmail)
    .gte("created_at", oneDayAgo);

  if ((emailCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          "You've already generated a free report in the last 24 hours. Check your email for the link, or create an account to run more reports.",
      },
      { status: 429 }
    );
  }

  // 3 reports per IP per hour (abuse prevention)
  if (ip) {
    const { count: ipCount } = await adminSupabase
      .from("guest_reports")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", oneHourAgo);

    if ((ipCount ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Create the guest_report row before running — so we can mark it failed on error.
  const { data: row, error: insertError } = await adminSupabase
    .from("guest_reports")
    .insert({
      email: cleanEmail,
      ip,
      website_url: normalizedWebsiteUrl,
      competitor_url: competitorCheck.normalized,
      status: "generating",
    })
    .select("id, token")
    .single();

  if (insertError || !row) {
    console.error("guest_reports insert error:", insertError);
    return NextResponse.json({ error: "Failed to start report. Please try again." }, { status: 500 });
  }

  try {
    const { reportContent, sources } = await runGuestReport(
      normalizedWebsiteUrl,
      competitorCheck.normalized
    );

    const { error: updateError } = await adminSupabase
      .from("guest_reports")
      .update({
        status: "completed",
        title: reportContent.title,
        executive_summary: reportContent.executiveSummary,
        competitor_summaries: reportContent.competitorSummaries,
        positioning_analysis: reportContent.positioningAnalysis,
        pricing_analysis: reportContent.pricingAnalysis,
        strengths_weaknesses: reportContent.strengthsWeaknesses,
        market_gaps: reportContent.marketGaps,
        recommended_actions: reportContent.recommendedActions,
        sources,
      })
      .eq("id", row.id);

    if (updateError) {
      console.error("guest_reports update error:", updateError);
      throw new Error("Failed to save report content");
    }

    const baseUrl = getAppBaseUrl();
    const reportUrl = `${baseUrl}/guest-report/${row.token}`;

    // Fire-and-forget the email sequence — don't let email failures block the response.
    scheduleGuestEmailSequence(cleanEmail, reportUrl, competitorCheck.normalized).catch((err) =>
      console.error("Guest email sequence error:", err)
    );

    return NextResponse.json({ token: row.token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Guest report generation failed:", err);

    await adminSupabase
      .from("guest_reports")
      .update({ status: "failed", error_message: message })
      .eq("id", row.id);

    return NextResponse.json(
      { error: "Report generation failed. Please try again." },
      { status: 500 }
    );
  }
}
