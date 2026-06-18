export type SampleReportSource = {
  name: string;
  url: string;
  note: string;
};

export type SampleReport = {
  slug: string;
  industry: "SaaS" | "E-commerce" | "Marketing";
  title: string;
  targetCompany: string;
  targetUrl: string;
  generatedDate: string;
  scrapeDate: string;
  summary: string;
  marketGaps: string[];
  recommendedActions: string[];
  competitors: {
    name: string;
    url: string;
    summary: string;
    strengths: string[];
    watchouts: string[];
  }[];
  positioningAnalysis: string;
  pricingAnalysis: string;
  sources: SampleReportSource[];
};

export const sampleDisclaimer =
  "Example report generated from publicly available pages. No affiliation with or endorsement by the companies mentioned. Competitor names are used for identification and comparison only. Pricing, messaging, and features may change after the generation date.";

export const sampleReports: SampleReport[] = [
  {
    slug: "saas-notion",
    industry: "SaaS",
    title: "SaaS Sample Report: Notion Workspace Market",
    targetCompany: "Notion",
    targetUrl: "https://www.notion.com/product",
    generatedDate: "15 June 2026",
    scrapeDate: "15 June 2026",
    summary:
      "Notion positions as an all-in-one connected workspace combining docs, wikis, databases, and project management, with AI features layered across the product. The competitor set has split into two camps: tools focused on structured task and project execution (Asana, ClickUp) and tools built around flexible documents and knowledge (Coda, Notion). Differentiation increasingly depends on AI quality, migration friction, and whether teams believe a single tool can replace their existing stack.",
    marketGaps: [
      "Teams migrating from multiple tools need clear migration support — no competitor prominently addresses the friction of moving existing content and workflows, leaving buyers to figure it out alone.",
      "AI is now claimed across every competitor, but none clearly demonstrates ROI or shows concrete before-and-after workflow examples before signup — the category is competing on AI feature lists, not outcomes.",
      "Team-level pricing clarity is weak across the segment — per-seat costs, plan limits, and AI add-on pricing require significant effort to compare, which drives buyers to Reddit threads rather than converting."
    ],
    recommendedActions: [
      "Publish a direct migration guide targeting Asana and ClickUp switchers — show how projects, tasks, and docs translate to Notion's structure rather than asking buyers to figure it out themselves.",
      "Lead AI pages with specific productivity outcomes and time-saved examples rather than feature lists; every competitor also claims AI-powered work, so outcomes are the differentiator.",
      "Add a team-size cost calculator or example budgets to the pricing page — cost uncertainty is a recurring reason buyers delay or choose a competitor with simpler pricing.",
      "Build stronger positioning for the consultant and agency segment with a dedicated template library; neither Coda nor ClickUp has strong agency-facing positioning, leaving this segment underserved."
    ],
    competitors: [
      {
        name: "Coda",
        url: "https://coda.io/product",
        summary:
          "Coda positions as a doc that works like a product — combining tables, automations, and integrations (called Packs) so teams can build internal tools without code. Its pitch is power over simplicity: teams that outgrow basic docs find Coda's programmable tables and automation engine genuinely useful for lightweight internal apps.",
        strengths: ["More powerful table and automation engine than Notion for building internal tools", "Packs integration ecosystem with deep connectivity to third-party services", "Simpler per-doc pricing model at small team sizes"],
        watchouts: ["Steeper learning curve than Notion for non-technical users", "Brand awareness is significantly lower — most buyers in this category have not evaluated Coda", "Lacks Notion's wiki depth and knowledge-management positioning"]
      },
      {
        name: "ClickUp",
        url: "https://clickup.com/features",
        summary:
          "ClickUp targets teams that want to consolidate project management, docs, chat, whiteboards, and goals into one platform. It competes aggressively on breadth and price, with a large free tier and a fast-moving feature roadmap. ClickUp positions against Asana and Monday.com as much as Notion, which means its messaging often prioritises task execution over knowledge and document depth.",
        strengths: ["Most feature-dense platform in the category with views including Gantt, Board, List, and Calendar", "Competitive pricing with a generous free tier that lowers switching costs", "Strong project and task execution pedigree that Notion's docs-first positioning lacks"],
        watchouts: ["Interface complexity is a well-documented churn driver — new users frequently report feeling overwhelmed", "Teams seeking a lightweight wiki or knowledge base find the task-heavy UI a poor fit", "Support quality and reliability have been inconsistent as the product has scaled"]
      },
      {
        name: "Asana",
        url: "https://asana.com/product",
        summary:
          "Asana focuses on structured work management — projects, tasks, timelines, portfolios, and goals — for teams that need coordination across people and departments. It does not compete as a doc or wiki tool; its strength is accountability, workflow automation, and reporting for team leads and project managers.",
        strengths: ["Established brand and category fit for project and work management", "Strong timeline, workload, and portfolio features for managing multiple projects simultaneously", "Better enterprise admin and permissions tooling than Notion or ClickUp at comparable plan levels"],
        watchouts: ["Not a knowledge or document tool — teams wanting an all-in-one workspace will find Asana's doc capabilities too limited", "Removed its free multi-user plan, making it more expensive to evaluate than ClickUp at the team level", "Enterprise-first language can feel mismatched for small teams and solo operators"]
      }
    ],
    positioningAnalysis:
      "The workspace category has divided around two purchase motivations: teams that want better documents and knowledge management (Notion, Coda) and teams that want better task and project execution (Asana, ClickUp). Notion's strongest angle is the flexible knowledge base that product teams, founders, and solo operators can shape to their own workflow — a use case neither Asana nor ClickUp serves as well. The risk is being outflanked by Asana for coordination-first buyers and by ClickUp on price for cost-sensitive startups. The category is also converging on AI, which reduces differentiation on features and raises the stakes on outcomes, onboarding speed, and trust.",
    pricingAnalysis:
      "Notion's public pricing includes a free individual tier and per-seat paid plans, with Notion AI as a paid add-on. Coda is free for small teams with limits on Packs automations. ClickUp's free tier is expansive; paid plans add storage, Gantt, and reporting. Asana no longer offers a free multi-user plan, which creates a clear pricing vulnerability versus ClickUp for budget-sensitive buyers. SaaS plan structures change frequently — for a live report, pricing pages should be scraped at the time of analysis and flagged with a generation date.",
    sources: [
      { name: "Notion product page", url: "https://www.notion.com/product", note: "Target company workspace positioning, AI features, and use case framing" },
      { name: "Coda product page", url: "https://coda.io/product", note: "Competitor docs-as-apps positioning, Packs integrations, and automation depth" },
      { name: "ClickUp features page", url: "https://clickup.com/features", note: "Competitor feature breadth, project management views, and pricing positioning" },
      { name: "Asana product page", url: "https://asana.com/product", note: "Competitor work management, timeline, and team coordination positioning" }
    ]
  },
  {
    slug: "ecommerce-allbirds",
    industry: "E-commerce",
    title: "E-commerce Sample Report: Sustainable Footwear Market",
    targetCompany: "Allbirds",
    targetUrl: "https://www.allbirds.com/",
    generatedDate: "15 June 2026",
    scrapeDate: "15 June 2026",
    summary:
      "Allbirds leads with natural materials (merino wool, eucalyptus tree fibre) and carbon reduction as its primary differentiators in premium footwear. Competitors split across distinct functional promises: washability (Rothy's), weather utility (Vessi), and natural-material sustainability with a lifestyle aesthetic (Cariuma). The purchase decision in this segment often reduces to which sustainability story feels most credible and which comfort or utility claim is most concrete at the point of purchase.",
    marketGaps: [
      "Sustainability claims across all four brands are heavy on language but light on third-party verification above the fold — buyers seeking proof of carbon or material claims have to navigate away from product pages to find certifications.",
      "Comfort is claimed by every brand but demonstrated differently across material descriptions, customer reviews, and use-case framing — no brand in this segment clearly owns the most comfortable everyday shoe position with repeatable, scannable proof.",
      "Gift purchasing and size confidence signals (easy returns, size guides, customer fit notes) are weaker than sustainability messaging on most of these sites, which affects first-time buyer conversion."
    ],
    recommendedActions: [
      "Surface third-party certifications (B Corp status, carbon measurement methodology, material sourcing verification) on product pages and not just on About or sustainability landing pages — claims need to be visible at the point of purchase to influence the decision.",
      "Add a direct material comparison or plain-language FAQ explaining what separates wool, eucalyptus, recycled plastic, and sugarcane — buyers in this category are educated and want specifics, not just sustainability brand language.",
      "Test use-case framing anchored to daily scenarios (commute, travel, light outdoor) to clarify which shoe fits which lifestyle, as Vessi does with its weather positioning — this reduces comparison paralysis.",
      "Make return and exchange policies as prominent as sustainability claims — gift buyers and first-time shoppers consistently flag size confidence as a purchase blocker in premium footwear."
    ],
    competitors: [
      {
        name: "Rothy's",
        url: "https://rothys.com/",
        summary:
          "Rothy's leads with machine-washable shoes and bags made from recycled plastic bottles, targeting women primarily but expanding to men and kids. The brand's core differentiator is care simplicity — washable footwear removes a key ownership friction that other sustainable brands do not address directly.",
        strengths: ["Clear and ownable washability hook that translates to a practical, everyday buyer benefit", "Broad product range spanning flats, sneakers, loafers, and bags with strong lifestyle presentation", "Established DTC brand with repeat purchase loyalty and strong word-of-mouth in the sustainable fashion segment"],
        watchouts: ["Sustainability narrative is materials-focused (recycled plastic bottles) without the carbon reduction language Allbirds leads with, making the eco comparison less direct", "Price-to-value clarity is weaker than the brand presentation — shoppers comparing for the first time may not immediately understand what justifies the premium"]
      },
      {
        name: "Vessi",
        url: "https://vessi.com/",
        summary:
          "Vessi is built entirely around 100% waterproof knit footwear, making weather utility the single and entire brand premise. This focus gives it the clearest purchase rationale in the segment — if you need dry feet in any conditions, Vessi is the category answer.",
        strengths: ["Clearest functional promise in the segment — waterproof is a simple, verifiable, and urgent need for a large buyer segment", "Simple and repeatable marketing message that holds across all channels and product types", "Accessible price point relative to Allbirds and Cariuma, making it a natural comparison for budget-aware sustainability buyers"],
        watchouts: ["Limited design range compared to Allbirds and Rothy's — the brand has less room for lifestyle or seasonal extension", "No meaningful sustainability messaging, which limits its appeal to buyers for whom eco credentials are a primary driver", "Waterproof as the only positioning creates a vulnerability if a competitor adds waterproofing to a broader product range"]
      },
      {
        name: "Cariuma",
        url: "https://www.cariuma.com/",
        summary:
          "Cariuma is a Brazilian sustainable sneaker brand built on natural and low-impact materials including bamboo, sugarcane, bio-based rubber, and organic cotton. It carries strong sustainability credentials including carbon-neutral certification and B Corp status, paired with a casual and skate-influenced aesthetic that stylistically separates it from Allbirds' minimalist look.",
        strengths: ["Strong sustainability story with third-party certifications that go beyond material claims — B Corp and carbon-neutral status are visible differentiators", "Distinctive aesthetic that avoids the generic minimalist default, appealing to buyers who want sustainability and style without looking like they are wearing wellness footwear", "Natural materials story complements Allbirds without directly copying it, giving buyers in the segment a genuine alternative"],
        watchouts: ["Lower brand recognition outside sustainability-focused buyers — awareness building requires more marketing investment than Allbirds or Rothy's at comparable spend", "Smaller product range limits repeat purchase frequency and reduces the lifetime value potential that Rothy's bags and accessories unlock", "Premium price point requires strong proof at the moment of purchase — certification pages are not always surfaced where the buying decision is made"]
      }
    ],
    positioningAnalysis:
      "The sustainable premium footwear segment has four distinct promises at the moment: natural materials and carbon reduction (Allbirds), washable everyday style made from recycled materials (Rothy's), single-minded weather utility (Vessi), and natural-material sustainability with lifestyle design (Cariuma). Allbirds' risk is that the natural-material story is becoming shared territory as Cariuma expands, while Vessi's functional clarity is easier for new buyers to act on quickly. The biggest gap across all four brands is bridging from sustainability language to purchase confidence — certifications, return policies, and use-case clarity matter as much as brand values at the point of conversion.",
    pricingAnalysis:
      "Allbirds and Cariuma sit at a comparable premium price point (roughly $120–$160 for core sneakers), while Rothy's ranges from $145 to $175 depending on style. Vessi is generally lower at $90–$130. All four brands sell direct-to-consumer with free shipping thresholds and returns policies that vary in generosity. E-commerce pricing is volatile — sale events, regional variations, and bundle offers change frequently — so a live report should capture visible pricing, shipping thresholds, and returns language at the time of scraping rather than treating snapshot prices as durable facts.",
    sources: [
      { name: "Allbirds homepage", url: "https://www.allbirds.com/", note: "Target company materials positioning, carbon reduction claims, product categories, and sustainability narrative" },
      { name: "Rothy's homepage", url: "https://rothys.com/", note: "Competitor washability positioning, recycled materials story, product range, and DTC brand presentation" },
      { name: "Vessi homepage", url: "https://vessi.com/", note: "Competitor waterproof utility positioning, product range, and pricing signals" },
      { name: "Cariuma homepage", url: "https://www.cariuma.com/", note: "Competitor B Corp and carbon-neutral credentials, natural materials story, and lifestyle aesthetic positioning" }
    ]
  },
  {
    slug: "marketing-mailchimp",
    industry: "Marketing",
    title: "Marketing Sample Report: Email And Automation Platforms",
    targetCompany: "Mailchimp",
    targetUrl: "https://mailchimp.com/",
    generatedDate: "15 June 2026",
    scrapeDate: "15 June 2026",
    summary:
      "Mailchimp positions as the email and marketing platform for small businesses and e-commerce, with a widely recognised brand, a freemium entry point, and a growing suite covering email, SMS, social ads, and basic CRM. The competitor set has fragmented around buyer type: Klaviyo targets e-commerce revenue performance, ActiveCampaign targets marketing automation depth for B2B, and HubSpot targets CRM-connected marketing teams at mid-market and above. Mailchimp's brand recognition is a genuine asset, but pricing changes following the Intuit acquisition and increasing feature sprawl have opened room for more focused competitors.",
    marketGaps: [
      "Small business owners comparing tools at the 1,000–10,000 contact tier struggle to understand actual monthly cost — public pricing tables across all competitors are complex, contact-based, and require significant calculation effort before a buyer can compare fairly.",
      "Customer data portability and migration friction are rarely addressed on competitor marketing pages despite being among the top objections during platform evaluation — the buyer who wants to leave one platform is not told what switching looks like.",
      "Deliverability proof and sender reputation guidance is underrepresented in marketing pages across the category, even though deliverability is a core purchase criterion for experienced email senders who have been burned by poor inbox rates."
    ],
    recommendedActions: [
      "Publish a plain-language cost comparison at common contact tiers (500, 1k, 5k, 10k) to directly address the pricing confusion that sends buyers to Reddit comparison threads instead of converting — this is a winnable trust moment competitors have not addressed.",
      "Add migration support messaging to landing pages targeting Klaviyo and HubSpot comparisons — both have dedicated compare pages actively targeting Mailchimp customers, and a concrete data-import and onboarding guide is a high-value counter.",
      "Lead e-commerce landing pages with revenue attribution examples and Shopify integration depth — Mailchimp's e-commerce story is less visible than Klaviyo's in search and comparison contexts despite comparable integration capability.",
      "Add deliverability metrics, sender reputation tools, or inbox placement data to primary feature pages — large ESPs have deliverability infrastructure that smaller tools cannot match, and this is a differentiator that is currently undersold."
    ],
    competitors: [
      {
        name: "Klaviyo",
        url: "https://www.klaviyo.com/",
        summary:
          "Klaviyo is built specifically for e-commerce brands, with deep Shopify and BigCommerce integrations, purchase-behaviour segmentation, and revenue attribution tied directly to email and SMS flows. It has become the default email platform for growing DTC brands and directly competes with Mailchimp in the e-commerce segment, where it is increasingly winning on the strength of its data model.",
        strengths: ["Best-in-class e-commerce revenue attribution — buyers can see exactly which email or SMS flow generated each sale", "Deep native Shopify integration with automatic customer and purchase data sync, reducing setup time significantly", "Email and SMS on a shared contact and segmentation model, which Mailchimp charges separately and manages less cohesively"],
        watchouts: ["Significantly more expensive than Mailchimp at scale — at 10k+ contacts, Klaviyo's cost is a frequent reason buyers compare alternatives", "Less suited to B2B or service businesses that do not have purchase data to drive segmentation", "Interface complexity increases as list size grows — advanced flows require meaningful setup time that smaller teams may not have"]
      },
      {
        name: "ActiveCampaign",
        url: "https://www.activecampaign.com/",
        summary:
          "ActiveCampaign leads with marketing automation and CRM for businesses that need multi-step customer journeys beyond simple broadcast email. Its automation builder supports conditional logic, lead scoring, site tracking, and deal pipelines, making it a stronger fit for B2B teams with longer sales cycles than Mailchimp's broadcast-first model serves well.",
        strengths: ["Strongest automation builder in the mid-market segment with visual conditional logic, lead scoring, and site tracking built in", "Native CRM with deal pipelines reduces tool sprawl for small B2B sales teams that need marketing and sales visibility in one place", "Large library of pre-built automation recipes that reduce time-to-launch for common lifecycle sequences"],
        watchouts: ["Interface design is dated compared to Klaviyo and Mailchimp — new users frequently report a steep learning curve before their first campaign sends", "Less suited to e-commerce than B2B — lacks the purchase-data segmentation depth that Klaviyo and even Mailchimp provide for DTC brands", "Onboarding complexity can slow time-to-first-send for users who are migrating from a simpler platform and do not need the full automation depth"]
      },
      {
        name: "HubSpot Marketing Hub",
        url: "https://www.hubspot.com/products/marketing",
        summary:
          "HubSpot Marketing Hub is part of HubSpot's broader CRM platform including Sales Hub, Service Hub, and CMS. Its marketing tool set covers email, ads, landing pages, SEO, social media, and analytics — all connected to shared CRM contact records. It is positioned primarily at B2B companies with an active sales team that needs marketing and sales data in one place.",
        strengths: ["Full CRM ecosystem — marketing, sales, and service share contact records, reducing data silos and handoff friction between teams", "Strong SEO, content, and landing page tools that go beyond what email-first platforms offer", "Well-regarded onboarding resources and HubSpot Academy certification that reduce time-to-value for new teams"],
        watchouts: ["Most expensive option at comparable feature levels — Starter plans are limited and most meaningful features require Professional tier, which creates sticker shock during evaluation", "Primarily serves B2B teams with a CRM need — not a natural fit for pure e-commerce or small businesses that do not need sales pipeline management", "The platform breadth can be overwhelming for teams that only need email and automation — buyers comparing with Mailchimp often find HubSpot requires more organisational buy-in than they expected"]
      }
    ],
    positioningAnalysis:
      "The email and marketing automation market has fragmented by buyer type rather than feature set. Mailchimp serves small businesses and e-commerce with a recognised brand and accessible entry point. Klaviyo has become the e-commerce default for DTC brands focused on revenue attribution. ActiveCampaign serves B2B teams with complex automation needs. HubSpot serves mid-market B2B companies that need marketing and CRM in one platform. The risk for Mailchimp is that it is positioned broadly enough to be outcompeted by specialists in each segment — Klaviyo on e-commerce, ActiveCampaign on automation depth, and HubSpot on CRM-connected marketing. The brand recognition advantage erodes if buyers in each segment find a more focused alternative during evaluation.",
    pricingAnalysis:
      "Mailchimp's pricing is contact-based with a limited free tier, and costs rise significantly at 5k+ contacts. Klaviyo is similarly contact-based but starts higher and scales faster, with SMS billed separately by message volume. ActiveCampaign prices by contacts and feature tier. HubSpot's Starter plan is modest but the Professional tier required for automation represents a significant jump. Marketing platform pricing depends on contacts, message volume, seats, and plan tier — for a live report, pricing pages should be scraped at the time of analysis and cost should be calculated at the buyer's actual list size rather than comparing headline plan prices.",
    sources: [
      { name: "Mailchimp homepage", url: "https://mailchimp.com/", note: "Target company positioning, small business and e-commerce messaging, feature suite and pricing signals" },
      { name: "Klaviyo homepage", url: "https://www.klaviyo.com/", note: "Competitor e-commerce CRM positioning, Shopify integration depth, and SMS and email combined platform story" },
      { name: "ActiveCampaign homepage", url: "https://www.activecampaign.com/", note: "Competitor automation and CRM positioning, B2B lifecycle workflow emphasis, and pricing signals" },
      { name: "HubSpot Marketing Hub page", url: "https://www.hubspot.com/products/marketing", note: "Competitor CRM-connected marketing positioning, platform breadth, and B2B enterprise signals" }
    ]
  }
];

