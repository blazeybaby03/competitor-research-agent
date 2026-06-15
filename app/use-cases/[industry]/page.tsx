import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { SampleReportPreview } from "@/components/SampleReport";
import { getSampleReport, getUseCase, useCaseSummaries } from "@/lib/sampleReports";

export function generateStaticParams() {
  return useCaseSummaries.map((useCase) => ({ industry: useCase.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ industry: string }>;
}): Promise<Metadata> {
  const { industry } = await params;
  const useCase = getUseCase(industry);

  if (!useCase) return { title: "Use Case" };

  return {
    title: useCase.title,
    description: useCase.description
  };
}

export default async function UseCasePage({
  params
}: {
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  const useCase = getUseCase(industry);

  if (!useCase) {
    notFound();
  }

  const report = getSampleReport(useCase.reportSlug);
  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">
                {useCase.industry} use case
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
                {useCase.title}
              </h1>
              <p className="mt-5 text-base leading-relaxed text-gray-600 sm:text-lg">
                {useCase.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup" className="btn-primary px-8 py-3 text-base">
                  Generate your first report free
                </Link>
                <Link href={`/sample-reports/${report.slug}`} className="btn-secondary px-8 py-3 text-base">
                  View sample report
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-sm font-semibold text-gray-900">Best for</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{useCase.audience}</p>
              <div className="mt-5 border-t border-gray-100 pt-5">
                <p className="mb-3 text-sm font-semibold text-gray-900">Decisions this supports</p>
                <ul className="space-y-2">
                  {useCase.decisions.map((decision) => (
                    <li key={decision} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                title: "What CompeteIQ reads",
                body: "Public competitor pages supplied by the user, such as homepages, product pages, pricing pages, help pages, and offer pages."
              },
              {
                title: "What the report explains",
                body: "Positioning, messaging, visible offers, market gaps, strengths, weaknesses, and recommended actions."
              },
              {
                title: "What it does not claim",
                body: "It does not access private systems, verify competitor self-claims, or promise that public pages are complete or unchanged."
              }
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                  Example output
                </p>
                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  Public-source sample for {useCase.industry.toLowerCase()}
                </h2>
              </div>
              <Link href={`/sample-reports/${report.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
                Full sample <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <SampleReportPreview report={report} />
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
