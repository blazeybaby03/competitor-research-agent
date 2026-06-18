import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
