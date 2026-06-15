import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const requiredFiles = [
  "app/page.tsx",
  "app/(auth)/login/page.tsx",
  "app/(auth)/signup/page.tsx",
  "app/auth/callback/route.ts",
  "app/(dashboard)/dashboard/page.tsx",
  "app/(dashboard)/billing/page.tsx",
  "app/api/business/save/route.ts",
  "app/api/reports/generate/route.ts",
  "app/api/billing/checkout/route.ts",
  "app/api/billing/portal/route.ts",
  "app/api/billing/webhook/route.ts",
  "lib/ai.ts",
  "lib/scraper.ts",
  "lib/validateUrl.ts",
  "proxy.ts",
  ".env.example",
];

const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_GROWTH_PRICE_ID",
  "REPORT_LIMIT_STARTER",
  "REPORT_LIMIT_PRO",
  "COMPETITOR_LIMIT_FREE",
  "COMPETITOR_LIMIT_STARTER",
  "COMPETITOR_LIMIT_PRO",
  "SCRAPERAPI_KEY",
  "ANTHROPIC_API_KEY",
  "AI_MODEL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPPORT_EMAIL",
];

function read(file) {
  return readFileSync(file, "utf8");
}

function loadTypeScriptModule(file) {
  const source = read(file);
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
  }).outputText;

  const compiledModule = { exports: {} };
  vm.runInNewContext(output, {
    exports: compiledModule.exports,
    module: compiledModule,
    URL,
  });
  return compiledModule.exports;
}

test("launch-critical files exist", () => {
  for (const file of requiredFiles) {
    assert.equal(existsSync(file), true, `${file} is missing`);
  }
});

test("env example documents all launch-critical variables", () => {
  const envExample = read(".env.example");

  for (const key of requiredEnvKeys) {
    assert.match(envExample, new RegExp(`(^|\\n)${key}=`), `${key} is missing from .env.example`);
  }
});

test("public and auth pages keep launch-critical render paths", () => {
  const home = read("app/page.tsx");
  const login = read("app/(auth)/login/page.tsx");
  const signup = read("app/(auth)/signup/page.tsx");

  assert.match(home, /CompeteIQ/, "homepage should render the product name");
  assert.match(home, /href="\/login"/, "homepage should link to login");
  assert.match(home, /href="\/signup"/, "homepage should link to signup");

  assert.match(login, /signInWithPassword/, "login page should submit through Supabase password auth");
  assert.match(login, /router\.push\(\s*next && next\.startsWith\("\/"\) \? next : "\/dashboard"\s*\)/, "login success should resume a safe local next path or default to dashboard");
  assert.match(login, /href="\/signup"/, "login page should link to signup");
  assert.match(login, /auth_failed/, "login page should show failed auth callback errors");

  assert.match(signup, /auth\.signUp/, "signup page should submit through Supabase signup");
  assert.match(signup, /emailRedirectTo:\s*`\$\{window\.location\.origin\}\/auth\/callback`/, "signup should use the auth callback redirect");
  assert.match(signup, /Check your email/, "signup should render the email-confirmation state");
});

test("auth callback exchanges codes and only redirects to local app paths", () => {
  const callback = read("app/auth/callback/route.ts");

  assert.match(callback, /exchangeCodeForSession\(code\)/, "auth callback should exchange Supabase codes server-side");
  assert.match(callback, /getSafeRedirectPath/, "auth callback should sanitize the next path");
  assert.match(callback, /rawNext\.startsWith\("\/\/"\)/, "auth callback should reject protocol-relative redirects");
  assert.match(callback, /new URL\(next, origin\)/, "auth callback should resolve redirects against the current origin");
  assert.doesNotMatch(callback, /redirect\(`\$\{origin\}\$\{next\}`\)/, "auth callback should not concatenate raw next values into redirect URLs");
  assert.match(callback, /login\?error=auth_failed/, "auth callback should return users to login on failed confirmation");
});