export const useCaseSummaries = [
  {
    slug: "saas",
    industry: "SaaS",
    title: "SaaS competitor research",
    description:
      "Compare positioning, feature emphasis, onboarding promises, public pricing signals, and category language across software competitors.",
    reportSlug: "saas-notion",
    audience: "Founders, product marketers, operators, and consultants comparing software categories.",
    decisions: ["Which segment to lead with", "Which competitor claims are overcrowded", "Where pricing or onboarding friction appears"]
  },
  {
    slug: "ecommerce",
    industry: "E-commerce",
    title: "E-commerce competitor research",
    description:
      "Review store messaging, product range, trust signals, shipping and returns language, and public claims that affect buyer confidence.",
    reportSlug: "ecommerce-allbirds",
    audience: "Store owners, growth marketers, brand strategists, and agencies working with DTC brands.",
    decisions: ["Which promise should lead the page", "Which trust signals are missing", "How competitor offers reduce purchase friction"]
  },
  {
    slug: "marketing",
    industry: "Marketing",
    title: "Marketing platform competitor research",
    description:
      "Map how marketing tools explain email, SMS, automation, analytics, integrations, AI, and buyer fit.",
    reportSlug: "marketing-mailchimp",
    audience: "Marketing teams, agencies, consultants, and SaaS operators comparing go-to-market tools.",
    decisions: ["Which features are table stakes", "Where messaging sounds interchangeable", "Which buyer segment each competitor serves"]
  }
];

export function getSampleReport(slug: string) {
  return sampleReports.find((report) => report.slug === slug);
}

export function getUseCase(slug: string) {
  return useCaseSummaries.find((useCase) => useCase.slug === slug);
}
