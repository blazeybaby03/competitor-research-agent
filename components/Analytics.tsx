"use client";

import { useEffect } from "react";

// next/script does not function in this Next.js 16 + Railpack environment.
// Manual DOM append via useEffect is guaranteed to work regardless of
// framework internals — this is what afterInteractive does under the hood.
export function Analytics() {
  useEffect(() => {
    if (document.querySelector('script[src*="plausible.io"]')) return; // already loaded
    const script = document.createElement("script");
    script.src = "https://plausible.io/js/pa-9ZvW9lR_6Fux9LKwbktPF.js";
    script.async = true;
    document.head.appendChild(script);
  }, []);
  return null;
}
