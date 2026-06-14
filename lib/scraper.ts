// ScraperAPI integration -- get your key at scraperapi.com
//
// REDIRECT RISK NOTE: ScraperAPI may follow HTTP redirects internally before
// returning a response. If a validated URL redirects to an internal/private
// address (e.g. via a DNS rebinding attack or a server-side open redirect),
// ScraperAPI would follow that redirect outside of our validateUrl controls.
// Full mitigation would require a proxy-aware solution that validates the
// final destination after redirect resolution. For MVP this risk is accepted
// and documented here.

const RAW_CONTENT_CAP  = 500_000; // 500 KB raw HTML cap
const CLEAN_TEXT_CAP   = 8_000;   // 8 K chars sent to the AI

export interface ScrapeResult {
  url: string;
  success: boolean;
  rawContent: string | null;
  cleanedText: string | null;
  error: string | null;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const apiKey = process.env.SCRAPERAPI_KEY;
  if (!apiKey) {
    return failure(url, "SCRAPERAPI_KEY is not configured");
  }

  try {
    // Use HTTPS to avoid sending the API key over plain HTTP
    const apiUrl = new URL("https://api.scraperapi.com");
    apiUrl.searchParams.set("api_key", apiKey);
    apiUrl.searchParams.set("url", url);
    apiUrl.searchParams.set("render", "false");

    const response = await fetch(apiUrl.toString(), {
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      throw new Error(`ScraperAPI returned HTTP ${response.status}`);
    }

    const raw = await response.text();
    const rawContent  = raw.slice(0, RAW_CONTENT_CAP);
    const cleanedText = cleanHtml(rawContent);

    return { url, success: true, rawContent, cleanedText, error: null };
  } catch (err) {
    // Log only the URL origin + path -- strip query strings to avoid accidentally
    // logging tokens or secrets that may appear in query parameters.
    const safeUrl = (() => {
      try {
        const u = new URL(url);
        return `${u.origin}${u.pathname}`;
      } catch {
        return "[invalid url]";
      }
    })();
    const message = err instanceof Error ? err.message : "Unknown scrape error";
    console.error(`Scrape failed for ${safeUrl}: ${message}`);
    return failure(url, message);
  }
}

function failure(url: string, error: string): ScrapeResult {
  return { url, success: false, rawContent: null, cleanedText: null, error };
}

function cleanHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CLEAN_TEXT_CAP);
}
