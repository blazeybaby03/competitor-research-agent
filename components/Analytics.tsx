"use client";

import Script from "next/script";

// BUILD-MARKER-COMPETEIQ-ANALYTICS-20260625 — searchable in compiled chunks
const _PLAUSIBLE_SRC = "https://plausible.io/js/pa-9ZvW9lR_6Fux9LKwbktPF.js";

export function Analytics() {
  return (
    <Script
      src={_PLAUSIBLE_SRC}
      strategy="afterInteractive"
    />
  );
}
