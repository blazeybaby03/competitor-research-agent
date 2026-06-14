// Stage 4: toggle monthly scheduled re-runs for a business. Enabling is a paid
// feature; disabling is always allowed (so lapsed users can turn it off).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { businessId?: string; enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { businessId, enabled } = body;
  if (!businessId || typeof enabled !== "boolean") {
    return NextResponse.json(
      { error: "businessId and enabled are required" },
      { status: 400 }
    );
  }

  // Enabling requires an active paid subscription. Disabling is always allowed.
  if (enabled) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("subscription_status")
      .eq("id", user.id)
      .single();
    if (profile?.subscription_status !== "active") {
      return NextResponse.json(
        {
          error:
            "Scheduled monthly re-runs are a paid feature. Upgrade to Starter or Pro to enable them.",
        },
        { status: 403 }
      );
    }
  }

  // Ownership enforced by RLS and the explicit user_id filter. Select the
  // affected row so we can distinguish "updated" from "no such owned business".
  const { data: updated, error } = await supabase
    .from("businesses")
    .update({ rerun_enabled: enabled })
    .eq("id", businessId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    console.error("Schedule toggle error:", error);
    return NextResponse.json({ error: "Failed to update schedule." }, { status: 500 });
  }

  if (!updated || updated.length === 0) {
    // Missing or non-owned business — don't report success for a no-op.
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  return NextResponse.json({ rerunEnabled: enabled });
}
