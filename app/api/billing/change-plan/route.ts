import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllowedPriceIds } from "@/lib/plans";
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

  let body: { priceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { priceId } = body;
  if (!priceId) {
    return NextResponse.json({ error: "priceId is required" }, { status: 400 });
  }

  // Never trust a client-supplied price ID — only allow configured plan prices.
  if (!getAllowedPriceIds().has(priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_subscription_id, subscription_status")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_subscription_id || profile.subscription_status !== "active") {
    return NextResponse.json(
      { error: "No active subscription to change." },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  try {
    const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const item = sub.items.data[0];
    if (!item) {
      throw new Error("Subscription has no items");
    }
    if (item.price.id === priceId) {
      return NextResponse.json({ error: "You are already on this plan." }, { status: 400 });
    }

    // Swap the subscription item's price. Prorations charge/credit the
    // difference immediately so upgrades and downgrades are fair.
    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [{ id: item.id, price: priceId }],
      proration_behavior: "create_prorations",
      payment_behavior: "allow_incomplete",
    });

    // The customer.subscription.updated webhook syncs the stored plan.
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Change plan failed:", message);
    return NextResponse.json(
      { error: "Unable to change plan. Please try again or contact support." },
      { status: 502 }
    );
  }
}
