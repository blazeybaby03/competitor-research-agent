// Stage 3 — Suggest My Competitors: focused coverage for the suggestion flow.
//
// Two layers:
//   1. Behavioral — runs the real parseCompetitorSuggestions parser.
//   2. Structural — asserts the suggest route validates/dedupes/never saves,
//      and the business form keeps manual entry + requires confirmation.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function read(file) {
  return readFileSync(file, "utf8");
}

// Transpile + run a single TS file whose only imports are `import type`.
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

// ─── Behavioral: parseCompetitorSuggestions ──────────────────────────────────

test("parseCompetitorSuggestions parses a clean JSON array of suggestions", () => {
  const { parseCompetitorSuggestions } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  const raw = JSON.stringify([
    { name: "Rival A", url: "https://rival-a.com", reason: "Same market" },
    { name: "Rival B", url: "https://rival-b.com", reason: "Overlapping audience" },
  ]);

  const out = parseCompetitorSuggestions(raw);
  assert.equal(out.length, 2);
  assert.equal(out[0].name, "Rival A");
  assert.equal(out[0].url, "https://rival-a.com");
  assert.equal(out[0].reason, "Same market");
  assert.equal(out[1].url, "https://rival-b.com");
});

test("parseCompetitorSuggestions extracts the array even with surrounding text/markdown", () => {
  const { parseCompetitorSuggestions } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  const raw =
    'Here are some ideas:\n```json\n[{"name":"X","url":"https://x.com","reason":"r"}]\n```';
  const out = parseCompetitorSuggestions(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, "https://x.com");
});

test("parseCompetitorSuggestions drops entries without a usable url", () => {
  const { parseCompetitorSuggestions } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  const raw = JSON.stringify([
    { name: "No URL", reason: "missing url" },
    { name: "Has URL", url: "https://ok.com", reason: "fine" },
    { name: "Blank URL", url: "   ", reason: "blank" },
  ]);
  const out = parseCompetitorSuggestions(raw);
  assert.equal(out.length, 1);
  assert.equal(out[0].url, "https://ok.com");
});

test("parseCompetitorSuggestions caps the list at 5 suggestions", () => {
  const { parseCompetitorSuggestions } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  const raw = JSON.stringify(
    Array.from({ length: 9 }, (_, i) => ({
      name: `C${i}`,
      url: `https://c${i}.com`,
      reason: "r",
    }))
  );
  const out = parseCompetitorSuggestions(raw);
  assert.equal(out.length, 5);
});

test("parseCompetitorSuggestions throws on missing or non-array JSON", () => {
  const { parseCompetitorSuggestions } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  assert.throws(() => parseCompetitorSuggestions("no json here"));
  assert.throws(() => parseCompetitorSuggestions("[ not valid json ]"));
});

// ─── Behavioral: rate-limit decision logic ───────────────────────────────────

test("evaluateRateLimit allows hits under the limit and blocks at the limit", () => {
  const { evaluateRateLimit } = loadTypeScriptModule("lib/rateLimit.ts");
  const windowMs = 60 * 60 * 1000;
  const now = 1_000_000_000;

  // First hit on an empty bucket is allowed.
  const first = evaluateRateLimit([], 3, windowMs, now);
  assert.equal(first.allowed, true);
  assert.equal(first.kept.length, 1);

  // At the limit, the next hit is blocked and reports a retry delay.
  const atLimit = evaluateRateLimit([now - 10, now - 20, now - 30], 3, windowMs, now);
  assert.equal(atLimit.allowed, false);
  assert.equal(atLimit.remaining, 0);
  assert.ok(atLimit.retryAfterMs > 0, "blocked decision should report a positive retry delay");
});

test("evaluateRateLimit drops timestamps outside the window", () => {
  const { evaluateRateLimit } = loadTypeScriptModule("lib/rateLimit.ts");
  const windowMs = 60 * 60 * 1000;
  const now = 1_000_000_000;

  // Three old hits, all outside the window -> a new hit is allowed.
  const result = evaluateRateLimit(
    [now - windowMs - 1, now - windowMs - 2, now - windowMs - 3],
    3,
    windowMs,
    now
  );
  assert.equal(result.allowed, true);
  assert.equal(result.kept.length, 1, "expired timestamps should be pruned");
});

// ─── Behavioral: host dedupe ─────────────────────────────────────────────────

test("dedupeSuggestionsByHost collapses same-host URLs and drops the own site", () => {
  const { dedupeSuggestionsByHost } = loadTypeScriptModule("lib/competitorSuggestions.ts");

  const items = [
    { name: "Rival", url: "https://rival.com", reason: "a" },
    { name: "Rival pricing", url: "https://rival.com/pricing", reason: "b" }, // same host
    { name: "WWW rival", url: "https://www.rival.com/about", reason: "c" }, // same host (www-stripped)
    { name: "Other", url: "https://other.com", reason: "d" },
    { name: "Self", url: "https://mysite.com", reason: "e" }, // own site
  ];

  const out = dedupeSuggestionsByHost(items, "mysite.com", 5);
  // Rebuild in the test realm ([...out]) to avoid cross-VM-realm prototype
  // mismatches in deepStrictEqual.
  assert.deepEqual(
    [...out].map((s) => s.url),
    ["https://rival.com", "https://other.com"],
    "same-host duplicates collapse to the first, own site dropped"
  );
});

