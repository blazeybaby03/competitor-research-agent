"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, Search } from "lucide-react";

export interface ReportListItem {
  id: string;
  title: string;
  status: string;
  created_at: string;
  executive_summary: string | null;
}

const statusLabel: Record<string, string> = {
  completed: "Ready",
  failed: "Failed",
  generating: "Generating…",
  pending: "Pending…",
};

const statusStyle: Record<string, string> = {
  completed: "bg-green-50 text-green-700",
  failed: "bg-red-50 text-red-700",
  generating: "bg-yellow-50 text-yellow-700",
  pending: "bg-yellow-50 text-yellow-700",
};

type StatusFilter = "all" | "completed" | "generating" | "failed";

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "completed", label: "Ready" },
  { key: "generating", label: "In progress" },
  { key: "failed", label: "Failed" },
];

function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

export default function ReportsList({ reports }: { reports: ReportListItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = reports.filter((r) => {
      if (filter !== "all") {
        const inProgress = r.status === "generating" || r.status === "pending";
        if (filter === "generating" ? !inProgress : r.status !== filter) return false;
      }
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        (r.executive_summary ?? "").toLowerCase().includes(q)
      );
    });

    // Group chronologically by month (reports arrive newest-first).
    const ordered: { month: string; items: ReportListItem[] }[] = [];
    for (const r of filtered) {
      const key = monthKey(r.created_at);
      const last = ordered[ordered.length - 1];
      if (last && last.month === key) last.items.push(r);
      else ordered.push({ month: key, items: [r] });
    }
    return ordered;
  }, [reports, query, filter]);

  const totalMatches = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="space-y-5">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports…"
            aria-label="Search reports"
            className="input pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                filter === f.key
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {totalMatches === 0 ? (
        <div className="card p-10 text-center">
          <FileText className="h-8 w-8 text-gray-300 mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-600">No matching reports</p>
          <p className="text-xs text-gray-400 mt-1">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.month} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group.month}
              </h2>
              <span className="text-xs text-gray-300">{group.items.length}</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>
            {group.items.map((report) => {
              const style = statusStyle[report.status] ?? "bg-gray-50 text-gray-600";
              const label = statusLabel[report.status] ?? report.status;
              return (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="card p-5 flex items-start justify-between hover:bg-gray-50 transition-colors block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style}`}>
                        {label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(report.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{report.title}</h3>
                    {report.executive_summary && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {report.executive_summary}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 shrink-0 mt-1 ml-4" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
