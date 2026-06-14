import type { SupabaseClient } from "@supabase/supabase-js";
import { PLANS, type PlanKey } from "@/lib/plans";

const WINDOW_DAYS = 30;

export interface ReportUsage {
  used: number;
  limit: number;
  remaining: number;
  windowDays: number;
  /** ISO timestamp when the oldest in-window report ages out, freeing a slot. */
  nextResetAt: string | null;
}

/**
 * Reports a subscriber's usage against the rolling 30-day quota. This mirrors
 * the limit enforced in /api/reports/generate (a count of reports created in
 * the last 30 days), so the number shown matches what actually gates generation.
 */
export async function getReportUsage(
  supabase: SupabaseClient,
  userId: string,
  plan: PlanKey
): Promise<ReportUsage> {
  const windowStart = new Date(
    Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { count } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  const used = count ?? 0;
  const limit = PLANS[plan].reportLimit;

  // When at the cap, a slot frees 30 days after the oldest in-window report.
  let nextResetAt: string | null = null;
  if (limit > 0 && used >= limit) {
    const { data: oldest } = await supabase
      .from("reports")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", windowStart)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (oldest?.created_at) {
      nextResetAt = new Date(
        new Date(oldest.created_at).getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();
    }
  }

  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    windowDays: WINDOW_DAYS,
    nextResetAt,
  };
}
