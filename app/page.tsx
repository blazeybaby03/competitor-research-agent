import Link from "next/link";
import { CheckCircle, BarChart3, Zap, Target, TrendingUp, Shield, Users } from "lucide-react";
import MarketingFooter from "@/components/MarketingFooter";
import MarketingNav from "@/components/MarketingNav";
import { SampleReportPreview } from "@/components/SampleReport";
import { sampleReports } from "@/lib/sampleReports";

const useCases = [
  {
    role: "Founders",
    body: "Know what competitors charge, how they position, and where your product has room to win — before you build the wrong thing.",
  },
  {
    role: "Solo operators",
    body: "Get the same intelligence that big marketing teams pay agencies for, without the agency price tag.",
  },
  {
    role: "Consultants",
    body: "Walk into client engagements with a full competitor landscape already mapped and ready to discuss.",
  },
  {
    role: "Agencies",
    body: "Run competitive audits for every new client brief in minutes, not hours of manual research.",
  },
  {
    role: "Small businesses",
    body: "Understand why customers choose rivals and find the gaps you can realistically close this quarter.",
  },
];

export default function LandingPage() {
  const featuredSample = sampleReports[0];

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-20 sm:pb-12 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl mb-4 sm:mb-5">
          Know what your competitors
          <br className="hidden sm:block" />{" "}
          <span className="text-brand-600">are actually doing</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base sm:text-lg text-gray-500 mb-3 sm:mb-4">
          Paste in competitor URLs and get a 7-section intelligence report in
          about 60 seconds — competitor summaries, positioning, pricing, market
          gaps, and clear actions to take.
        </p>
        <p className="mx-auto max-w-xl text-sm text-gray-400 mb-6 sm:mb-8">
          Built from live competitor website data. Structured and ready to act on —
          not a spreadsheet, not a chatbot guess.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link href="/signup" className="btn-primary px-8 py-3 text-base">
            Generate your first report free →
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            Already have an account? Log in
          </Link>
        </div>
        {/* Trust strip */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            One free report, no credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-brand-500" />
            Secure billing via Stripe
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-500" />
            Built for founders &amp; operators
          </span>
        </div>
        {/* Report section tags */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-gray-400">Every report includes:</span>
          {[
            "Executive Summary",
            "Market Gaps",
            "Recommended Actions",
            "Competitor Summaries",
            "Positioning Analysis",
            "Pricing Analysis",
            "Strengths & Weaknesses",
          ].map((s) => (
            <span
              key={s}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500"
            >
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Report Preview */}
      <section className="bg-gray-50 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-brand-600 mb-3 sm:mb-4">
            What you get
          </h2>
          <p className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            A source-labelled example report, not a generic mockup
          </p>
          <p className="text-center text-sm text-gray-500 mb-6 sm:mb-10">
            This public sample uses known companies for illustration only and shows the sources behind the analysis.
          </p>
          <SampleReportPreview report={featuredSample} />
          <p className="text-center text-xs text-gray-400 mt-4">
            Your private report is generated from the competitor websites you provide, based on the public content that can be read at generation time.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Up and running in 3 steps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                step: "01",
                title: "Add your business",
                body: "Tell us your industry and website so the AI understands your context.",
              },
              {
                step: "02",
                title: "Enter competitor URLs",
                body: "Paste 1–5 URLs of competitors. CompeteIQ visits each site, reads their public content, and uses it to build your report.",
              },
              {
                step: "03",
                title: "Get your report",
                body: "In about 60 seconds you'll have a detailed, structured intelligence report ready to act on.",
              },
            ].map((s) => (
              <div key={s.step}>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white font-bold">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to outmanoeuvre the competition
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Zap,
                title: "Automatic scraping",
                description:
                  "We fetch and analyse competitor websites for you — no copy-pasting required.",
              },
              {
                icon: BarChart3,
                title: "Structured, not generic",
                description:
                  "Seven consistent sections every time — written from live competitor website content, not generic AI training data or ChatGPT guesses.",
              },
              {
                icon: Target,
                title: "Actionable gaps",
                description:
                  "Every report ends with specific market gaps and actions tailored to your business.",
              },
              {
                icon: TrendingUp,
                title: "Track over time",
                description:
                  "Re-run reports monthly to track competitor moves and refine your strategy.",
              },
            ].map((f) => (
              <div key={f.title} className="card p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <f.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Who uses CompeteIQ
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Built for small teams who need real intelligence, fast.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc) => (
              <div key={uc.role} className="card p-6">
                <p className="text-sm font-semibold text-brand-600 mb-2">
                  {uc.role}
                </p>
                <p className="text-sm text-gray-600">{uc.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Your first report is free. No credit card required to start.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                name: "Free",
                price: "A$0",
                description: "See what CompeteIQ produces before you commit to anything.",
                features: [
                  "1 full report — yours to keep",
                  "Up to 3 competitors per report",
                  "All 7 report sections included",
                  "No credit card required",
                ],
                cta: "Generate your first report free →",
                href: "/signup",
                highlighted: false,
              },
              {
                name: "Starter",
                price: "A$39",
                description: "Keep generating fresh reports when your free trial runs out.",
                features: [
                  "10 competitor reports per 30 days",
                  "Up to 3 competitors per report",
                  "All 7 report sections included",
                  "Scheduled monthly re-runs",
                  "Client-ready PDF export",
                  "Copy & share reports",
                  "Cancel any time",
                ],
                cta: "Get Starter →",
                href: "/billing?plan=starter",
                highlighted: false,
              },
              {
                name: "Pro",
                price: "A$159",
                description: "Research competitors across clients, markets, and ongoing strategy cycles.",
                features: [
                  "100 competitor reports per 30 days",
                  "Up to 5 competitors per report",
                  "All 7 report sections included",
                  "Scheduled monthly re-runs",
                  "Client-ready PDF export",
                  "Copy & share reports",
                  "Priority support",
                  "Cancel any time",
                ],
                cta: "Get Pro →",
                href: "/billing?plan=pro",
                highlighted: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 ${plan.highlighted ? "ring-2 ring-brand-600" : ""}`}
              >
                <div className="text-xs font-semibold text-brand-600 uppercase tracking-wide mb-2">
                  {plan.name}
                </div>
                <div className="mb-1">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.price !== "A$0" && <span className="text-gray-500">/month</span>}
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={plan.highlighted ? "btn-primary w-full" : "btn-secondary w-full"}
                >
                  {plan.cta}
                </Link>
                {plan.name === "Free" && (
                  <p className="text-xs text-gray-400 text-center mt-3">
                    No credit card required to start
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Common questions
          </h2>
          <div className="space-y-8">
            {[
              {
                q: "What exactly do I get in a report?",
                a: "An executive summary, market gaps your competitors miss, recommended actions for your business, individual competitor summaries, positioning analysis, pricing comparison, and strengths/weaknesses. All seven sections are generated from live scrapes of the competitor websites you provide.",
              },
              {
                q: "How is this different from asking ChatGPT?",
                a: "ChatGPT answers from general training data — it doesn't visit your competitors' websites. CompeteIQ fetches the competitor pages you provide, reads their actual public content, and structures a report around what's on those pages now. The result is grounded in the live pages you point us at, not a generalisation from training data.",
              },
              {
                q: "How accurate is the report? What does CompeteIQ actually verify?",
                a: "CompeteIQ reads and analyses the public content of the competitor URLs you provide — the pages you point us at, as they appear when we fetch them. Reports reflect what's published on those pages: messaging, positioning, and whatever pricing or feature details are visible there. We don't crawl entire sites, we don't independently verify claims competitors make about themselves, and we can't access content behind a login or paywall. Think of it as a structured read-through of the public pages you choose, delivered in a consistent format you can act on.",
              },
              {
                q: "How long does a report take?",
                a: "About 60 seconds. We scrape your competitor URLs, read the content, and generate the full report in one step.",
              },
              {
                q: "Do I need a credit card to try it?",
                a: "No. Sign up and generate your first report for free. You only need a payment method if you upgrade to Starter or Pro.",
              },
              {
                q: "What happens after my free report?",
                a: "You can review and copy your free report any time. To generate more reports, upgrade to Starter (A$39/month, 10 reports per 30 days) or Pro (A$159/month, 100 reports per 30 days with up to 5 competitors each). You can cancel any time.",
              },
              {
                q: "Is my data secure?",
                a: "Reports are private to your account. Payments are handled by Stripe — we never store your card details. Competitor URLs are validated server-side before scraping.",
              },
            ].map((item) => (
              <div key={item.q} className="border-b border-gray-100 pb-8">
                <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-brand-600 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to see what your competitors are doing?
          </h2>
          <p className="text-brand-100 mb-8">
            Your first report is free. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-brand-600 shadow-sm hover:bg-brand-50 transition-colors"
          >
            Generate your first report free →
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
