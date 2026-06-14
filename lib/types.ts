export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  subscription_status: "trial" | "active" | "inactive" | "canceled";
  plan: "free" | "starter" | "pro";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_reports_used: number;
  created_at: string;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  website_url: string | null;
  created_at: string;
  updated_at: string;
  // Stage 4 (Scheduled Re-Runs). Present after migration 009.
  rerun_enabled?: boolean;
  rerun_last_run_at?: string | null;
  rerun_last_status?: "success" | "failed" | null;
}

// Stage 4: short "what changed" summary comparing a report to the prior one.
export interface ChangeSummary {
  summary: string;
  changes: string[];
}

export interface Competitor {
  id: string;
  business_id: string;
  user_id: string;
  url: string;
  name: string | null;
  created_at: string;
}

export interface ScrapeJob {
  id: string;
  competitor_id: string;
  status: "pending" | "running" | "completed" | "failed";
  raw_content: string | null;
  cleaned_text: string | null;
  error_message: string | null;
  scraped_at: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  business_id: string;
  user_id: string;
  status: "pending" | "generating" | "completed" | "failed";
  title: string;
  executive_summary: string | null;
  competitor_summaries: CompetitorSummary[] | null;
  positioning_analysis: string | null;
  pricing_analysis: string | null;
  strengths_weaknesses: StrengthWeakness[] | null;
  market_gaps: string[] | null;
  recommended_actions: string[] | null;
  // Stage 2 (Evidence-Backed Reports): per-competitor scrape evidence for this
  // report. Null for reports generated before Stage 2 was introduced.
  sources: ReportSource[] | null;
  // Stage 4 (Scheduled Re-Runs): "what changed" vs the prior report, and how
  // this report was generated. Present after migration 009.
  change_summary?: ChangeSummary | null;
  run_type?: "manual" | "scheduled";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

// One source = one competitor URL we attempted to scrape for a report.
export interface ReportSource {
  url: string;
  status: "completed" | "failed";
  scraped_at: string | null;
  error: string | null;
}

export interface CompetitorSummary {
  url: string;
  name: string;
  summary: string;
}

export interface StrengthWeakness {
  competitor: string;
  strengths: string[];
  weaknesses: string[];
}
