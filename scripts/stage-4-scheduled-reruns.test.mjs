// Stage 4 — Scheduled Re-Runs and "What Changed": focused coverage.
//
//   1. Behavioral — isRerunDue, parseChangeSummary, snapshotFromContent.
//   2. Structural — cron auth/gating/last-run recording, paid-gated schedule
//      toggle, shared runner, and the report "what changed" UI.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function read(file) {
  return readFileSync(file, "utf8");
}

function loadTypeScriptModule(file) {
  const source = read(file);
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: file,
  }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(output, { exports: compiledModule.exports, module: compiledModule, URL });
  return compiledModule.exports;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Behavioral: isRerunDue ──────────────────────────────────────────────────

test("isRerunDue treats never-run and old runs as due, recent runs as not due", () => {
  const { isRerunDue } = loadTypeScriptModule("lib/schedule.ts");
  const now = 2_000_000_000_000;

  assert.equal(isRerunDue(null, now), true, "never run -> due");
  assert.equal(isRerunDue(undefined, now), true, "undefined -> due");
  assert.equal(
    isRerunDue(new Date(now - 31 * DAY_MS).toISOString(), now),
    true,
    "31 days old -> due"
  );
  assert.equal(
    isRerunDue(new Date(now - 5 * DAY_MS).toISOString(), now),
    false,
    "5 days old -> not due"
  );
  assert.equal(isRerunDue("not-a-date", now), true, "unparseable -> due");
});

// ─── Behavioral: parseChangeSummary + snapshotFromContent ────────────────────

test("parseChangeSummary parses summary + changes and caps the list", () => {
  const { parseChangeSummary } = loadTypeScriptModule("lib/changeSummary.ts");

  const raw = JSON.stringify({
    summary: "Pricing went up.",
    changes: ["Rival A raised prices", "", "Rival B added a free tier", "x", "y", "z", "too many"],
  });
  const out = parseChangeSummary(raw);
  assert.equal(out.summary, "Pricing went up.");
  assert.equal(out.changes.length, 6, "blank entries dropped and list capped at 6");
  assert.equal(out.changes[0], "Rival A raised prices");
});

test("parseChangeSummary tolerates missing fields and throws on no object", () => {
  const { parseChangeSummary } = loadTypeScriptModule("lib/changeSummary.ts");

  const out = parseChangeSummary('{"summary":"only summary"}');
  assert.equal(out.summary, "only summary");
  assert.deepEqual([...out.changes], [], "missing changes -> empty array");

  assert.throws(() => parseChangeSummary("no json object here"));
});

test("snapshotFromContent captures diffable fields and competitor URLs", () => {
  const { snapshotFromContent } = loadTypeScriptModule("lib/changeSummary.ts");

  const content = {
    title: "t",
    executiveSummary: "exec",
    competitorSummaries: [],
    positioningAnalysis: "pos",
    pricingAnalysis: "price",
    strengthsWeaknesses: [],
    marketGaps: ["gap1"],
    recommendedActions: [],
  };
  const sources = [
    { url: "https://a.com", status: "completed", scraped_at: "x", error: null },
    { url: "https://b.com", status: "failed", scraped_at: null, error: "e" },
  ];

  const snap = snapshotFromContent(content, sources);
  assert.equal(snap.executiveSummary, "exec");
  assert.equal(snap.pricingAnalysis, "price");
  assert.deepEqual([...snap.competitorUrls], ["https://a.com", "https://b.com"]);
});

// ─── Structural: migration 009 ───────────────────────────────────────────────

test("migration 009 adds scheduling + change-summary columns safely", () => {
  const migration = read("supabase/migrations/009_scheduled_reruns.sql");

  assert.match(migration, /add column if not exists rerun_enabled boolean not null default false/);
  assert.match(migration, /add column if not exists rerun_last_run_at timestamptz/);
  assert.match(migration, /add column if not exists rerun_last_status text/);
  assert.match(migration, /add column if not exists change_summary jsonb/);
  assert.match(migration, /add column if not exists run_type text not null default 'manual'/);
  assert.match(migration, /check \(run_type in \('manual', 'scheduled'\)\)/);
});

// ─── Structural: cron engine ─────────────────────────────────────────────────

test("scheduled re-run cron is secret-gated and fails closed", () => {
  const cron = read("app/api/cron/scheduled-reruns/route.ts");

  assert.match(cron, /process\.env\.CRON_SECRET/, "cron must read a shared secret");
  assert.match(cron, /if \(!secret\) return false/, "cron must fail closed when no secret is set");
  assert.match(cron, /`Bearer \$\{secret\}`/, "cron must check the Bearer token");
  assert.match(cron, /Unauthorized/, "cron must reject unauthorized callers");
});

