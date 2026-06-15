import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { SampleReportPreview } from "@/components/SampleReport";
import { sampleReports } from "@/lib/sampleReports";

export const metadata: Metadata = {
  title: "Sample Reports",
  description: "Public-source CompeteIQ sample reports for SaaS, e-commerce, and marketing use cases."
};

export default function SampleReportsPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">
                Sample reports
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                See how CompeteIQ explains different markets.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
                These examples use known companies for illustration only. Each report is
                source-labelled, date-labelled, and separated from private customer reports.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:px-8">
            {sampleReports.map((report) => (
              <SampleReportPreview key={report.slug} report={report} />
            ))}
          </div>
        </section>

        <section className="bg-brand-600 py-14 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">Generate a report for your own market</h2>
            <p className="mt-3 text-brand-100">
              Your first report is free and uses the competitor URLs you provide.
            </p>
            <Link href="/signup" className="mt-8 inline-flex rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50">
              Generate your first report free
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
