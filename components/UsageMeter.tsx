import { Gauge } from "lucide-react";

interface Props {
  used: number;
  limit: number;
  title: string;
  footnote?: string;
}

/**
 * Presentational usage bar. Pure markup so it can render on the server.
 */
export default function UsageMeter({ used, limit, title, footnote }: Props) {
  const safeLimit = Math.max(limit, 0);
  const pct = safeLimit > 0 ? Math.min(100, Math.round((used / safeLimit) * 100)) : 0;
  const remaining = Math.max(0, safeLimit - used);
  const atLimit = safeLimit > 0 && used >= safeLimit;
  const nearLimit = !atLimit && pct >= 80;

  const barColor = atLimit
    ? "bg-red-500"
    : nearLimit
      ? "bg-amber-500"
      : "bg-brand-600";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-brand-600 shrink-0" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        </div>
        <span className="text-sm font-semibold text-gray-900">
          {used}
          <span className="text-gray-400 font-normal"> / {safeLimit}</span>
        </span>
      </div>

      <div
        className="h-2 w-full rounded-full bg-gray-100 overflow-hidden"
        role="progressbar"
        aria-valuenow={used}
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-label={title}
      >
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-gray-500 mt-2.5">
        {atLimit ? (
          <span className="text-red-600 font-medium">
            You&apos;ve used all {safeLimit} reports.
          </span>
        ) : (
          <>
            <span className="font-medium text-gray-700">{remaining}</span> remaining
          </>
        )}
        {footnote ? ` · ${footnote}` : ""}
      </p>
    </div>
  );
}
