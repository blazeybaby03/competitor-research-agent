// Stage 5 — Agency / Consultant export: client-ready PDF export coverage.
//
//   1. Behavioral — exportDocumentTitle / preparedByLabel.
//   2. Structural — export gating, white-label cover page, print CSS, and that
//      the report's source evidence is part of the printable output.
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

// ─── Behavioral: export helpers ──────────────────────────────────────────────

test("exportDocumentTitle prefixes the client name when provided", () => {
  const { exportDocumentTitle } = loadTypeScriptModule("lib/export.ts");

  assert.equal(exportDocumentTitle("Report for Acme", "Globex"), "Globex — Report for Acme");
  assert.equal(exportDocumentTitle("Report for Acme", ""), "Report for Acme");
  assert.equal(exportDocumentTitle("Report for Acme", null), "Report for Acme");
  assert.equal(exportDocumentTitle("Report for Acme", "  "), "Report for Acme");
});

test("exportDocumentTitle falls back to a default for an empty report title", () => {
  const { exportDocumentTitle } = loadTypeScriptModule("lib/export.ts");
  assert.equal(exportDocumentTitle("", null), "Competitor Report");
  assert.equal(exportDocumentTitle("   ", "Acme"), "Acme — Competitor Report");
});

test("preparedByLabel falls back to CompeteIQ when blank", () => {
  const { preparedByLabel } = loadTypeScriptModule("lib/export.ts");
  assert.equal(preparedByLabel("Jane Consulting"), "Jane Consulting");
  assert.equal(preparedByLabel(""), "CompeteIQ");
  assert.equal(preparedByLabel(null), "CompeteIQ");
  assert.equal(preparedByLabel("  "), "CompeteIQ");
});

// ─── Structural: report view export gating + cover page ──────────────────────

test("report view gates PDF export behind a paid plan", () => {
  const view = read("components/ReportView.tsx");

  assert.match(view, /isActive/, "report view should branch on paid status");
  // Active users get a working export button; free users get a billing link.
  assert.match(view, /onClick=\{handleExport\}/, "paid users should get a working export action");
  assert.match(view, /href="\/billing"/, "free users should be routed to billing for export");
  assert.match(view, /window\.print\(\)/, "export should use the browser print-to-PDF path");
});

test("report view builds a white-label cover page shown only in print", () => {
  const view = read("components/ReportView.tsx");

  assert.match(view, /print-only report-cover/, "cover page must be print-only");
  assert.match(view, /Prepared for/, "cover page should support a client name");
  assert.match(view, /preparedByLabel\(preparedBy\)/, "cover page should show who prepared it");
  assert.match(view, /exportDocumentTitle\(report\.title, clientName\)/, "export should set a client-branded document title");
  // Prepared-by is remembered locally for repeat use.
  assert.match(view, /localStorage/, "prepared-by should persist locally");
});

test("report view keeps source evidence in the printable output, hides chrome", () => {
  const view = read("components/ReportView.tsx");

  // The Sources analysed section is NOT marked no-print, so it prints with the report.
  assert.match(view, /Sources analysed/, "sources section should exist (and print with the report)");
  // Interactive chrome is excluded from print.
  assert.match(view, /no-print/, "report view should mark non-printable chrome");
});

// ─── Structural: print CSS + nav ─────────────────────────────────────────────

test("global styles define print rules for export", () => {
  const css = read("app/globals.css");

  assert.match(css, /@media print/, "global CSS should define print rules");
  assert.match(css, /\.no-print\s*\{[\s\S]*display:\s*none/, "no-print should hide in print");
  assert.match(css, /\.print-only/, "print-only should be defined");
  assert.match(css, /\.report-cover\s*\{[\s\S]*break-after:\s*page/, "cover page should break to its own page");
});

test("dashboard nav is excluded from the printed report", () => {
  const nav = read("components/DashboardNav.tsx");
  assert.match(nav, /no-print/, "dashboard nav should not appear in the printed PDF");
});

// ─── Structural: report detail passes paid status ────────────────────────────

test("report detail page passes paid status into the report view", () => {
  const page = read("app/(dashboard)/reports/[id]/page.tsx");
  assert.match(page, /isActive = .*subscription_status === "active"/, "page should derive paid status");
  assert.match(page, /<ReportView report=\{report as Report\} isActive=\{isActive\}/, "page should pass isActive to the report view");
});
