import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const action = body.action;
  if (action !== "cancel" && action !== "resume") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return NextResponse.json(
      { error: "No subscription found for this account." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  try {
    // Cancel at period end (keeps access until the paid period ends) or undo
    // a scheduled cancellation. The subscription.updated webhook keeps our DB
    // in sync; final loss of access happens on subscription.deleted.
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: action === "cancel",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Subscription ${action} failed:`, message);
    return NextResponse.json(
      { error: "Unable to update your subscription. Please try again or contact support." },
      { status: 502 }
    );
  }
}
