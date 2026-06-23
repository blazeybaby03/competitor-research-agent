// Stage 4: scheduled monthly re-run engine. Invoked by the configured hosting
// scheduler. Finds paid businesses with scheduling enabled that are due,
// re-generates their report, computes a "what changed" summary vs the previous
// report, and records the run outcome on the business. Lightweight monthly
// refresh — NOT a real-time monitoring suite.
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateCompetitorUrl } from "@/lib/validateUrl";
import { runReport } from "@/lib/reportRunner";
import { summarizeChanges, snapshotFromContent } from "@/lib/whatChanged";
import { isRerunDue } from "@/lib/schedule";
import { PLANS, resolvePlan } from "@/lib/plans";
import type { ReportContent } from "@/lib/ai";

export const maxDuration = 300;

// Process at most this many businesses per cron invocation to bound cost/time.
const MAX_BATCH = 25;
const QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed — never run unprotected
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  return handle(request);
}

// Some schedulers issue GET requests; support both.
export async function GET(request: Request) {
  return handle(request);
}

async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();

  // 1. Candidate businesses: scheduling enabled, with their competitors.
  const { data: enabled, error: enabledError } = await admin
    .from("businesses")
    .select("id, name, industry, website_url, user_id, rerun_last_run_at, competitors(id, url)")
    .eq("rerun_enabled", true);

  if (enabledError) {
    console.error("Scheduled re-runs: failed to load businesses:", enabledError);
    return NextResponse.json({ error: "Failed to load businesses" }, { status: 500 });
  }

  const due = (enabled ?? []).filter((b) => isRerunDue(b.rerun_last_run_at, now));

  if (due.length === 0) {
    return NextResponse.json({ processed: 0, succeeded: 0, failed: 0, skippedInactive: 0, deferred: 0 });
  }

  // 2. Resolve owners' plans in one query. Filter to active (paid) owners
  // BEFORE applying the batch cap — otherwise lapsed/free businesses returned
  // early by the DB could occupy the batch and starve paid due businesses.
  const userIds = [...new Set(due.map((b) => b.user_id))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, subscription_status, plan")
    .in("id", userIds);
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const dueActive = due.filter(
    (b) => profileById.get(b.user_id)?.subscription_status === "active"
  );
  const skippedInactive = due.length - dueActive.length;

  // Cap only after filtering to paid owners.
  const batch = dueActive.slice(0, MAX_BATCH);
  const deferred = dueActive.length - batch.length;

  let succeeded = 0;
  let failed = 0;

  for (const business of batch) {
    const profile = profileById.get(business.user_id);
    const planKey = resolvePlan(profile?.subscription_status, profile?.plan);

    try {
      await runOneScheduledRerun(admin, business, planKey, now);
      succeeded += 1;
    } catch (err) {
      failed += 1;
      console.error(`Scheduled re-run failed for business ${business.id}:`, err);
      // Record the failure so it is visible and never silently consumes trust.
      await admin
        .from("businesses")
        .update({ rerun_last_run_at: new Date().toISOString(), rerun_last_status: "failed" })
        .eq("id", business.id);
    }
  }

  return NextResponse.json({
    processed: batch.length,
    succeeded,
    failed,
    skippedInactive,
    deferred,
  });
}

interface DueBusiness {
  id: string;
  name: string;
  industry: string;
  website_url: string | null;
  user_id: string;
  competitors?: { id: string; url: string }[] | null;
}

async function runOneScheduledRerun(
  admin: ReturnType<typeof createAdminClient>,
  business: DueBusiness,
  planKey: "free" | "starter" | "pro",
  now: number
) {
  // Respect the same rolling 30-day quota as manual generation.
  const windowStart = new Date(now - QUOTA_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", business.user_id)
    .gte("created_at", windowStart);
  if ((count ?? 0) >= PLANS[planKey].reportLimit) {
    throw new Error("Owner has reached their plan's report quota; skipping scheduled re-run.");
  }

  // Validate competitor URLs (defense-in-depth; they were validated on save).
  const competitors = (business.competitors ?? []) as { id: string; url: string }[];
  const validated: { id: string; url: string }[] = [];
  for (const c of competitors) {
    const check = validateCompetitorUrl(c.url);
    if (check.valid) validated.push({ id: c.id, url: check.normalized });
  }
  if (validated.length === 0) {
    throw new Error("No valid competitor URLs to re-run.");
  }

  // Create the scheduled report row up front.
  const { data: report, error: insertError } = await admin
    .from("reports")
    .insert({
      business_id: business.id,
      user_id: business.user_id,
      status: "generating",
      title: `Competitor Intelligence Report for ${business.name}`,
      run_type: "scheduled",
    })
    .select("id")
    .single();
  if (insertError || !report) {
    throw insertError ?? new Error("Failed to create scheduled report row");
  }

  // Load the prior completed report (before this run) to diff against.
  const { data: priorReport } = await admin
    .from("reports")
    .select(
      "executive_summary, positioning_analysis, pricing_analysis, market_gaps, sources"
    )
    .eq("business_id", business.id)
    .eq("status", "completed")
    .neq("id", report.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  try {
    const { reportContent, sources } = await runReport(admin, business, validated);

    // "What changed" vs the previous completed report (null if none).
    let changeSummary = null;
    try {
      const previousSnapshot = priorReport
        ? {
            executiveSummary: priorReport.executive_summary ?? null,
            positioningAnalysis: priorReport.positioning_analysis ?? null,
            pricingAnalysis: priorReport.pricing_analysis ?? null,
            marketGaps: (priorReport.market_gaps ?? null) as string[] | null,
            competitorUrls: Array.isArray(priorReport.sources)
              ? priorReport.sources.map((s: { url: string }) => s.url)
              : [],
          }
        : null;
      changeSummary = await summarizeChanges(
        previousSnapshot,
        snapshotFromContent(reportContent as ReportContent, sources)
      );
    } catch (summaryErr) {
      // A failed summary must not fail the whole re-run — the report is the value.
      console.error(`What-changed summary failed for business ${business.id}:`, summaryErr);
    }

    const { error: updateError } = await admin
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
        change_summary: changeSummary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);
    if (updateError) throw updateError;

    await admin
      .from("businesses")
      .update({ rerun_last_run_at: new Date().toISOString(), rerun_last_status: "success" })
      .eq("id", business.id);
  } catch (err) {
    // Mark the report row failed so it doesn't linger as "generating".
    await admin
      .from("reports")
      .update({
        status: "failed",
        error_message: err instanceof Error ? err.message : "Scheduled re-run failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", report.id);
    throw err;
  }
}
