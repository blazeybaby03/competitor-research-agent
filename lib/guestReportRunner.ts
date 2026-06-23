// Guest report runner: scrape + AI without persisting scrape_jobs.
// Guest reports have no competitor rows in the DB (no user_id, no competitor_id FK),
// so we skip the scrape_jobs insert that the authenticated runner does.
// Reuses the same scraping and AI logic — no duplication of core behaviour.
import { scrapeUrl } from "@/lib/scraper";
import { generateCompetitorReport, type ReportContent } from "@/lib/ai";
import { buildReportSources } from "@/lib/reportSources";
import type { ReportSource } from "@/lib/types";

export interface GuestRunResult {
  reportContent: ReportContent;
  sources: ReportSource[];
}

export async function runGuestReport(
  websiteUrl: string | null,
  competitorUrl: string
): Promise<GuestRunResult> {
  const scrapeResult = await scrapeUrl(competitorUrl);
  const scrapedAt = new Date().toISOString();

  const sources = buildReportSources([{ url: competitorUrl }], [scrapeResult], scrapedAt);

  if (!scrapeResult.success) {
    throw new Error(
      "The competitor URL could not be scraped. Please verify it is publicly accessible and try again."
    );
  }

  const competitorData = [
    {
      url: competitorUrl,
      cleanedText: scrapeResult.cleanedText,
      scrapeSuccess: scrapeResult.success,
    },
  ];

  const business = {
    name: websiteUrl ? new URL(websiteUrl).hostname.replace(/^www\./, "") : "your business",
    industry: "general",
    websiteUrl,
  };

  const reportContent = await generateCompetitorReport(business, competitorData);

  if (!reportContent || !reportContent.title || !reportContent.executiveSummary) {
    throw new Error("AI returned incomplete report content");
  }

  return { reportContent, sources };
}
