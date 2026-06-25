"use client";

import { useEffect } from "react";
import { init } from "@plausible-analytics/tracker";

// Initialises Plausible once on client mount. bindToWindow: true (default)
// exposes window.plausible so Plausible's verification tool can detect it.
export function Analytics() {
  useEffect(() => {
    init({ domain: "competeiq.pro" });
  }, []);
  return null;
}
