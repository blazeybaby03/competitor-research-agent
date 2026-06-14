// Shared report-generation core: scrape competitors -> persist scrape jobs ->
// build source evidence -> run the AI -> validate content. Used by BOTH the
// user-triggered route (app/api/reports/generate) and the scheduled cron
// (app/api/cron/scheduled-reruns) so there is a single source of truth — no
// parallel generation paths. Orchestration that differs per caller (auth,
// rate limits, quotas, trial credit, report-row lifecycle) stays in the routes.
import type { SupabaseClient } from "@supabase/supabase-js";
import { scrapeUrl } from "@/lib/scraper";
import { generateCompetitorReport, type ReportContent } from "@/lib/ai";
import { buildReportSources } from "@/lib/reportSources";
import type { ReportSource } from "@/lib/types";

export interface RunnerBusiness {
  name: string;
  industry: string;
  website_url: string | null;
}

export interface ReportRunResult {
  reportContent: ReportContent;
  sources: ReportSource[];
}

/**
 * Scrape the given (already validated/normalized) competitor URLs, persist the
 * scrape jobs, build per-report source evidence, and generate the AI report.
 *
 * Throws when every scrape fails (no point calling the AI with no data) or when
 * the AI returns incomplete content. Callers own report-row persistence and any
 * credit/quota bookkeeping.
 */
export async function runReport(
  adminSupabase: SupabaseClient,
  business: RunnerBusiness,
  validatedCompetitors: { id: string; url: string }[]
): Promise<ReportRunResult> {
  // 1. Scrape all competitor URLs in parallel (validated, normalized URLs).
  const scrapeResults = await Promise.all(validatedCompetitors.map((c) => scrapeUrl(c.url)));

  // Single timestamp for this run so scrape_jobs and the report's source
  // evidence agree on when scraping happened.
  const scrapedAt = new Date().toISOString();

  // 2. Persist scrape results via service role (no user insert policy on scrape_jobs).
  const scrapeInserts = validatedCompetitors.map((c, i) => {
    const r = scrapeResults[i];
    return {
      competitor_id: c.id,
      status: r.success ? "completed" : "failed",
      raw_content: r.rawContent,
      cleaned_text: r.cleanedText,
      error_message: r.error,
      scraped_at: r.success ? scrapedAt : null,
    };
  });
  const { error: scrapeInsertError } = await adminSupabase.from("scrape_jobs").insert(scrapeInserts);
  if (scrapeInsertError) {
    console.error("Scrape job insert error:", scrapeInsertError);
  }

  // Stage 2: report-scoped source evidence (URL, scrape status, timestamp).
  const sources = buildReportSources(validatedCompetitors, scrapeResults, scrapedAt);

  // Fail fast if every scrape failed — no point calling the AI with zero data.
  const allScrapeFailed = scrapeResults.every((r) => !r.success);
  if (allScrapeFailed) {
    throw new Error(
      "All competitor URLs failed to scrape. Please verify the URLs are publicly accessible and try again."
    );
  }

  // 3. Generate AI report — continues with partial data if some scrapes failed.
  const competitorData = validatedCompetitors.map((c, i) => ({
    url: c.url,
    cleanedText: scrapeResults[i].cleanedText,
    scrapeSuccess: scrapeResults[i].success,
  }));

  const reportContent = await generateCompetitorReport(
    { name: business.name, industry: business.industry, websiteUrl: business.website_url },
    competitorData
  );

  // 4. Guard against storing completed reports with empty content.
  if (!reportContent || !reportContent.title || !reportContent.executiveSummary) {
    throw new Error("AI returned incomplete report content");
  }

  return { reportContent, sources };
}