test("auth middleware and dashboard layout protect app routes", () => {
  const middleware = read("lib/supabase/middleware.ts");
  const dashboardLayout = read("app/(dashboard)/layout.tsx");

  assert.match(middleware, /protectedPaths\s*=\s*\["\/dashboard",\s*"\/reports"\]/, "middleware should protect dashboard and reports");
  assert.match(middleware, /url\.pathname\s*=\s*"\/login"/, "unauthenticated protected-route visitors should be redirected to login");
  assert.match(middleware, /authPaths\s*=\s*\["\/login",\s*"\/signup"\]/, "middleware should recognize auth pages");
  assert.match(middleware, /url\.pathname\s*=\s*"\/dashboard"/, "authenticated auth-page visitors should be redirected to dashboard");
  assert.match(dashboardLayout, /if \(!user\) redirect\("\/login"\)/, "dashboard layout should also enforce server-side auth");
});

test("dashboard, reports, billing, and upgrade prompt render expected flow states", () => {
  const dashboard = read("app/(dashboard)/dashboard/page.tsx");
  const reports = read("app/(dashboard)/reports/page.tsx");
  const reportDetail = read("app/(dashboard)/reports/[id]/page.tsx");
  const billing = read("app/(dashboard)/billing/page.tsx");
  const upgradePrompt = read("components/UpgradePrompt.tsx");

  assert.match(dashboard, /BusinessForm/, "dashboard should render business setup");
  assert.match(dashboard, /GenerateReportButton/, "dashboard should render the report generation CTA");
  assert.match(dashboard, /profile\?\.subscription_status === "active"/, "dashboard should allow active subscribers to generate");
  assert.match(dashboard, /resolvePlan/, "dashboard should resolve the current plan server-side");
  assert.match(dashboard, /\(profile\?\.trial_reports_used \?\? 0\) < 1/, "dashboard should allow one trial report");
  assert.match(dashboard, /<UpgradePrompt \/>/, "dashboard should show upgrade prompt after trial use");

  assert.match(reports, /\.eq\("user_id", user!\.id\)/, "reports list should query only the current user's reports");
  assert.match(reports, /No reports yet/, "reports page should render an empty state");
  assert.match(reportDetail, /\.eq\("id", id\)/, "report detail should filter by report ID");
  assert.match(reportDetail, /\.eq\("user_id", user!\.id\)/, "report detail should filter by current user");
  assert.match(reportDetail, /notFound\(\)/, "report detail should 404 missing or non-owned reports");
  assert.match(reportDetail, /<ReportView/, "report detail should render completed report content");

  assert.match(billing, /STRIPE_STARTER_PRICE_ID/, "billing page should support the configured Starter price ID");
  assert.match(billing, /STRIPE_GROWTH_PRICE_ID/, "billing page should use the configured Pro price ID");
  assert.match(billing, /CheckoutButton/, "billing page should render checkout for non-active users");
  assert.match(billing, /activePlan\.name/, "billing page should render the active plan state");
  assert.match(upgradePrompt, /used your free report/i, "upgrade prompt should explain the trial limit state");
  assert.match(upgradePrompt, /href="\/billing"/, "upgrade prompt should route users to billing");
});

