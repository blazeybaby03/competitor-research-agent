import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppUrlConfigError, getAppBaseUrl } from "@/lib/appUrl";
import { getAllowedPriceIds, getPlanByStripePriceId } from "@/lib/plans";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
}

async function createStripeCustomer(
  stripe: Stripe,
  user: { id: string; email?: string | null }
) {
  return stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { supabase_user_id: user.id },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Server-side price ID whitelist — rejects unknown/arbitrary IDs
  const allowed = getAllowedPriceIds();
  if (allowed.size === 0) {
    console.error("No Stripe price IDs configured (STRIPE_STARTER_PRICE_ID / STRIPE_GROWTH_PRICE_ID)");
    return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  }
  if (!allowed.has(priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }
  const selectedPlan = getPlanByStripePriceId(priceId);

  // Read profile for existing customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;
  const stripe = getStripe();
  const adminSupabase = createAdminClient();

  if (!customerId) {
    const customer = await createStripeCustomer(stripe, user);
    customerId = customer.id;

    // Use service role — user update policy no longer covers billing fields
    const { error } = await adminSupabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
    if (error) console.error("Failed to persist stripe_customer_id:", error);
  } else {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error("Stripe customer was deleted");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown Stripe customer error";
      console.error("Stored Stripe customer is invalid; creating replacement:", message);

      const customer = await createStripeCustomer(stripe, user);
      customerId = customer.id;

      const { error } = await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
      if (error) console.error("Failed to persist replacement stripe_customer_id:", error);
    }
  }

  let appUrl: string;
  try {
    appUrl = getAppBaseUrl();
  } catch (err) {
    if (err instanceof AppUrlConfigError) {
      console.error("Billing redirect configuration error:", err.message);
      return NextResponse.json({ error: "Billing is not configured correctly" }, { status: 503 });
    }
    throw err;
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Propagate user ID to the Subscription object so the webhook can read it
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          selected_plan: selectedPlan ?? "unknown",
        },
      },
      success_url: `${appUrl}/billing?success=true`,
      cancel_url: `${appUrl}/billing?canceled=true`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown checkout error";
    console.error("Stripe checkout session create failed:", message);
    return NextResponse.json(
      { error: "Unable to start checkout. Please contact support." },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: session.url });
}
