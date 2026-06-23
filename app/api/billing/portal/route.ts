import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AppUrlConfigError, getAppBaseUrl } from "@/lib/appUrl";
import Stripe from "stripe";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (error || !profile?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No Stripe customer found for this account" },
      { status: 400 }
    );
  }

  let appUrl: string;
  try {
    appUrl = getAppBaseUrl();
  } catch (err) {
    if (err instanceof AppUrlConfigError) {
      console.error("Billing portal redirect configuration error:", err.message);
      return NextResponse.json({ error: "Billing portal is not configured correctly" }, { status: 503 });
    }
    throw err;
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create billing portal session";
    console.error("Billing portal error:", message);
    return NextResponse.json(
      { error: "Billing portal is not available. Please contact support." },
      { status: 503 }
    );
  }
}
