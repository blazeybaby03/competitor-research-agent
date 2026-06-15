import Link from "next/link";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import type { SampleReport } from "@/lib/sampleReports";
import { sampleDisclaimer } from "@/lib/sampleReports";

export function SampleReportPreview({
  report,
  cta = true
}: {
  report: SampleReport;
  cta?: boolean;
}) {
  return (
    <div className="card overflow-hidden border-brand-200 shadow-md">
      <div className="flex flex-col gap-2 bg-brand-600 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm font-semibold text-white">{report.title}</span>
        <span className="text-xs text-brand-100">Generated {report.generatedDate}</span>
      </div>
      <div className="space-y-6 p-6">
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-gray-600">
              {sampleDisclaimer}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Executive Summary
          </p>
          <p className="text-sm leading-relaxed text-gray-700">{report.summary}</p>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Market Gaps
          </p>
          <ul className="space-y-2">
            {report.marketGaps.slice(0, 3).map((gap, index) => (
              <li key={gap} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-700">{gap}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-700">
            Recommended Actions
          </p>
          <ul className="space-y-2">
            {report.recommendedActions.slice(0, 3).map((action, index) => (
              <li key={action} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-800">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        <SourceStrip report={report} />

        {cta && (
          <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Read the full public example, including competitors and source links.
            </p>
            <Link href={`/sample-reports/${report.slug}`} className="btn-secondary text-sm">
              View sample report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export function FullSampleReport({ report }: { report: SampleReport }) {
  return (
    <div className="space-y-6">
      <SampleReportPreview report={report} cta={false} />

      <ReportSection title="Competitor Summaries">
        <div className="space-y-4">
          {report.competitors.map((competitor) => (
            <div key={competitor.name} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <div className="mb-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
                <a
                  href={competitor.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                >
                  Source page <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">{competitor.summary}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-green-600">Strengths</p>
                  <ul className="space-y-1">
                    {competitor.strengths.map((strength) => (
                      <li key={strength} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" aria-hidden="true" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-amber-600">Watchouts</p>
                  <ul className="space-y-1">
                    {competitor.watchouts.map((watchout) => (
                      <li key={watchout} className="text-sm text-gray-700">
                        {watchout}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ReportSection>

      <ReportSection title="Positioning Analysis">
        <p className="text-sm leading-relaxed text-gray-700">{report.positioningAnalysis}</p>
      </ReportSection>

      <ReportSection title="Pricing And Offer Notes">
        <p className="text-sm leading-relaxed text-gray-700">{report.pricingAnalysis}</p>
      </ReportSection>

      <ReportSection title="Sources Analysed">
        <ul className="space-y-3">
          {report.sources.map((source) => (
            <li key={source.url} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-brand-600 hover:underline"
              >
                {source.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <p className="mt-1 text-xs text-gray-500">{source.note}</p>
            </li>
          ))}
        </ul>
      </ReportSection>
    </div>
  );
}

export function SourceStrip({ report }: { report: SampleReport }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-gray-900">
          Sources analysed: {report.sources.length} public pages
        </p>
        <p className="text-xs text-gray-500">Scraped {report.scrapeDate} from pages listed in this example.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {report.sources.slice(0, 4).map((source) => (
          <span key={source.url} className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
            {source.name.replace(" page", "")}
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportSection({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}
