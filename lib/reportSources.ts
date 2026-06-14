// Stage 2 (Evidence-Backed Reports): build the report-scoped source evidence
// that gets persisted on reports.sources.
//
// Kept as a small pure function so the success/failure mapping can be unit
// tested without standing up Supabase, the scraper, or the AI client. The
// shape returned here is exactly what is stored in the reports.sources JSONB
// column (see supabase/migrations/008_report_sources.sql).
import type { ScrapeResult } from "@/lib/scraper";
import type { ReportSource } from "@/lib/types";

/**
 * Map each scraped competitor to a source-evidence record, aligned by index
 * with the competitor list. `scrapedAt` is a single ISO timestamp for the run
 * so every successful source agrees on when scraping happened.
 *
 * - success  -> status "completed", scraped_at = scrapedAt, error null
 * - failure  -> status "failed",    scraped_at = null,      error = scrape error
 */
export function buildReportSources(
  competitors: { url: string }[],
  scrapeResults: ScrapeResult[],
  scrapedAt: string
): ReportSource[] {
  return competitors.map((c, i) => {
    const r = scrapeResults[i];
    return {
      url: c.url,
      status: r.success ? "completed" : "failed",
      scraped_at: r.success ? scrapedAt : null,
      error: r.success ? null : r.error,
    };
  });
}
