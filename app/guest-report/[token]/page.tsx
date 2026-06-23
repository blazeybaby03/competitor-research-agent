import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import ReportView from "@/components/ReportView";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import type { Report } from "@/lib/types";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function GuestReportPage({ params }: Props) {
  const { token } = await params;

  const adminSupabase = createAdminClient();
  const { data: row } = await adminSupabase
    .from("guest_reports")
    .select("*")
    .eq("token", token)
    .single();

  if (!row) notFound();

  // Expired reports are treated as not found.
  if (row.expires_at && new Date(row.expires_at) < new Date()) notFound();

  if (row.status === "failed") {
    return (
      <>
        <MarketingNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-xl font-semibold text-gray-900 mb-2">Report generation failed</p>
            <p className="text-gray-500 mb-6">
              {row.error_message ?? "Something went wrong while generating your report."}
            </p>
            <Link href="/" className="btn-primary">
              Try again →
            </Link>
          </div>
        </div>
        <MarketingFooter />
      </>
    );
  }

  if (row.status === "generating") {
    return (
      <>
        <MarketingNav />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="h-8 w-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Generating your report…</p>
            <p className="text-gray-500">This takes about 60 seconds. Refresh the page in a moment.</p>
          </div>
        </div>
        <MarketingFooter />
      </>
    );
  }

  // Map guest_report row to the Report shape that ReportView expects.
  const report: Report = {
    id: row.id,
    business_id: row.id,
    user_id: "",
    status: "completed",
    title: row.title ?? "Competitor Intelligence Report",
    executive_summary: row.executive_summary,
    competitor_summaries: row.competitor_summaries,
    positioning_analysis: row.positioning_analysis,
    pricing_analysis: row.pricing_analysis,
    strengths_weaknesses: row.strengths_weaknesses,
    market_gaps: row.market_gaps,
    recommended_actions: row.recommended_actions,
    sources: row.sources,
    error_message: null,
    created_at: row.created_at,
    updated_at: row.created_at,
  };

  return (
    <>
      <MarketingNav />
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Signup banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3 mb-6 no-print">
            <p className="text-sm text-brand-800">
              <span className="font-semibold">Save this report and monitor competitors monthly.</span>{" "}
              Create a free account — no credit card required.
            </p>
            <Link href="/signup" className="btn-primary text-sm shrink-0">
              Create free account →
            </Link>
          </div>

          <ReportView report={report} isActive={false} />
        </div>
      </div>
      <MarketingFooter />
    </>
  );
}
