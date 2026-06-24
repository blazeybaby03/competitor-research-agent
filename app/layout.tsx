import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import AuthErrorHandler from "@/components/AuthErrorHandler";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const APP_NAME = "CompeteIQ";
const APP_DESCRIPTION =
  "Generate AI-written competitor intelligence reports in under 60 seconds. Spot market gaps, understand competitor positioning, and act on clear recommendations.";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} – AI Competitor Intelligence for Small Businesses`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} – AI Competitor Intelligence for Small Businesses`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} – AI Competitor Intelligence for Small Businesses`,
    description: APP_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Plausible Analytics — must be in <head> so it appears in server-rendered HTML */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script async src="https://plausible.io/js/pa-9ZvW9lR_6Fux9LKwbktPF.js" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};plausible.init()`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Suspense fallback={null}>
          <AuthErrorHandler />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
