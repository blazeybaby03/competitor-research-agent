"use client";

import { init } from "@plausible-analytics/tracker";

// Module-level init runs synchronously when this chunk is evaluated on the
// client — more reliable than useEffect in Next.js 16 App Router.
// typeof window guard prevents execution during SSR.
if (typeof window !== "undefined") {
  init({ domain: "competeiq.pro" });
}

// Component is a no-op render — all logic is in the module initialiser above.
export function Analytics() {
  return null;
}
