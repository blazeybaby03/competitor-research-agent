import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCompetitorUrl } from "@/lib/validateUrl";
import { runReport } from "@/lib/reportRunner";
import { PLANS, resolvePlan, type PlanKey } from "@/lib/plans";
import { sendUsageLimitWarningEmail, sendUsageLimitReachedEmail } from "@/lib/email";

export const maxDuration = 60;

// 3 report generation attempts per user per hour.
// Backed by the reports table — no extra infrastructure needed, works across stateless app instances.
// Trade-off: has a small race window for truly simultaneous requests; acceptable for MVP scale.
const RATE_LIMIT_PER_HOUR = 3;

async function isRateLimited(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await adminSupabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneHourAgo);

  if (error) {
    console.error("Rate limit check error:", error);
    return false; // fail open — allow on DB error to avoid blocking legitimate users
  }

  return (count ?? 0) >= RATE_LIMIT_PER_HOUR;
}

async function getMonthlyReportCount(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string
): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await adminSupabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo);

  if (error) {
    console.error("Monthly quota check error:", error);
    return 0; // fail open — allow on DB error
  }

  return count ?? 0;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { businessId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { businessId } = body;
  if (!businessId) {
    return NextResponse.json({ error: "businessId is required" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  // Require an active paid subscription — free trials are replaced by the guest report flow.
  const { data: profileForQuota } = await adminSupabase
    .from("profiles")
    .select("subscription_status, plan")
    .eq("id", user.id)
    .single();

  if (profileForQuota?.subscription_status !== "active") {
    return NextResponse.json(
      { error: "An active subscription is required to generate reports. Choose a plan to get started." },
      { status: 403 }
    );
  }

  const plan = resolvePlan(profileForQuota.subscription_status, profileForQuota.plan);
  const planConfig = PLANS[plan];

  // Rate limit check — runs before any expensive work
  if (await isRateLimited(adminSupabase, user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating another report." },
      { status: 429 }
    );
  }

  // Monthly quota check for active subscribers
  const monthlyCount = await getMonthlyReportCount(adminSupabase, user.id);
  if (monthlyCount >= planConfig.reportLimit) {
    // Fire "limit reached" email on the first attempt past the quota (exact hit only).
    // Subsequent 403s on the same count don't resend — count can't exceed reportLimit
    // because we enforce it here. Fire-and-forget; never block the response.
    if (monthlyCount === planConfig.reportLimit && user.email) {
      const resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("en-AU", { month: "long", day: "numeric" });
      sendUsageLimitReachedEmail(user.email, planConfig.name, resetDate).catch((err) =>
        console.error("Usage limit reached email failed:", err)
      );
    }
    return NextResponse.json(
      { error: `Report limit reached. Your ${planConfig.name} plan includes ${planConfig.reportLimit} reports per 30 days.` },
      { status: 403 }
    );
  }

  // 80% usage warning — fires exactly once per billing period (when this report
  // would be the warningThreshold-th report). No DB flag needed: the condition
  // monthlyCount + 1 === warningThreshold is only true for one specific count.
  const warningThreshold = Math.ceil(planConfig.reportLimit * 0.8);
  if (monthlyCount + 1 === warningThreshold && user.email) {
    sendUsageLimitWarningEmail(user.email, warningThreshold, planConfig.reportLimit, planConfig.name).catch((err) =>
      console.error("Usage warning email failed:", err)
    );
  }

  // Verify business ownership and fetch competitors
  const { data: business, error: bizError } = await supabase
    .from("businesses")
    .select("*, competitors(*)")
    .eq("id", businessId)
    .eq("user_id", user.id)
    .single();

  if (bizError || !business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const competitors = (business.competitors ?? []) as { id: string; url: string }[];
  if (competitors.length === 0) {
    return NextResponse.json(
      { error: "Add at least one competitor URL before generating a report." },
      { status: 400 }
    );
  }
  if (competitors.length > planConfig.competitorLimit) {
    return NextResponse.json(
      {
        error:
          plan === "pro"
            ? `Maximum ${planConfig.competitorLimit} competitor URLs allowed.`
            : `Your ${planConfig.name} plan supports up to ${planConfig.competitorLimit} competitors per report. Upgrade to Pro for up to ${PLANS.pro.competitorLimit}.`,
      },
      { status: 400 }
    );
  }

  // Server-side URL re-validation (defense-in-depth) — also yields normalized URLs for scraping
  const validatedCompetitors: { id: string; url: string }[] = [];
  for (const c of competitors) {
    const check = validateCompetitorUrl(c.url);
    if (!check.valid) {
      return NextResponse.json(
        { error: `Competitor URL rejected: ${check.error}` },
        { status: 400 }
      );
    }
    validatedCompetitors.push({ id: c.id, url: check.normalized });
  }

  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      business_id: businessId,
      user_id: user.id,
      status: "generating",
      title: `Competitor Intelligence Report for ${business.name}`,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    console.error("Report insert error:", reportError);
    return NextResponse.json({ error: "Failed to create report record" }, { status: 500 });
  }

  try {
    const { reportContent, sources } = await runReport(
      adminSupabase,
      business,
      validatedCompetitors
    );

    const { error: updateError } = await supabase
      .from("reports")
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
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      console.error("Report update error:", updateError);
      throw new Error("Failed to save report content");
    }

    return NextResponse.json({ reportId: report.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Report generation failed:", err);

    const { error: failError } = await adminSupabase
      .from("reports")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);
    if (failError) console.error("Failed to mark report as failed:", failError);

    return NextResponse.json(
      { error: "Report generation failed. Please try again." },
      { status: 500 }
    );
  }
}
