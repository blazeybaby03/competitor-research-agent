import fs from "node:fs";
import path from "node:path";

/**
 * Legal documents published in the app.
 *
 * The markdown masters live in `08_LEGAL/` (record of truth) and are mirrored
 * verbatim into `content/legal/<slug>.md`. Update both when a document changes.
 */
export type LegalDoc = {
  slug: string;
  /** Source markdown filename in content/legal */
  file: string;
  /** Short title for nav, footer and list pages */
  title: string;
  /** One-line description for the /legal index */
  summary: string;
};

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: "terms",
    file: "terms.md",
    title: "Terms of Service",
    summary: "The agreement that governs your use of CompeteIQ.",
  },
  {
    slug: "privacy",
    file: "privacy.md",
    title: "Privacy Policy",
    summary: "What personal information we collect and how we handle it.",
  },
  {
    slug: "cookies",
    file: "cookies.md",
    title: "Cookie Policy",
    summary: "The cookies and similar technologies we use.",
  },
  {
    slug: "acceptable-use",
    file: "acceptable-use.md",
    title: "Acceptable Use Policy",
    summary: "What you may and may not do when using the Service.",
  },
  {
    slug: "refunds",
    file: "refunds.md",
    title: "Refund & Cancellation Policy",
    summary: "How cancellations and refunds work.",
  },
  {
    slug: "disclaimer",
    file: "disclaimer.md",
    title: "Disclaimer",
    summary: "Important notes on AI-generated reports.",
  },
  {
    slug: "subprocessors",
    file: "subprocessors.md",
    title: "Subprocessors",
    summary: "The third-party providers that help run CompeteIQ.",
  },
];

/** Map a cross-document `.md` link basename to its published route, if any. */
export const MD_BASENAME_TO_SLUG: Record<string, string> = {
  "Terms-of-Service": "terms",
  "Privacy-Policy": "privacy",
  "Cookie-Policy": "cookies",
  "Acceptable-Use-Policy": "acceptable-use",
  "Refund-and-Cancellation-Policy": "refunds",
  Disclaimer: "disclaimer",
  Subprocessors: "subprocessors",
};

export function getLegalDoc(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug);
}

export function readLegalMarkdown(file: string): string {
  const filePath = path.join(process.cwd(), "content", "legal", file);
  return fs.readFileSync(filePath, "utf8");
}
