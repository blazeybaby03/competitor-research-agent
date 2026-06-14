import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FileText } from "lucide-react";
import ReportsList from "@/components/ReportsList";
import UsageMeter from "@/components/UsageMeter";
import { resolvePlan, PLANS } from "@/lib/plans";
import { getReportUsage } from "@/lib/usage";

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: reports }, { data: profile }] = await Promise.all([
    supabase
      .from("reports")
      .select("id, title, status, created_at, executive_summary")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("subscription_status, plan")
      .eq("id", user!.id)
      .single(),
  ]);

  const planKey = resolvePlan(profile?.subscription_status, profile?.plan);
  const isActive = profile?.subscription_status === "active";
  const usage = isActive ? await getReportUsage(supabase, user!.id, planKey) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500 mt-1">
            All your competitor intelligence reports.
          </p>
        </div>
        <Link href="/dashboard" className="btn-secondary text-sm">
          + New Report
        </Link>
      </div>

      {usage && (
        <UsageMeter
          used={usage.used}
          limit={usage.limit}
          title={`Reports this cycle — ${PLANS[planKey].name} plan`}
          footnote="rolling 30-day window"
        />
      )}

      {!reports || reports.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-gray-700 font-medium mb-2">No reports yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto">
            Head to the dashboard, set up your business and competitor URLs, and
            generate your first free report.
          </p>
          <Link href="/dashboard" className="btn-primary text-sm">
            Set up and generate a report →
          </Link>
        </div>
      ) : (
        <ReportsList reports={reports} />
      )}
    </div>
  );
}
