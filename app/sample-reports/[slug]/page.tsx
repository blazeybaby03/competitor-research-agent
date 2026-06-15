import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { FullSampleReport } from "@/components/SampleReport";
import { getSampleReport, sampleReports } from "@/lib/sampleReports";

export function generateStaticParams() {
  return sampleReports.map((report) => ({ slug: report.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const report = getSampleReport(slug);

  if (!report) {
    return { title: "Sample Report" };
  }

  return {
    title: report.title,
    description: `A public-source CompeteIQ sample report for ${report.industry}.`
  };
}

export default async function SampleReportPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = getSampleReport(slug);

  if (!report) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingNav />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/sample-reports" className="mb-6 inline-block text-sm font-medium text-brand-600 hover:underline">
          Back to sample reports
        </Link>
        <FullSampleReport report={report} />
        <div className="mt-8 rounded-lg bg-white p-6 text-center shadow-sm ring-1 ring-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Want this for your own competitors?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500">
            CompeteIQ generates a private report from the competitor URLs you choose.
          </p>
          <Link href="/signup" className="btn-primary mt-5">
            Generate your first report free
          </Link>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
