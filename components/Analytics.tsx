"use client";

import Script from "next/script";

// Client component wrapper required for next/script in Next.js 16 App Router.
// Server Components do not compile Script's src into the client bundle.
export function Analytics() {
  return (
    <Script
      src="https://plausible.io/js/pa-9ZvW9lR_6Fux9LKwbktPF.js"
      strategy="afterInteractive"
    />
  );
}
