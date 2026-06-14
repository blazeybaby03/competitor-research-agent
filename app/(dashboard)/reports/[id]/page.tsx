import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReportView from "@/components/ReportView";
import { ArrowLeft } from "lucide-react";
import type { Report } from "@/lib/types";
import { PLANS } from "@/lib/plans";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: report }, { data: profile }] = await Promise.all([
    supabase.from("reports").select("*").eq("id", id).eq("user_id", user!.id).single(),
    supabase
      .from("profiles")
      .select("subscription_status, trial_reports_used")
      .eq("id", user!.id)
      .single(),
  ]);

  if (!report) notFound();

  const isActive = profile?.subscription_status === "active";
  const trialExhausted = !isActive && (profile?.trial_reports_used ?? 0) >= 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 no-print">
        <Link
          href="/reports"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Reports
        </Link>
      </div>

      {/* Upgrade notice — shown when the user has consumed their free trial */}
      {trialExhausted && report.status === "completed" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3 no-print">
          <p className="text-sm text-brand-800">
            <span className="font-semibold">This is your free report.</span>{" "}
            Upgrade to keep running fresh competitor analyses each month —{" "}
            <span className="font-medium">
              {PLANS.starter.reportLimit} reports/30 days from{" "}
              {PLANS.starter.priceLabel}/month
            </span>
            .
          </p>
          <Link href="/billing" className="btn-primary text-sm shrink-0">
            See plans →
          </Link>
        </div>
      )}

      <ReportView report={report as Report} isActive={isActive} />
    </div>
  );
}
