"use client";

import { useEffect } from "react";

// Dynamic import ensures @plausible-analytics/tracker is never evaluated
// server-side — it uses `location.href` at module level which would throw
// in Node.js. useEffect is client-only; the dynamic import() runs lazily.
export function Analytics() {
  useEffect(() => {
    import("@plausible-analytics/tracker")
      .then(({ init }) => init({ domain: "competeiq.pro" }))
      .catch(console.error);
  }, []);
  return null;
}
