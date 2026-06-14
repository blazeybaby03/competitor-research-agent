import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PLANS } from "@/lib/plans";

export default function UpgradePrompt() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
          <Sparkles className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            You&apos;ve used your free report
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Upgrade to keep running fresh competitor analyses.{" "}
            <span className="font-medium text-gray-700">{PLANS.starter.name}</span>{" "}
            gives you {PLANS.starter.reportLimit} reports per 30 days for{" "}
            {PLANS.starter.priceLabel}/month.{" "}
            <span className="font-medium text-gray-700">{PLANS.pro.name}</span>{" "}
            gives you {PLANS.pro.reportLimit} reports and up to{" "}
            {PLANS.pro.competitorLimit} competitors per report for{" "}
            {PLANS.pro.priceLabel}/month — built for repeat research across
            clients and markets.
          </p>
          <Link href="/billing" className="btn-primary mt-3 text-sm">
            See plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
