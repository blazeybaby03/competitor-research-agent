import { createClient } from "@/lib/supabase/server";
import BusinessForm from "@/components/BusinessForm";
import GenerateReportButton from "@/components/GenerateReportButton";
import UpgradePrompt from "@/components/UpgradePrompt";
import UsageMeter from "@/components/UsageMeter";
import ScheduleToggle from "@/components/ScheduleToggle";
import { FileText, Sparkles } from "lucide-react";
import Link from "next/link";
import { PLANS, resolvePlan } from "@/lib/plans";
import { getReportUsage } from "@/lib/usage";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: business }, { data: recentReports }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user!.id).single(),
      supabase
        .from("businesses")
        .select("*, competitors(*)")
        .eq("user_id", user!.id)
        .single(),
      supabase
        .from("reports")
        .select("id, title, status, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const isActive = profile?.subscription_status === "active";
  const planKey = resolvePlan(profile?.subscription_status, profile?.plan);
  const plan = PLANS[planKey];
  const canGenerate = isActive;

  const usage = isActive ? await getReportUsage(supabase, user!.id, planKey) : null;
  const usageResetText =
    usage?.nextResetAt
      ? `next slot frees ${new Date(usage.nextResetAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        })}`
      : "rolling 30-day window";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Set up your business and generate competitor reports.
        </p>
      </div>

      {/* Plan status banner */}
      {isActive ? (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
          <Sparkles className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">
            {plan.name} plan — {plan.reportLimit} reports per 30 days active.
          </p>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3">
          <p className="text-sm text-brand-800">
            <span className="font-semibold">Subscribe to start generating reports.</span>{" "}
            Starter gives you 10 reports per 30 days — Pro gives you 100 with up to 5 competitors each.
          </p>
          <Link href="/billing" className="btn-primary text-sm shrink-0">
            See plans →
          </Link>
        </div>
      )}

      {/* Usage tracking (active subscribers only) */}
      {usage && (
        <UsageMeter
          used={usage.used}
          limit={usage.limit}
          title={`Reports this cycle — ${plan.name} plan`}
          footnote={usageResetText}
        />
      )}

      {/* Business Setup */}
      <BusinessForm
        initialBusiness={business}
        competitorLimit={plan.competitorLimit}
        planName={plan.name}
      />

      {/* Generate Report CTA */}
      {business && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Generate a report
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Analyse all{" "}
            {(business as { competitors?: unknown[] }).competitors?.length ?? 0}{" "}
            saved competitor
            {((business as { competitors?: unknown[] }).competitors?.length ?? 0) === 1
              ? ""
              : "s"}{" "}
            and get a full AI intelligence report in about 60 seconds.
          </p>

          {canGenerate ? (
            <GenerateReportButton
              businessId={business.id}
              competitorCount={
                (business as { competitors?: unknown[] }).competitors?.length ?? 0
              }
              planName={plan.name}
              competitorLimit={plan.competitorLimit}
              proCompetitorLimit={PLANS.pro.competitorLimit}
            />
          ) : (
            <UpgradePrompt />
          )}
        </div>
      )}

      {/* Scheduled monthly re-runs (Stage 4) */}
      {business && (
        <ScheduleToggle
          businessId={business.id}
          isActive={isActive}
          initialEnabled={Boolean(
            (business as { rerun_enabled?: boolean }).rerun_enabled
          )}
          lastRunAt={
            (business as { rerun_last_run_at?: string | null }).rerun_last_run_at ?? null
          }
          lastStatus={
            (business as { rerun_last_status?: "success" | "failed" | null })
              .rerun_last_status ?? null
          }
        />
      )}

      {/* Recent Reports */}
      {recentReports && recentReports.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent reports
            </h2>
            <Link
              href="/reports"
              className="text-sm text-brand-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="card p-4 flex items-center justify-between hover:bg-gray-50 transition-colors block"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {report.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      report.status === "completed"
                        ? "bg-green-50 text-green-700"
                        : report.status === "failed"
                          ? "bg-red-50 text-red-700"
                          : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {report.status === "completed"
                      ? "Ready"
                      : report.status === "failed"
                        ? "Failed"
                        : "Generating…"}
                  </span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        business && canGenerate && (
          <div className="card p-8 text-center border-dashed">
            <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">
              No reports yet
            </p>
            <p className="text-xs text-gray-400">
              Save your business details above, then generate your first report.
            </p>
          </div>
        )
      )}
    </div>
  );
}
