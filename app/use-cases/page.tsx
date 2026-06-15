import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { getSampleReport, useCaseSummaries } from "@/lib/sampleReports";

export const metadata: Metadata = {
  title: "Use Cases",
  description: "CompeteIQ use cases for SaaS, e-commerce, and marketing competitor research."
};

export default function UseCasesIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Use cases
            </p>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Show visitors how CompeteIQ works in real markets.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Each use case explains the buyer decision, the public sources CompeteIQ can read,
              and the kind of actions a report can produce.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {useCaseSummaries.map((useCase) => {
              const report = getSampleReport(useCase.reportSlug);

              return (
                <Link
                  key={useCase.slug}
                  href={`/use-cases/${useCase.slug}`}
                  className="card group flex flex-col p-6 transition-colors hover:border-brand-200 hover:bg-brand-50/30"
                >
                  <p className="text-sm font-semibold text-brand-600">{useCase.industry}</p>
                  <h2 className="mt-3 text-xl font-bold text-gray-900">{useCase.title}</h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{useCase.description}</p>
                  {report && (
                    <p className="mt-5 text-xs text-gray-400">
                      Includes sample: {report.targetCompany}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                    Open use case <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
