"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, ArrowLeft, Link2, CheckCircle2, XCircle, TrendingUp, Printer, Lock } from "lucide-react";
import Link from "next/link";
import type { Report, ReportSource } from "@/lib/types";
import ShareMenu from "@/components/ShareMenu";
import { exportDocumentTitle, preparedByLabel } from "@/lib/export";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// A source's host is friendlier to read than the full URL; fall back to the
// raw string if it can't be parsed.
function sourceHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

interface Props {
  report: Report;
  /** Active paid subscriber — client-ready PDF export is a paid feature. */
  isActive?: boolean;
}

const PREPARED_BY_KEY = "competeiq:preparedBy";

export default function ReportView({ report, isActive = false }: Props) {
  // White-label export state (Stage 5). "Prepared by" is remembered locally so
  // a consultant only types it once.
  const [clientName, setClientName] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PREPARED_BY_KEY);
      if (saved) setPreparedBy(saved);
    } catch {
      /* localStorage unavailable — non-fatal */
    }
  }, []);

  function handleExport() {
    if (!isActive) return; // paid feature; the button isn't shown to free users
    try {
      if (preparedBy.trim()) window.localStorage.setItem(PREPARED_BY_KEY, preparedBy.trim());
    } catch {
      /* ignore */
    }
    const previousTitle = document.title;
    document.title = exportDocumentTitle(report.title, clientName);
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  }

  if (report.status === "generating") {
    return (
      <div className="card p-12 text-center">
        <Clock className="h-10 w-10 text-brand-400 mx-auto mb-4 animate-pulse" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Your report is being generated
        </h2>
        <p className="text-sm text-gray-500 mb-1">
          We&apos;re scraping your competitors, reading their positioning, and
          writing the full report.
        </p>
        <p className="text-sm text-gray-400">
          This usually takes about 60 seconds. Refresh this page to check for
          the completed report.
        </p>
      </div>
    );
  }

  if (report.status === "failed") {
    return (
      <div className="card p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Report generation failed
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Something went wrong while generating this report. This is usually
          caused by a competitor URL that couldn&apos;t be scraped.
        </p>
        <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard to try again
        </Link>
      </div>
    );
  }

  const sources = report.sources ?? null;
  const scrapedCount = sources?.filter((s) => s.status === "completed").length ?? 0;
  const sourceScrapedAt =
    sources?.find((s) => s.scraped_at)?.scraped_at ?? null;

  const generatedOn = new Date(report.created_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Stage 5: white-label cover page — only shown in the printed PDF */}
      <div className="print-only report-cover">
        <div style={{ padding: "48px 8px" }}>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
            {preparedByLabel(preparedBy)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Competitor Intelligence Report</p>
          <h1 className="text-3xl font-extrabold text-gray-900 mt-10">
            {report.title}
          </h1>
          {clientName.trim() && (
            <p className="text-base text-gray-600 mt-4">Prepared for {clientName.trim()}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">{generatedOn}</p>
          {sources && sources.length > 0 && (
            <p className="text-xs text-gray-400 mt-8">
              Generated from {scrapedCount} of {sources.length} competitor{" "}
              {sources.length === 1 ? "page" : "pages"} scraped
              {sourceScrapedAt ? ` on ${formatDateTime(sourceScrapedAt)}` : ""}.
            </p>
          )}
          <p className="text-xs text-gray-300 mt-10">Powered by CompeteIQ</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link
            href="/reports"
            className="text-xs text-brand-600 hover:underline mb-2 inline-block no-print"
          >
            ← All reports
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          <p className="text-sm text-gray-400 mt-1">Generated on {generatedOn}</p>
          {/* Fallback provenance line for older reports without stored sources */}
          {!sources && (
            <p className="text-xs text-gray-400 mt-0.5">
              Generated from public competitor website content you provided
              {report.competitor_summaries && report.competitor_summaries.length > 0
                ? ` · ${report.competitor_summaries.length} competitor ${report.competitor_summaries.length === 1 ? "summary" : "summaries"} included`
                : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 no-print">
          {isActive ? (
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="btn-secondary text-sm flex items-center gap-1.5"
              aria-expanded={exportOpen}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Export PDF
            </button>
          ) : (
            <Link
              href="/billing"
              className="btn-secondary text-sm flex items-center gap-1.5"
              title="Client-ready PDF export is a paid feature"
            >
              <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              Export PDF
            </Link>
          )}
          <ShareMenu
            title={report.title}
            text={buildPlainText(report)}
            summary={report.executive_summary ?? undefined}
          />
        </div>
      </div>

      {/* Stage 5: white-label export panel (paid) */}
      {isActive && exportOpen && (
        <div className="card p-5 no-print border-brand-200">
          <div className="flex items-center gap-2 mb-1">
            <Printer className="h-4 w-4 text-brand-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-gray-900">
              Client-ready PDF export
            </h2>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Add an optional cover page, then export. Your browser&apos;s print
            dialog lets you save it as a PDF. The full report — including the
            sources analysed — is included.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Prepared for (client)
              </label>
              <input
                type="text"
                maxLength={120}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="input"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Prepared by (you / agency)
              </label>
              <input
                type="text"
                maxLength={120}
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                className="input"
                placeholder="Your name or agency"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary text-sm inline-flex items-center gap-1.5"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Download / Print PDF
          </button>
        </div>
      )}

      {/* Stage 2 trust line — only when source evidence was captured */}
      {sources && sources.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
          <Link2 className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-gray-600">
            This report was generated from{" "}
            <span className="font-medium text-gray-900">
              {scrapedCount} of {sources.length} competitor{" "}
              {sources.length === 1 ? "page" : "pages"}
            </span>{" "}
            {scrapedCount === sources.length ? "scraped successfully" : "scraped"}
            {sourceScrapedAt ? ` on ${formatDateTime(sourceScrapedAt)}` : ""}.{" "}
            <a
              href="#sources-analysed"
              className="text-brand-600 hover:underline"
            >
              See sources
            </a>
            .
          </p>
        </div>
      )}

      {/* Stage 4 — "What changed" since the previous report (scheduled re-runs) */}
      {report.change_summary &&
        (report.change_summary.summary ||
          (report.change_summary.changes &&
            report.change_summary.changes.length > 0)) && (
          <div className="card p-6 border-brand-200 bg-brand-50/40">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-brand-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-gray-900">
                What changed since your last report
              </h2>
            </div>
            {report.change_summary.summary && (
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                {report.change_summary.summary}
              </p>
            )}
            {report.change_summary.changes &&
              report.change_summary.changes.length > 0 && (
                <ul className="space-y-2">
                  {report.change_summary.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700">{change}</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )}

      {/* === Answer-first sections === */}

      {/* 1. Executive Summary */}
      {report.executive_summary && (
        <Section title="Executive Summary">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {report.executive_summary}
          </p>
        </Section>
      )}

      {/* 2. Market Gaps — moved up, high-value */}
      {report.market_gaps && report.market_gaps.length > 0 && (
        <Section title="Market Gaps">
          <ul className="space-y-2">
            {report.market_gaps.map((gap, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-sm">{gap}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 3. Recommended Actions — moved up, most actionable */}
      {report.recommended_actions && report.recommended_actions.length > 0 && (
        <Section title="Recommended Actions" highlight>
          <ul className="space-y-3">
            {report.recommended_actions.map((action, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-gray-800 text-sm font-medium">
                  {action}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 4. Competitor Summaries */}
      {report.competitor_summaries && report.competitor_summaries.length > 0 && (
        <Section title="Competitor Summaries">
          <div className="space-y-4">
            {report.competitor_summaries.map((cs, i) => (
              <div
                key={i}
                className="border border-gray-100 rounded-lg p-4 bg-gray-50"
              >
                <div className="font-semibold text-gray-900 mb-1">
                  {cs.name}{" "}
                  <span className="font-normal text-sm text-gray-400">
                    — {cs.url}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{cs.summary}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 5. Positioning */}
      {report.positioning_analysis && (
        <Section title="Positioning Analysis">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {report.positioning_analysis}
          </p>
        </Section>
      )}

      {/* 6. Pricing */}
      {report.pricing_analysis && (
        <Section title="Pricing & Offer Analysis">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {report.pricing_analysis}
          </p>
        </Section>
      )}

      {/* 7. Strengths & Weaknesses */}
      {report.strengths_weaknesses && report.strengths_weaknesses.length > 0 && (
        <Section title="Strengths & Weaknesses">
          <div className="space-y-4">
            {report.strengths_weaknesses.map((sw, i) => (
              <div key={i} className="border border-gray-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {sw.competitor}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-green-600 mb-2">
                      Strengths
                    </p>
                    <ul className="space-y-1">
                      {sw.strengths.map((s, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-green-500 mt-0.5" aria-hidden="true">+</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-red-600 mb-2">
                      Weaknesses
                    </p>
                    <ul className="space-y-1">
                      {sw.weaknesses.map((w, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="text-red-400 mt-0.5" aria-hidden="true">−</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* 8. Sources analysed — Stage 2 evidence */}
      {sources && sources.length > 0 && (
        <SourcesSection sources={sources} scrapedCount={scrapedCount} />
      )}
    </div>
  );
}

function SourcesSection({
  sources,
  scrapedCount,
}: {
  sources: ReportSource[];
  scrapedCount: number;
}) {
  const failedCount = sources.length - scrapedCount;
  return (
    <div className="card p-6" id="sources-analysed">
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Sources analysed
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        {sources.length} competitor {sources.length === 1 ? "URL" : "URLs"} you
        provided · {scrapedCount} scraped successfully
        {failedCount > 0 ? ` · ${failedCount} failed` : ""}. The report is based
        on the public content read from the pages that scraped successfully.
      </p>
      <ul className="space-y-2">
        {sources.map((s, i) => (
          <li
            key={i}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
          >
            {s.status === "completed" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="min-w-0 flex-1">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-sm font-medium text-gray-900 hover:text-brand-600 hover:underline break-words"
              >
                {sourceHost(s.url)}
              </a>
              <p className="text-xs text-gray-400 break-all">{s.url}</p>
              {s.status === "completed" ? (
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.scraped_at
                    ? `Scraped ${formatDateTime(s.scraped_at)}`
                    : "Scraped"}
                </p>
              ) : (
                <p className="text-xs text-red-500 mt-0.5">
                  Could not be scraped
                  {s.error ? ` — ${s.error}` : ""}. Not used in this report.
                </p>
              )}
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                s.status === "completed"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {s.status === "completed" ? "Scraped" : "Failed"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Section({
  title,
  children,
  highlight = false,
}: {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card p-6 ${highlight ? "border-brand-200 bg-brand-50/30" : ""}`}
    >
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function buildPlainText(report: Report): string {
  const lines: string[] = [
    report.title,
    "=".repeat(report.title.length),
    "",
    "EXECUTIVE SUMMARY",
    report.executive_summary ?? "",
    "",
  ];

  if (report.market_gaps) {
    lines.push("MARKET GAPS", "");
    report.market_gaps.forEach((g, i) => lines.push(`${i + 1}. ${g}`));
    lines.push("");
  }

  if (report.recommended_actions) {
    lines.push("RECOMMENDED ACTIONS", "");
    report.recommended_actions.forEach((a, i) => lines.push(`${i + 1}. ${a}`));
    lines.push("");
  }

  if (report.competitor_summaries) {
    lines.push("COMPETITOR SUMMARIES", "");
    report.competitor_summaries.forEach((cs) => {
      lines.push(`${cs.name} (${cs.url})`, cs.summary, "");
    });
  }

  if (report.positioning_analysis) {
    lines.push("POSITIONING ANALYSIS", report.positioning_analysis, "");
  }

  if (report.pricing_analysis) {
    lines.push("PRICING ANALYSIS", report.pricing_analysis, "");
  }

  if (report.strengths_weaknesses) {
    lines.push("STRENGTHS & WEAKNESSES", "");
    report.strengths_weaknesses.forEach((sw) => {
      lines.push(sw.competitor);
      lines.push("  Strengths: " + sw.strengths.join(", "));
      lines.push("  Weaknesses: " + sw.weaknesses.join(", "));
      lines.push("");
    });
  }

  if (report.sources && report.sources.length > 0) {
    const scraped = report.sources.filter((s) => s.status === "completed").length;
    lines.push(
      "SOURCES ANALYSED",
      `${report.sources.length} competitor URL(s) provided · ${scraped} scraped successfully`,
      ""
    );
    report.sources.forEach((s) => {
      if (s.status === "completed") {
        lines.push(
          `[scraped] ${s.url}${s.scraped_at ? ` (${new Date(s.scraped_at).toISOString()})` : ""}`
        );
      } else {
        lines.push(`[failed]  ${s.url}${s.error ? ` — ${s.error}` : ""}`);
      }
    });
    lines.push("");
  }

  return lines.join("\n");
}
