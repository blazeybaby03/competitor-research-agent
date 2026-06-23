const baseUrl = (process.env.SCHEDULED_RERUN_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim();
const cronSecret = process.env.CRON_SECRET;

if (!baseUrl) {
  console.error("SCHEDULED_RERUN_URL or NEXT_PUBLIC_APP_URL must be set.");
  process.exit(1);
}

if (!cronSecret) {
  console.error("CRON_SECRET must be set.");
  process.exit(1);
}

const url = new URL(baseUrl);
if (url.pathname === "/" || url.pathname === "") {
  url.pathname = "/api/cron/scheduled-reruns";
}

const response = await fetch(url, {
  method: "POST",
  headers: {
    authorization: `Bearer ${cronSecret}`,
  },
});

const body = await response.text();
if (!response.ok) {
  console.error(`Scheduled rerun failed with HTTP ${response.status}: ${body}`);
  process.exit(1);
}

console.log(body);
