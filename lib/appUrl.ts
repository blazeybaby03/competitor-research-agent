const LOCAL_APP_URL = "http://localhost:3000";

export class AppUrlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppUrlConfigError";
  }
}

function getSupabaseHost() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  try {
    return new URL(supabaseUrl).host;
  } catch {
    return null;
  }
}

export function getAppBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const raw = configured?.trim() || (process.env.NODE_ENV === "development" ? LOCAL_APP_URL : "");

  if (!raw) {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL must be set for billing redirects.");
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
  }

  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL must use https outside local development.");
  }

  const supabaseHost = getSupabaseHost();
  if (supabaseHost && url.host === supabaseHost) {
    throw new AppUrlConfigError("NEXT_PUBLIC_APP_URL must be the app host, not the Supabase project URL.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "");
  url.search = "";
  url.hash = "";

  return url.toString().replace(/\/$/, "");
}
