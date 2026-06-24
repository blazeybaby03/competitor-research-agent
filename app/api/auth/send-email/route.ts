// Supabase "Send Email" auth hook receiver.
// Supabase Auth POSTs here whenever it needs to send an auth email (signup
// confirmation, magic link, password reset, etc.). We forward to Resend API
// so all auth emails share the same brand design system as the rest of the app.
//
// Setup in Supabase: Authentication → Hooks → Send Email → HTTP endpoint
// URL: https://competeiq.pro/api/auth/send-email
// Secret: paste the Supabase-generated secret into SUPABASE_HOOK_SECRET
//
// Auth hooks send: Authorization: Bearer {secret}
// (Database webhooks use HMAC — auth hooks use simple bearer comparison.)
import { NextResponse } from "next/server";
import { sendAuthEmail, schedulePostSignupNurtureSequence, type SupabaseEmailHookData } from "@/lib/email";

interface HookPayload {
  user: {
    id: string;
    email: string;
  };
  email_data: SupabaseEmailHookData;
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.SUPABASE_HOOK_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { user, email_data } = payload;
  if (!user?.email || !email_data?.email_action_type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    await sendAuthEmail(email_data.email_action_type, user.email, email_data);
    // Schedule post-signup nurture sequence for new accounts (starts Day 1 to
    // avoid competing with the confirmation email in the same inbox session).
    if (email_data.email_action_type === "signup") {
      schedulePostSignupNurtureSequence(user.email).catch((err) =>
        console.error("Post-signup nurture scheduling failed:", err)
      );
    }
  } catch (err) {
    console.error("Auth hook email send failed:", err);
    // Return 500 so Supabase retries rather than silently swallowing the error.
    return NextResponse.json({ error: "Email send failed" }, { status: 500 });
  }

  // Supabase expects an empty JSON object on success.
  return NextResponse.json({});
}
