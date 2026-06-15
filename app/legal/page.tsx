import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_DOCS } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Legal",
  description: "CompeteIQ legal documents — terms, privacy, cookies, refunds and more.",
};

export default function LegalIndexPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold text-brand-600">
            CompeteIQ
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Legal</h1>
        <p className="mt-3 text-gray-600">
          The documents that govern your use of CompeteIQ and explain how we handle your data.
        </p>

        <ul className="mt-8 divide-y divide-gray-100 border-t border-gray-100">
          {LEGAL_DOCS.map((doc) => (
            <li key={doc.slug}>
              <Link
                href={`/legal/${doc.slug}`}
                className="block py-5 transition-colors hover:bg-gray-50"
              >
                <span className="text-base font-semibold text-gray-900">{doc.title}</span>
                <span className="mt-1 block text-sm text-gray-500">{doc.summary}</span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-gray-400">
          Questions? Email{" "}
          <a href="mailto:support.agent@agentmail.to" className="underline">
            support.agent@agentmail.to
          </a>
          .
        </p>
      </main>
    </div>
  );
}
