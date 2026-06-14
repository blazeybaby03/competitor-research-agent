// Stage 4: pure scheduling helpers for monthly re-runs. Kept import-free so the
// due-selection logic can be unit tested deterministically.

export const RERUN_INTERVAL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Is a business due for a scheduled re-run? Due when it has never run, or when
 * the last run is at least `intervalDays` old. Pure — `now` and `lastRunAt`
 * are passed in.
 */
export function isRerunDue(
  lastRunAt: string | null | undefined,
  now: number,
  intervalDays: number = RERUN_INTERVAL_DAYS
): boolean {
  if (!lastRunAt) return true;
  const last = new Date(lastRunAt).getTime();
  if (Number.isNaN(last)) return true; // unparseable -> treat as never run
  return now - last >= intervalDays * DAY_MS;
}
