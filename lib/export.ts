// Stage 5: helpers for client-ready report export. Pure + unit-testable.
//
// We export via the browser's print-to-PDF (no server-side PDF dependency).
// Browsers use document.title as the suggested PDF filename, so we build a
// clean, client-branded title for the saved file.

/** Build the document title (and thus suggested PDF filename) for an export. */
export function exportDocumentTitle(
  reportTitle: string,
  clientName?: string | null
): string {
  const base = (reportTitle ?? "").trim() || "Competitor Report";
  const client = clientName?.trim();
  return client ? `${client} — ${base}` : base;
}

/** Label shown on the cover page for who prepared the report. */
export function preparedByLabel(preparedBy?: string | null): string {
  const name = preparedBy?.trim();
  return name ? name : "CompeteIQ";
}