test("scheduled re-run cron only runs due, paid businesses and records the outcome", () => {
  const cron = read("app/api/cron/scheduled-reruns/route.ts");

  assert.match(cron, /\.eq\("rerun_enabled", true\)/, "cron must only consider scheduling-enabled businesses");
  assert.match(cron, /isRerunDue\(/, "cron must filter to businesses that are due");
  assert.match(cron, /subscription_status === "active"/, "cron must restrict to paid (active) owners");
  assert.match(cron, /run_type: "scheduled"/, "scheduled reports must be marked as such");
  assert.match(cron, /await runReport\(/, "cron must reuse the shared report runner");
  assert.match(cron, /summarizeChanges\(/, "cron must compute a what-changed summary");
  assert.match(cron, /rerun_last_status: "success"/, "cron must record successful runs");
  assert.match(cron, /rerun_last_status: "failed"/, "cron must record failed runs (no silent failure)");

  // Scheduled runs must NOT touch the trial-credit system (that's the free path).
  assert.doesNotMatch(cron, /try_consume_trial_credit/, "cron must not consume trial credit");
});

test("scheduled re-run cron filters to active owners BEFORE applying the batch cap", () => {
  const cron = read("app/api/cron/scheduled-reruns/route.ts");

  // Active-owner filtering must happen first, then the cap on the filtered set —
  // otherwise lapsed/free businesses returned early could starve paid ones.
  assert.match(cron, /const dueActive = due\.filter\(/, "cron must filter to active owners");
  assert.match(cron, /dueActive\.slice\(0, MAX_BATCH\)/, "cron must cap the active-filtered set");
  assert.doesNotMatch(cron, /due\.slice/, "cron must NOT cap the raw due list before filtering active owners");

  const filterIndex = cron.indexOf("const dueActive = due.filter(");
  const capIndex = cron.indexOf("dueActive.slice(0, MAX_BATCH)");
  assert.ok(filterIndex > -1 && capIndex > -1 && filterIndex < capIndex, "filter must precede the cap");
});

// ─── Structural: schedule toggle route + UI ──────────────────────────────────

test("schedule toggle route is auth + ownership guarded and paid-gates enabling", () => {
  const route = read("app/api/business/schedule/route.ts");

  assert.match(route, /auth\.getUser\(\)/, "schedule route must require a user");
  assert.match(route, /Unauthorized/, "schedule route must reject logged-out users");
  // Enabling requires an active subscription; disabling is allowed.
  assert.match(route, /if \(enabled\) \{/, "schedule route must paid-gate only the enable path");
  assert.match(route, /subscription_status !== "active"/, "enabling must require an active subscription");
  assert.match(route, /status: 403/, "enabling without a paid plan must return 403");
  assert.match(route, /\.eq\("user_id", user\.id\)/, "schedule route must enforce ownership");
  assert.match(route, /rerun_enabled: enabled/, "schedule route must persist the toggle");

  // Must verify a row was actually updated — not report success for a no-op.
  assert.match(route, /\.select\("id"\)/, "schedule route must select the affected row");
  assert.match(route, /updated\.length === 0/, "schedule route must detect no-op updates");
  assert.match(route, /Business not found/, "schedule route must 404 on missing/non-owned business");
});

test("schedule toggle UI gates enabling but lets lapsed users disable an existing schedule", () => {
  const ui = read("components/ScheduleToggle.tsx");

  assert.match(ui, /isActive/, "toggle UI should branch on paid status");
  assert.match(ui, /Paid feature/, "non-paid users without a schedule should see a paid-feature lock");
  assert.match(ui, /fetch\("\/api\/business\/schedule"/, "toggle should call the schedule API");
  assert.match(ui, /Last re-run/, "toggle should surface the last run state");

  // Lapsed-but-enabled users keep the switch so they can turn it off.
  assert.match(ui, /const showSwitch = isActive \|\| enabled/, "switch should show when active OR currently enabled");
  // But they can't turn it back on without a paid plan.
  assert.match(ui, /if \(next && !isActive\)/, "enabling while not active must be blocked client-side");
});

// ─── Structural: report "what changed" UI + shared runner ────────────────────

test("report view renders the what-changed summary when present", () => {
  const view = read("components/ReportView.tsx");

  assert.match(view, /What changed since your last report/, "report view should render the what-changed section");
  assert.match(view, /report\.change_summary/, "report view should read change_summary");
});

test("manual generate route and cron share the report runner (no parallel paths)", () => {
  const generate = read("app/api/reports/generate/route.ts");
  const cron = read("app/api/cron/scheduled-reruns/route.ts");

  assert.match(generate, /from "@\/lib\/reportRunner"/, "manual route should use the shared runner");
  assert.match(cron, /from "@\/lib\/reportRunner"/, "cron should use the shared runner");
  // The scrape/AI core should no longer be inlined in the manual route.
  assert.doesNotMatch(generate, /generateCompetitorReport\(/, "manual route should not inline AI generation");
});