test("dedupeSuggestionsByHost caps the result", () => {
  const { dedupeSuggestionsByHost } = loadTypeScriptModule("lib/competitorSuggestions.ts");
  const items = Array.from({ length: 8 }, (_, i) => ({
    name: `C${i}`,
    url: `https://c${i}.com`,
    reason: "r",
  }));
  const out = dedupeSuggestionsByHost(items, null, 5);
  assert.equal(out.length, 5);
});

// ─── Structural: suggest route safeguards ────────────────────────────────────

test("suggest route requires auth and an industry, and never auto-saves or generates", () => {
  const route = read("app/api/competitors/suggest/route.ts");

  assert.match(route, /auth\.getUser\(\)/, "suggest route must require an authenticated user");
  assert.match(route, /Unauthorized/, "suggest route must reject logged-out users");
  assert.match(route, /Add your industry first/, "suggest route must require an industry");

  // Must reuse the SAME validation as manual competitor entry.
  assert.match(
    route,
    /import { validateCompetitorUrl } from "@\/lib\/validateUrl"/,
    "suggest route must reuse the shared URL validator"
  );
  assert.match(route, /validateCompetitorUrl\(s\.url\)/, "suggest route must validate each suggested URL");

  // Must dedupe by host and drop the user's own website.
  assert.match(route, /dedupeSuggestionsByHost\(validated, ownHost, MAX_RETURNED\)/, "suggest route must dedupe by host");
  assert.match(route, /const ownHost = normalizeHost\(websiteUrl\)/, "suggest route must compute the own-site host");

  // Must NOT persist anything or kick off a report.
  assert.doesNotMatch(route, /replace_competitors/, "suggest route must not save competitors");
  assert.doesNotMatch(route, /\.insert\(/, "suggest route must not insert rows");
  assert.doesNotMatch(route, /scrapeUrl/, "suggest route must not scrape");
  assert.doesNotMatch(route, /generateCompetitorReport/, "suggest route must not generate a report");

  assert.match(route, /suggestions\b/, "suggest route should return suggestions");
});

test("suggest route applies a per-user cost guard before the Anthropic call", () => {
  const route = read("app/api/competitors/suggest/route.ts");

  assert.match(route, /import { checkRateLimit } from "@\/lib\/rateLimit"/, "route should use the shared rate limiter");
  assert.match(route, /checkRateLimit\(`suggest:\$\{user\.id\}`/, "rate guard should be keyed per user");
  assert.match(route, /status: 429/, "rate guard should return a 429");

  // The guard MUST run before the (cost-incurring) AI suggestion call.
  const guardIndex = route.indexOf("checkRateLimit(");
  const aiCallIndex = route.indexOf("await suggestCompetitors(");
  assert.ok(guardIndex > -1 && aiCallIndex > -1, "route should contain both the guard and the AI call");
  assert.ok(guardIndex < aiCallIndex, "rate guard must run before the Anthropic suggestion call");
});

// ─── Structural: business form keeps manual entry + requires confirmation ────

test("business form offers suggestions without removing manual entry", () => {
  const form = read("components/BusinessForm.tsx");

  // Suggest affordance calls the suggest API.
  assert.match(form, /Suggest competitors/, "form should offer a Suggest competitors action");
  assert.match(
    form,
    /fetch\("\/api\/competitors\/suggest"/,
    "form should call the suggest API"
  );

  // Manual competitor inputs and add/remove still exist.
  assert.match(form, /updateCompetitor\(i, e\.target\.value\)/, "manual competitor inputs must remain");
  assert.match(form, /Add competitor/, "manual add-competitor must remain");
});

test("business form requires confirmation before suggestions become inputs and is never auto-saved", () => {
  const form = read("components/BusinessForm.tsx");

  // Confirmation step.
  assert.match(form, /addSelectedSuggestions/, "form should require an explicit add-selected confirmation");
  assert.match(form, /Add selected/, "form should render an Add selected control");
  assert.match(form, /toggleSuggestion/, "form should let users select/deselect suggestions");

  // Suggestions are clearly labelled as not verified.
  assert.match(
    form,
    /not verified competitors/,
    "form should label suggestions as AI suggestions, not verified competitors"
  );

  // Adding suggestions must NOT auto-submit — handleSave is only wired to the form submit.
  assert.doesNotMatch(
    form,
    /addSelectedSuggestions[\s\S]{0,400}handleSave\(/,
    "adding suggestions must not trigger a save"
  );
});

// ─── Structural: AI report contract still untouched ──────────────────────────

test("Stage 3 keeps the report-generation AI contract separate and unchanged", () => {
  const suggest = read("lib/suggestCompetitors.ts");
  const ai = read("lib/ai.ts");

  // Suggestion logic lives in its own module, not in lib/ai.ts.
  assert.match(suggest, /parseCompetitorSuggestions/, "suggest module should use the dedicated parser");
  assert.doesNotMatch(ai, /suggestCompetitors/, "lib/ai.ts must not take on suggestion logic");
});
