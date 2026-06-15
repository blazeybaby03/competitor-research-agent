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
      "Notion positions around an AI workspace that combines docs, knowledge, projects, search, and agents. The competitor set shows a crowded productivity category where the main battle is not only task management, but whether teams believe one workspace can replace multiple specialist tools.",
    marketGaps: [
      "A buyer comparing these tools still has to translate broad productivity claims into a practical migration plan.",
      "The category is heavy on AI and all-in-one language, but lighter on simple proof of day-one setup time for small teams.",
      "Security, admin, and enterprise-readiness messages are visible, but small-team cost clarity can still become a decision blocker."
    ],
    recommendedActions: [
      "Lead sample pages with the exact buyer decision the report helps answer, not a generic productivity claim.",
      "Show source URLs and scrape dates near the executive summary so readers can see what the analysis is based on.",
      "Separate public evidence from interpretation by labelling market gaps as CompeteIQ analysis.",
      "Use this report type to target founders, operators, and consultants comparing workspace tools before a migration."
    ],
    competitors: [
      {
        name: "Coda",
        url: "https://coda.io/product",
        summary:
          "Coda positions as a collaborative all-in-one platform that blends docs, spreadsheets, and applications, with team hubs, trackers, apps, AI, and integrations.",
        strengths: ["Strong all-in-one workspace story", "Clear docs-plus-apps positioning", "Visible integration and API messaging"],
        watchouts: ["May require education for buyers who expect a simple document tool", "Comparison claims should be checked against current product pages"]
      },
      {
        name: "ClickUp",
        url: "https://clickup.com/features",
        summary:
          "ClickUp emphasizes a broad work platform with tasks, docs, chat, dashboards, goals, AI, automations, and templates.",
        strengths: ["Broad feature coverage", "Strong work-management language", "Clear AI and automation emphasis"],
        watchouts: ["Feature breadth may feel complex to small teams", "The all-in-one claim needs careful source-backed comparison"]
      },
      {
        name: "Asana",
        url: "https://asana.com/product",
        summary:
          "Asana presents itself as a work-management system for coordinating projects, goals, workflows, reporting, and AI-supported execution.",
        strengths: ["Established work-management category fit", "Clear project and goal-management language", "Strong team coordination framing"],
        watchouts: ["Less suited to positioning as a flexible doc/wiki workspace without deeper evidence", "Enterprise workflow language may not answer solo-operator needs"]
      }
    ],
    positioningAnalysis:
      "The SaaS workspace market is converging around three promises: one source of truth, AI-assisted work, and fewer disconnected tools. Notion leans into workspace and knowledge depth, Coda emphasizes docs that become apps, ClickUp pushes breadth across work execution, and Asana stays close to project and work management. A CompeteIQ report is useful here because the differences are subtle and easy to flatten into generic all-in-one language.",
    pricingAnalysis:
      "This sample avoids publishing live price comparisons because SaaS pricing changes often and plan packaging can vary by region, team size, and billing cycle. For a live customer report, CompeteIQ should read the pricing pages supplied by the user and flag whether public pricing, free trials, enterprise gates, and plan limits are visible.",
    sources: [
      { name: "Notion product page", url: "https://www.notion.com/product", note: "Target company positioning and product surface" },
      { name: "Coda product page", url: "https://coda.io/product", note: "Competitor positioning and product surface" },
      { name: "ClickUp features page", url: "https://clickup.com/features", note: "Competitor positioning and product surface" },
      { name: "Asana product page", url: "https://asana.com/product", note: "Competitor positioning and product surface" }
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
      "Allbirds presents a comfort-and-sustainability footwear story, with visible emphasis on natural materials and reducing carbon impact. The competitor set shows how e-commerce brands differentiate with material claims, lifestyle use cases, waterproofing, washability, and sustainability narratives.",
    marketGaps: [
      "Footwear brands often make material or sustainability claims, but shoppers may need clearer side-by-side proof points.",
      "Comfort, waterproofing, washability, and climate language compete for attention; the strongest purchase reason can become diluted.",
      "Returns, shipping thresholds, and product availability can affect conversion as much as brand positioning."
    ],
    recommendedActions: [
      "Use public product, shipping, and returns pages as sources when comparing e-commerce brands.",
      "Turn brand claims into buyer questions: comfort, care, sustainability, weather use, returns, and price confidence.",
      "Avoid reusing competitor images or product photography in public reports unless rights are clear.",
      "Add a conversion checklist so e-commerce users can compare their store against competitor trust signals."
    ],
    competitors: [
      {
        name: "Rothy's",
        url: "https://rothys.com/",
        summary:
          "Rothy's presents washable shoes and bags across women, men, and kids, with a strong lifestyle and product-range story.",
        strengths: ["Clear washability hook", "Broad product range", "Strong direct-to-consumer brand presentation"],
        watchouts: ["Public comparison should avoid copying product imagery", "Claims should be checked against current collection and policy pages"]
      },
      {
        name: "Vessi",
        url: "https://vessi.com/",
        summary:
          "Vessi leads with waterproof footwear, making weather utility a direct and easy-to-understand point of difference.",
        strengths: ["Simple waterproof positioning", "Clear use-case fit for wet-weather buyers", "Distinct functional promise"],
        watchouts: ["Waterproof claims need exact source wording", "Product availability and regional offers may change"]
      },
      {
        name: "Cariuma",
        url: "https://www.cariuma.com/",
        summary:
          "Cariuma is included as a known sustainable footwear competitor, but its public page availability should be checked before publishing a live comparison.",
        strengths: ["Recognizable sustainability-led footwear category fit", "Useful benchmark for brand narrative comparison"],
        watchouts: ["Page access may vary", "Do not infer current offers without accessible source pages"]
      }
    ],
    positioningAnalysis:
      "The e-commerce footwear market depends on fast comprehension. A shopper needs to know what makes the product different within seconds. Allbirds can be read as comfort plus natural materials, Rothy's as washable everyday style, Vessi as waterproof utility, and Cariuma as sustainability-led footwear. CompeteIQ should help merchants see which promise is clearest and which trust signals are missing from their own store.",
    pricingAnalysis:
      "For e-commerce reports, pricing should be treated as volatile. A safe report should capture public price visibility, sale messaging, shipping thresholds, returns language, and stock or final-sale caveats at the time of scraping rather than presenting static prices as durable facts.",
    sources: [
      { name: "Allbirds homepage", url: "https://www.allbirds.com/", note: "Target company positioning, product categories, materials and policy signals" },
      { name: "Rothy's homepage", url: "https://rothys.com/", note: "Competitor positioning and product-range signals" },
      { name: "Vessi homepage", url: "https://vessi.com/", note: "Competitor positioning and waterproof footwear signal" },
      { name: "Cariuma homepage", url: "https://www.cariuma.com/", note: "Competitor category inclusion; page availability should be rechecked before publication" }
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
      "Mailchimp positions around email, SMS, automations, AI tools, analytics, and integrations for e-commerce and small business users. The competitor set shows a market split between broad small-business marketing suites, B2C CRM depth, customer-experience automation, and larger CRM-platform ecosystems.",
    marketGaps: [
      "Marketing platforms often list many capabilities, but buyers still need to understand which tool fits their stage and data maturity.",
      "AI, SMS, automation, and analytics are now common claims, making proof, onboarding, and integrations more important.",
      "Small-business messaging can conflict with enterprise CRM language if the page tries to serve every buyer at once."
    ],
    recommendedActions: [
      "Use a use-case page to show how CompeteIQ separates feature overlap from positioning differences.",
      "Call out integration ecosystems, onboarding paths, and reporting visibility as separate comparison categories.",
      "Avoid ranking platforms unless the ranking criteria and sources are explicit.",
      "Make the final CTA practical: generate a report using the tools the user is actually comparing."
    ],
    competitors: [
      {
        name: "Klaviyo",
        url: "https://www.klaviyo.com/",
        summary:
          "Klaviyo positions around B2C CRM, email, SMS, customer data, and AI-assisted marketing for consumer brands.",
        strengths: ["Strong B2C and commerce fit", "Clear customer-data angle", "Focused email and SMS category relevance"],
        watchouts: ["May not map cleanly to every small-business use case", "Detailed plan and pricing claims should be rechecked"]
      },
      {
        name: "ActiveCampaign",
        url: "https://www.activecampaign.com/",
        summary:
          "ActiveCampaign emphasizes marketing automation for businesses, with CRM, email, automation, and customer experience workflows.",
        strengths: ["Automation-led positioning", "Broad business applicability", "CRM and lifecycle workflow relevance"],
        watchouts: ["Feature breadth can make differentiation harder", "Needs source-backed comparison by buyer type"]
      },
      {
        name: "HubSpot Marketing Hub",
        url: "https://www.hubspot.com/products/marketing",
        summary:
          "HubSpot Marketing Hub is part of a broader CRM platform and positions around AI-powered marketing software, campaigns, automation, and reporting.",
        strengths: ["Large platform ecosystem", "Strong CRM connection", "Clear fit for teams needing more than email"],
        watchouts: ["May be more platform-heavy than early small businesses need", "Comparison should separate Marketing Hub from the wider HubSpot suite"]
      }
    ],
    positioningAnalysis:
      "The marketing automation market is crowded because many vendors now claim email, SMS, AI, automations, analytics, and integrations. The difference is often the buyer: Mailchimp speaks strongly to small businesses and e-commerce, Klaviyo to consumer-brand customer data, ActiveCampaign to automation journeys, and HubSpot to CRM-connected marketing teams.",
    pricingAnalysis:
      "Marketing-platform pricing can depend on contacts, seats, message volume, billing term, and product bundle. A live CompeteIQ report should record whether pricing is public and explain the plan variables visible on the supplied pricing pages instead of treating one price as the whole cost.",
    sources: [
      { name: "Mailchimp homepage", url: "https://mailchimp.com/", note: "Target company positioning, solution categories and integration signals" },
      { name: "Klaviyo homepage", url: "https://www.klaviyo.com/", note: "Competitor positioning and product category signals" },
      { name: "ActiveCampaign homepage", url: "https://www.activecampaign.com/", note: "Competitor positioning and automation signals" },
      { name: "HubSpot Marketing Hub page", url: "https://www.hubspot.com/products/marketing", note: "Competitor positioning and CRM-platform context" }
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
