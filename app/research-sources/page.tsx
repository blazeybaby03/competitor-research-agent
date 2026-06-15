import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Link2, Search, ShieldCheck } from "lucide-react";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";

export const metadata: Metadata = {
  title: "How CompeteIQ Sources Research",
  description: "How CompeteIQ reads public competitor pages, structures research, and shows source context."
};

const workflow = [
  {
    title: "User submits competitor URLs",
    body: "You choose the businesses and pages to analyse. CompeteIQ does not guess the final competitor set without your input.",
    icon: Link2
  },
  {
    title: "URLs are validated",
    body: "The app checks submitted URLs server-side before scraping so reports stay tied to reachable public pages.",
    icon: ShieldCheck
  },
  {
    title: "Public pages are read",
    body: "CompeteIQ reads public page content that can be accessed at generation time. It does not access logins, paywalls, private databases, or internal systems.",
    icon: Search
  },
  {
    title: "The report is structured",
    body: "The AI turns the public source material into consistent sections: summary, gaps, actions, competitor notes, positioning, pricing signals, and strengths or weaknesses.",
    icon: CheckCircle2
  }
];

const alternatives = [
  {
    option: "Manual spreadsheet",
    strengths: "Full human control",
    limits: "Slow to collect, hard to repeat, and often inconsistent between research sessions"
  },
  {
    option: "Generic chatbot",
    strengths: "Fast brainstorming",
    limits: "May answer from general training data unless you manually provide current source material"
  },
  {
    option: "Agency research",
    strengths: "High-touch strategic context",
    limits: "Often expensive, slower to refresh, and not always practical for every small decision"
  },
  {
    option: "Enterprise CI platform",
    strengths: "Powerful monitoring at scale",
    limits: "Can be too complex or costly for founders, operators, and small teams"
  },
  {
    option: "CompeteIQ",
    strengths: "Fast, structured reports from the competitor URLs you provide",
    limits: "Limited to public pages that can be scraped and the claims published on those pages"
  }
];

export default function ResearchSourcesPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-600">
              Research sources
            </p>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              CompeteIQ is designed to show what it read and what it inferred.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-600 sm:text-lg">
              Reports are based on public competitor pages supplied by the user. The workflow
              is built to make source context visible, while staying honest about what public
              website research can and cannot prove.
            </p>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                Workflow
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">From URL to structured report</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-4">
              {workflow.map((step, index) => (
                <div key={step.title} className="card relative p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <step.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">
                Comparison
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                Where CompeteIQ fits against common alternatives
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                The goal is not to replace every research method. It is to make a useful
                first competitor read fast, repeatable, and easier to trust.
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-3 bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-white">
                <span>Option</span>
                <span>Strength</span>
                <span>Limit</span>
              </div>
              {alternatives.map((item) => (
                <div key={item.option} className="grid grid-cols-1 gap-3 border-t border-gray-100 px-4 py-4 text-sm sm:grid-cols-3">
                  <div className="font-semibold text-gray-900">{item.option}</div>
                  <div className="text-gray-600">{item.strengths}</div>
                  <div className="text-gray-500">{item.limits}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            {[
              {
                title: "What users should trust",
                body: "The report structure, source list, scrape status, and the fact that analysis is grounded in the provided public URLs."
              },
              {
                title: "What users should verify",
                body: "Competitor pricing, legal claims, technical claims, and any high-stakes business decision before acting."
              },
              {
                title: "What CompeteIQ should disclose",
                body: "Failed scrapes, generation dates, source pages, and the limits of public website analysis."
              }
            ].map((item) => (
              <div key={item.title} className="card p-6">
                <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-brand-600 py-14 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white">See the workflow on a real market example</h2>
            <p className="mt-3 text-brand-100">
              Review public sample reports, then generate one for your own competitors.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sample-reports" className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-sm font-semibold text-brand-600 shadow-sm hover:bg-brand-50">
                View sample reports
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center gap-1 rounded-lg border border-brand-200 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700">
                Generate your first report <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
