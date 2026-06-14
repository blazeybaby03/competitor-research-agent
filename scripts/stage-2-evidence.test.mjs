// Stage 2 — Evidence-Backed Reports: focused coverage for report source evidence.
//
// Two layers:
//   1. Behavioral — runs the real buildReportSources mapping (success/failure).
//   2. Structural — asserts the generate route persists sources and the report
//      UI renders the evidence section, failure state, and null fallback.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function read(file) {
  return readFileSync(file, "utf8");
}

// Transpile a single TS file and run it in an isolated VM context. Works for
// pure modules whose only imports are `import type` (erased during transpile).
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

// ─── Behavioral: buildReportSources mapping ──────────────────────────────────

test("buildReportSources maps a successful scrape to a completed source", () => {
  const { buildReportSources } = loadTypeScriptModule("lib/reportSources.ts");
  const scrapedAt = "2026-06-15T10:00:00.000Z";

  const sources = buildReportSources(
    [{ url: "https://a.com" }],
    [{ url: "https://a.com", success: true, rawContent: "x", cleanedText: "x", error: null }],
    scrapedAt
  );

  assert.equal(sources.length, 1);
  assert.equal(sources[0].url, "https://a.com");
  assert.equal(sources[0].status, "completed");
  assert.equal(sources[0].scraped_at, scrapedAt);
  assert.equal(sources[0].error, null);
});

test("buildReportSources maps a failed scrape to status failed, null timestamp, populated error", () => {
  const { buildReportSources } = loadTypeScriptModule("lib/reportSources.ts");

  const sources = buildReportSources(
    [{ url: "https://broken.com" }],
    [
      {
        url: "https://broken.com",
        success: false,
        rawContent: null,
        cleanedText: null,
        error: "ScraperAPI returned HTTP 500",
      },
    ],
    "2026-06-15T10:00:00.000Z"
  );

  assert.equal(sources[0].status, "failed");
  assert.equal(sources[0].scraped_at, null);
  assert.equal(sources[0].error, "ScraperAPI returned HTTP 500");
});

test("buildReportSources keeps order aligned and handles a mix of success and failure", () => {
  const { buildReportSources } = loadTypeScriptModule("lib/reportSources.ts");
  const scrapedAt = "2026-06-15T10:00:00.000Z";

  const sources = buildReportSources(
    [{ url: "https://one.com" }, { url: "https://two.com" }, { url: "https://three.com" }],
    [
      { success: true, error: null },
      { success: false, error: "timeout" },
      { success: true, error: null },
    ],
    scrapedAt
  );

  assert.deepEqual(
    sources.map((s) => s.url),
    ["https://one.com", "https://two.com", "https://three.com"]
  );
  assert.deepEqual(
    sources.map((s) => s.status),
    ["completed", "failed", "completed"]
  );
  assert.equal(sources[0].scraped_at, scrapedAt);
  assert.equal(sources[1].scraped_at, null);
  assert.equal(sources[1].error, "timeout");
  assert.equal(sources[2].scraped_at, scrapedAt);
});

// ─── Structural: generate route persists sources ─────────────────────────────

test("report runner builds report sources; route persists them on completion", () => {
  // The scrape -> sources -> AI core lives in lib/reportRunner (shared with the
  // scheduled cron). The user route persists the returned sources.
  const runner = read("lib/reportRunner.ts");
  const route = read("app/api/reports/generate/route.ts");

  assert.match(
    runner,
    /import { buildReportSources } from "@\/lib\/reportSources"/,
    "runner should import the source-evidence builder"
  );
  assert.match(
    runner,
    /const sources = buildReportSources\(validatedCompetitors, scrapeResults, scrapedAt\)/,
    "runner should build sources from validated competitors and scrape results"
  );
  // A single shared timestamp per run keeps scrape_jobs and sources consistent.
  assert.match(
    runner,
    /const scrapedAt = new Date\(\)\.toISOString\(\)/,
    "runner should capture one shared scrape timestamp"
  );

  // The route delegates generation to the shared runner...
  assert.match(
    route,
    /const { reportContent, sources } = await runReport\(/,
    "route should obtain reportContent + sources from the shared runner"
  );
  // ...and persists sources on the COMPLETED report update, just before updated_at.
  assert.match(
    route,
    /sources,\s*\n\s*updated_at: new Date\(\)\.toISOString\(\),/,
    "route should persist sources on the completed report update"
  );
});

// ─── Structural: ReportView renders the evidence section + states ────────────

test("ReportView renders the Sources analysed section with success and failure states", () => {
  const view = read("components/ReportView.tsx");

  assert.match(view, /Sources analysed/, "report view should render a Sources analysed heading");
  assert.match(view, /id="sources-analysed"/, "sources section should be anchor-linkable");
  assert.match(view, /This report was generated from/, "report view should render the evidence trust line");
  assert.match(view, /Scraped/, "report view should render the successful (Scraped) state");
  assert.match(view, /Failed/, "report view should render the failed badge state");
  assert.match(
    view,
    /Not used in this report/,
    "failed sources should be clearly marked as not used in the report"
  );
});

test("ReportView only renders the sources section when sources exist, with a null fallback", () => {
  const view = read("components/ReportView.tsx");

  // Sources section + trust line guarded by presence and length.
  assert.match(
    view,
    /sources && sources\.length > 0/,
    "evidence UI should be guarded by sources presence and length"
  );
  // Fallback provenance line for older reports where sources === null.
  assert.match(view, /\{!sources && \(/, "report view should guard the fallback provenance line on !sources");
  assert.match(
    view,
    /Generated from public competitor website content you provided/,
    "report view should keep a provenance line for reports without stored sources"
  );
});

test("ReportView includes source evidence in the plain-text copy/share export", () => {
  const view = read("components/ReportView.tsx");

  assert.match(view, /SOURCES ANALYSED/, "plain-text export should include a sources block");
  assert.match(view, /\[scraped\]/, "plain-text export should mark scraped sources");
  assert.match(view, /\[failed\]/, "plain-text export should mark failed sources");
});

// ─── Structural: migration adds the column ───────────────────────────────────

test("migration 008 adds the report sources column safely", () => {
  const migration = read("supabase/migrations/008_report_sources.sql");

  assert.match(migration, /alter table public\.reports/, "migration should alter the reports table");
  assert.match(
    migration,
    /add column if not exists sources jsonb/,
    "migration should add a nullable jsonb sources column, safe to re-run"
  );
});

// ─── Guardrails: Stage 2 scope boundaries stay intact ────────────────────────

test("Stage 2 does not add sentence-level citations or change the AI contract", () => {
  const ai = read("lib/ai.ts");

  // The AI report contract should not have grown citation fields in v1.
  assert.doesNotMatch(ai, /citation/i, "AI output contract should not introduce citations in Stage 2");
  // Core report fields remain the expected set (sanity check the contract is unchanged).
  assert.match(ai, /executiveSummary/, "AI contract should still produce an executive summary");
  assert.match(ai, /competitorSummaries/, "AI contract should still produce competitor summaries");
});
