import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LegalMarkdown from "@/components/LegalMarkdown";
import { LEGAL_DOCS, getLegalDoc, readLegalMarkdown } from "@/lib/legal";

export function generateStaticParams() {
  return LEGAL_DOCS.map((d) => ({ slug: d.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) return { title: "Legal" };
  return { title: doc.title, description: doc.summary };
}

export default async function LegalDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLegalDoc(slug);
  if (!doc) notFound();

  // The H1 lives in the markdown itself, so strip nothing — just render.
  const content = readLegalMarkdown(doc.file);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-sm font-bold text-brand-600">
            CompeteIQ
          </Link>
          <Link href="/legal" className="text-sm text-gray-500 hover:text-gray-900">
            ← All legal documents
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <article>
          <LegalMarkdown content={content} />
        </article>

        <footer className="mt-12 border-t border-gray-100 pt-6 text-xs text-gray-400">
          <p>
            This document is provided for transparency and is not legal advice. Questions? Email{" "}
            <a href="mailto:support.agent@agentmail.to" className="underline">
              support.agent@agentmail.to
            </a>
            .
          </p>
        </footer>
      </main>
    </div>
  );
}