test("business save route keeps validation, ownership, and atomic competitor replacement", () => {
  const route = read("app/api/business/save/route.ts");
  const validationIndex = route.indexOf("validateCompetitorUrls(nonEmpty)");
  // Match the insert regardless of line endings / indentation (avoids CRLF brittleness).
  const insertMatch = route.match(/\.from\("businesses"\)\s*\.insert/);
  const insertIndex = insertMatch ? insertMatch.index : -1;

  assert.match(route, /supabase\.auth\.getUser\(\)/, "business save should require a Supabase user");
  assert.match(route, /Unauthorized/, "business save should reject logged-out users");
  assert.match(route, /Business name and industry are required/, "business save should reject missing core fields");
  assert.match(route, /MAX_NAME_LEN = 100/, "business save should cap business name length");
  assert.match(route, /MAX_URL_LEN = 2048/, "business save should cap URL length");
  assert.ok(validationIndex > -1, "business save should validate competitor URLs server-side");
  assert.ok(insertIndex > -1, "business save should create businesses");
  assert.ok(validationIndex < insertIndex, "business save should validate competitor URLs before creating a business");
  assert.match(route, /\.eq\("user_id", user\.id\)/, "business updates should verify ownership");
  assert.match(route, /rpc\("replace_competitors"/, "business save should replace competitors through the atomic RPC");
});

test("report generation route keeps launch-critical failure and billing safeguards", () => {
  const reportRoute = read("app/api/reports/generate/route.ts");

  assert.match(reportRoute, /businessId is required/, "report generation should reject missing business IDs");
  assert.match(reportRoute, /\.eq\("user_id", user\.id\)/, "report generation should reject non-owned businesses");
  assert.match(reportRoute, /Add at least one competitor URL/, "report generation should reject zero competitors");
  assert.match(reportRoute, /planConfig\.competitorLimit/, "report generation should reject competitors above the current plan cap");
  assert.match(reportRoute, /Too many requests/, "report generation should rate limit excessive generation");
  assert.match(reportRoute, /status: "generating"/, "report generation should create a report row before expensive work");
  assert.match(reportRoute, /try_consume_trial_credit/, "report generation must consume trial credit atomically");
  assert.match(reportRoute, /Trial limit reached/, "report generation should return an upgrade-safe trial-limit error");
  assert.match(reportRoute, /validateCompetitorUrl\(c\.url\)/, "report generation should revalidate competitor URLs before scraping");
  // Scrape + AI core moved to lib/reportRunner (shared with the scheduled cron).
  assert.match(reportRoute, /await runReport\(/, "report generation should delegate scrape+AI to the shared runner");
  const runner = read("lib/reportRunner.ts");
  assert.match(runner, /Promise\.all\(validatedCompetitors\.map\(\(c\) => scrapeUrl\(c\.url\)\)\)/, "runner should scrape validated URLs");
  assert.match(runner, /AI returned incomplete report content/, "runner should reject incomplete AI output");
  assert.match(reportRoute, /status: "failed"/, "report generation should mark failed reports");
  assert.match(reportRoute, /restore_trial_credit/, "report generation must restore trial credit on scrape or AI failure");
  assert.match(reportRoute, /status: "completed"/, "report generation should save completed reports only after content checks");
});

test("Stripe checkout route keeps server-side price allowlisting", () => {
  const checkoutRoute = read("app/api/billing/checkout/route.ts");

  assert.match(checkoutRoute, /getAllowedPriceIds/, "checkout route must expose allowed price ID helper");
  assert.match(checkoutRoute, /allowed\.has\(priceId\)/, "checkout route must reject non-allowlisted price IDs");
  assert.match(checkoutRoute, /mode:\s*"subscription"/, "checkout route must create subscription checkout sessions");
  assert.match(checkoutRoute, /getPlanByStripePriceId/, "checkout route should derive selected plan from the allowlisted Stripe price ID");
});

test("Stripe webhook route keeps signature verification", () => {
  const webhookRoute = read("app/api/billing/webhook/route.ts");

  assert.match(webhookRoute, /stripe-signature/, "webhook route must read the Stripe signature header");
  assert.match(webhookRoute, /constructEvent/, "webhook route must verify Stripe webhook signatures");
  assert.match(webhookRoute, /getSubscriptionPriceId/, "webhook route must read the subscription item price ID");
  assert.match(webhookRoute, /getPlanByStripePriceId/, "webhook route must map subscription price IDs to plans server-side");
  assert.match(webhookRoute, /customer\.subscription\.created/, "webhook route must handle subscription creation");
  assert.match(webhookRoute, /customer\.subscription\.updated/, "webhook route must handle subscription updates");
  assert.match(webhookRoute, /customer\.subscription\.deleted/, "webhook route must handle subscription deletion");
  assert.match(webhookRoute, /findUserIdForSubscription/, "webhook route must resolve subscriptions to Supabase users");
  assert.match(webhookRoute, /stripe_customer_id/, "webhook route must fall back to the stored Stripe customer ID when metadata is missing");
});

test("Stripe billing portal route stays authenticated and server-side", () => {
  const portalRoute = readFileSync("app/api/billing/portal/route.ts", "utf8");

  assert.match(portalRoute, /auth\.getUser/, "billing portal route must require an authenticated user");
  assert.match(portalRoute, /stripe_customer_id/, "billing portal route must use the persisted Stripe customer ID");
  assert.match(portalRoute, /billingPortal\.sessions\.create/, "billing portal route must create Stripe portal sessions server-side");
});

test("report generation route keeps trial-credit recovery protections", () => {
  const reportRoute = read("app/api/reports/generate/route.ts");

  assert.match(reportRoute, /try_consume_trial_credit/, "report generation must consume trial credit atomically");
  assert.match(reportRoute, /restore_trial_credit/, "report generation must restore trial credit on failure");
  assert.match(reportRoute, /validateCompetitorUrl/, "report generation must revalidate competitor URLs server-side");
  assert.match(reportRoute, /RATE_LIMIT_PER_HOUR/, "report generation must retain rate limiting");
  assert.match(reportRoute, /resolvePlan/, "report generation must derive the current plan server-side");
});

test("plan-based access keeps server-side pricing, quotas, and profile schema", () => {
  const plans = read("lib/plans.ts");
  const migration = read("supabase/migrations/006_plan_based_access.sql");
  const webhookRoute = read("app/api/billing/webhook/route.ts");
  const reportRoute = read("app/api/reports/generate/route.ts");

  assert.match(plans, /starter/, "plan config should define Starter");
  assert.match(plans, /REPORT_LIMIT_STARTER/, "Starter report limit should be configurable");
  assert.match(plans, /REPORT_LIMIT_PRO/, "Pro report limit should be configurable");
  assert.match(plans, /COMPETITOR_LIMIT_FREE/, "Free competitor cap should be configurable");
  assert.match(plans, /COMPETITOR_LIMIT_STARTER/, "Starter competitor cap should be configurable");
  assert.match(plans, /COMPETITOR_LIMIT_PRO/, "Pro competitor cap should be configurable");
  assert.match(plans, /getAllowedPriceIds/, "allowed Stripe price IDs should come from server config");

  assert.match(migration, /add column if not exists plan/, "profiles should gain a plan field");
  assert.match(migration, /check \(plan in \('free', 'starter', 'pro'\)\)/, "plan values should be constrained");
  assert.match(migration, /subscription_status = 'active'/, "existing active subscribers should be preserved as Pro");
  assert.doesNotMatch(migration, /for update[\s\S]*auth\.uid\(\) = id/, "migration must not restore user profile updates");

  assert.match(webhookRoute, /profileUpdate\.plan = plan/, "webhook should persist the mapped active plan");
  assert.match(webhookRoute, /profileUpdate\.plan = "free"/, "inactive subscriptions should revert plan access to Free");
  assert.match(reportRoute, /planConfig\.reportLimit/, "report quota should come from the current plan");
  assert.match(reportRoute, /planConfig\.competitorLimit/, "competitor cap should come from the current plan");
});

test("URL validation keeps internal network protections", () => {
  const validateUrl = read("lib/validateUrl.ts");

  assert.match(validateUrl, /localhost/, "URL validator must reject localhost");
  assert.match(validateUrl, /PRIVATE_IPV4_PATTERNS/, "URL validator must keep private IPv4 checks");
  assert.match(validateUrl, /PRIVATE_IPV6_PATTERNS/, "URL validator must keep private IPv6 checks");
  assert.match(validateUrl, /embedded credentials/, "URL validator must reject embedded credentials");
});

test("URL validation rejects private targets and accepts normal competitor URLs", () => {
  const { validateCompetitorUrl, validateCompetitorUrls } = loadTypeScriptModule("lib/validateUrl.ts");

  const rejectedUrls = [
    "http://localhost",
    "http://localhost.",
    "http://127.0.0.1",
    "http://127.1",
    "http://0.0.0.0",
    "http://10.0.0.1",
    "http://172.16.0.1",
    "http://172.31.255.255",
    "http://192.168.1.1",
    "http://169.254.169.254",
    "http://[::1]",
    "http://[::ffff:7f00:1]",
    "http://0177.0.0.1",
    "http://user:pass@example.com",
    "ftp://example.com",
    "http://intranet",
  ];

  for (const url of rejectedUrls) {
    const result = validateCompetitorUrl(url);
    assert.equal(result.valid, false, `${url} should be rejected`);
  }

  const normalUrl = validateCompetitorUrl("https://example.com/pricing?plan=pro");
  assert.equal(normalUrl.valid, true);
  assert.equal(normalUrl.normalized, "https://example.com/pricing?plan=pro");

  const fiveOrFewer = validateCompetitorUrls([
    "https://competitor-one.com",
    "https://competitor-two.com/path/",
  ]);
  assert.equal(fiveOrFewer.valid, true);
  assert.deepEqual([...fiveOrFewer.normalized], ["https://competitor-one.com", "https://competitor-two.com/path"]);

  const tooMany = validateCompetitorUrls([
    "https://one.com",
    "https://two.com",
    "https://three.com",
    "https://four.com",
    "https://five.com",
    "https://six.com",
  ]);
  assert.equal(tooMany.valid, false);
  assert.equal(tooMany.error, "Provide between 1 and 5 competitor URLs");
});

test("AI report generation keeps prompt-injection warning for scraped content", () => {
  const ai = read("lib/ai.ts");

  assert.match(ai, /SECURITY NOTICE/, "AI prompt must retain scraped-content security notice");
  assert.match(ai, /UNTRUSTED external input/, "AI prompt must treat scraped content as untrusted input");
  assert.match(ai, /raw JSON only/, "AI prompt must request raw JSON output");
  assert.match(ai, /claude-haiku-4-5-20251001/, "AI default model should be a currently accessible Anthropic model");
  assert.doesNotMatch(ai, /claude-sonnet-4-20250514/, "AI default model should not use the deprecated unavailable Sonnet 4 model");
});

test("pricing uses Starter and Pro tiers and backend enforces plan-based quota", () => {
  const home = read("app/page.tsx");
  const billing = read("app/(dashboard)/billing/page.tsx");
  const upgradePrompt = read("components/UpgradePrompt.tsx");
  const generateButton = read("components/GenerateReportButton.tsx");
  const generateRoute = read("app/api/reports/generate/route.ts");

  // Launch-facing UI surfaces retain Pro and add Starter
  assert.match(home, /A\$39/, "homepage pricing must show Starter at A$39");
  assert.match(home, /A\$159/, "homepage pricing must show A$159");
  assert.match(billing, /priceLabel/, "billing page must render configured plan price labels");
  assert.match(upgradePrompt, /priceLabel/, "upgrade prompt should use configured plan price labels");

  // No old $79 price in launch-facing UI
  assert.doesNotMatch(home, /\$79[^0-9]/, "homepage must not show old $79 price");
  assert.doesNotMatch(billing, /\$79[^0-9]/, "billing page must not show old $79 price");
  assert.doesNotMatch(upgradePrompt, /\$79[^0-9]/, "upgrade prompt must not show old $79 price");

  // UI communicates 100 reports per 30 days, not unlimited
  assert.match(home, /10 competitor reports per 30 days/, "homepage must state 10 Starter reports per 30 days");
  assert.match(home, /100 competitor reports per 30 days/, "homepage must state 100 reports per 30 days");
  assert.match(billing, /reportLimit/, "billing page must state plan report limits from server config");
  for (const [label, source] of [
    ["homepage", home],
    ["billing page", billing],
    ["upgrade prompt", upgradePrompt],
    ["generate report button", generateButton],
  ]) {
    assert.doesNotMatch(source, /[Uu]nlimited/, `${label} must not promise unlimited usage`);
  }

  // Backend enforces rolling 30-day quota by plan
  assert.match(generateRoute, /PLANS\[plan\]\.reportLimit/, "report route must use the plan quota");
  assert.match(generateRoute, /thirtyDaysAgo/, "report route must enforce a rolling 30-day window");
  assert.match(generateRoute, /planConfig\.reportLimit/, "report route must return a plan-specific quota-exceeded error");
  assert.match(generateRoute, /isMonthlyQuotaExceeded/, "report route must call the monthly quota check function");
});
