import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Never expose to the browser.
export function createAdminClient() {
  return createClient(
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
