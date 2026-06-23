import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCompetitorUrl } from "@/lib/validateUrl";
import { runReport } from "@/lib/reportRunner";
import { PLANS, resolvePlan, type PlanKey } from "@/lib/plans";

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

async function isMonthlyQuotaExceeded(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string,
  plan: PlanKey
): Promise<boolean> {
  const quota = PLANS[plan].reportLimit;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await adminSupabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo);

  if (error) {
    console.error("Monthly quota check error:", error);
    return false; // fail open
  }

  return (count ?? 0) >= quota;
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

  // Rate limit check — runs before any expensive work
  if (await isRateLimited(adminSupabase, user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before generating another report." },
      { status: 429 }
    );
  }

  // Monthly quota check for active subscribers (trial users use the credit system)
  const { data: profileForQuota } = await adminSupabase
    .from("profiles")
    .select("subscription_status, plan")
    .eq("id", user.id)
    .single();
  const plan = resolvePlan(profileForQuota?.subscription_status, profileForQuota?.plan);
  const planConfig = PLANS[plan];

  if (
    profileForQuota?.subscription_status === "active" &&
    (await isMonthlyQuotaExceeded(adminSupabase, user.id, plan))
  ) {
    return NextResponse.json(
      {
        error: `Report limit reached. Your ${planConfig.name} plan includes ${planConfig.reportLimit} reports per 30 days.`,
      },
      { status: 403 }
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

  // Create the report row FIRST — before consuming the trial credit.
  // This prevents a user losing their free trial if the DB insert fails.
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

  // Atomic trial credit consumption via service role
  const { data: creditResult, error: creditError } = await adminSupabase
    .rpc("try_consume_trial_credit", { p_user_id: user.id });

  if (creditError || creditResult === "exhausted") {
    // Clean up the pending report so the user list stays accurate
    await adminSupabase.from("reports").delete().eq("id", report.id);

    if (creditError) {
      console.error("Trial credit RPC error:", creditError);
      return NextResponse.json({ error: "Failed to verify trial status" }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Trial limit reached. Please upgrade to continue." },
      { status: 403 }
    );
  }
  // creditResult === 'subscriber' | 'consumed' — both proceed.
  // Track whether we consumed a trial credit so we can restore it on failure.
  // A user should not lose their free trial due to a scraping or AI error.
  const trialCreditConsumed = creditResult === "consumed";

  try {
    // Scrape + persist scrape jobs + build source evidence + run the AI.
    // Shared with the scheduled cron via lib/reportRunner (single source of truth).
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

    // Mark report as failed — use service role so the update is never blocked by RLS
    const { error: failError } = await adminSupabase
      .from("reports")
      .update({
        status: "failed",
        error_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);
    if (failError) console.error("Failed to mark report as failed:", failError);

    // Restore the trial credit if we consumed one — the user should not lose
    // their free trial due to a scraping or AI failure outside their control.
    if (trialCreditConsumed) {
      const { error: restoreError } = await adminSupabase
        .rpc("restore_trial_credit", { p_user_id: user.id });
      if (restoreError) console.error("Failed to restore trial credit:", restoreError);
    }

    return NextResponse.json(
      { error: "Report generation failed. Please try again." },
      { status: 500 }
    );
  }
}
