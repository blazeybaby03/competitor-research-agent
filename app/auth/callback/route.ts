import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/dashboard";

function getSafeRedirectPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return DEFAULT_REDIRECT_PATH;
  }

  try {
    const parsed = new URL(rawNext, "https://app.local");
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_REDIRECT_PATH;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));

  // Behind Vercel's load balancer the request host can be the internal
  // forwarding host, so `origin` from request.url points at the wrong URL.
  // Honour x-forwarded-host in production so confirmation links resolve to the
  // real public domain. (Canonical Supabase SSR pattern.)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectBase =
    !isLocalEnv && forwardedHost ? `https://${forwardedHost}` : origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, redirectBase));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", redirectBase));
}
