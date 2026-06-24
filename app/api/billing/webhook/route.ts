import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlanByStripePriceId, PLANS } from "@/lib/plans";
import { sendWelcomeEmail, scheduleOnboardingSequence, scheduleCancellationSequence } from "@/lib/email";
import Stripe from "stripe";

// Stripe statuses that grant full access
const ACTIVE_STATUSES = new Set(["active", "trialing"]);

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

async function findUserIdForSubscription(
  adminSupabase: ReturnType<typeof createAdminClient>,
  sub: Stripe.Subscription
): Promise<string | null> {
  const metadataUserId = sub.metadata?.supabase_user_id;
  if (metadataUserId) return metadataUserId;

  const customerId = getCustomerId(sub.customer);
  if (!customerId) return null;

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (error) {
    console.error(`Failed to resolve profile for Stripe customer ${customerId}:`, error);
    return null;
  }

  return data?.id ?? null;
}

function getSubscriptionPriceId(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id ?? null;
}

export async function POST(request: Request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await findUserIdForSubscription(adminSupabase, sub);
      if (!userId) {
        console.warn(`Subscription ${sub.id} could not be matched to a Supabase profile — skipping`);
        break;
      }

      const status = ACTIVE_STATUSES.has(sub.status) ? "active" : "inactive";
      const priceId = getSubscriptionPriceId(sub);
      const plan = getPlanByStripePriceId(priceId);
      if (status === "active" && !plan) {
        console.warn(`Subscription ${sub.id} has unrecognized price ${priceId ?? "none"} — preserving existing plan`);
      }

      const profileUpdate: {
        subscription_status: string;
        stripe_subscription_id: string;
        plan?: "free" | "starter" | "pro";
      } = {
        subscription_status: status,
        stripe_subscription_id: sub.id,
      };

      if (status === "active" && plan) {
        profileUpdate.plan = plan;
      } else if (status !== "active") {
        profileUpdate.plan = "free";
      }

      const { data: updatedProfile, error } = await adminSupabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", userId)
        .select("email, subscription_status")
        .single();

      if (error) {
        console.error(`Failed to update profile for user ${userId}:`, error);
      } else if (
        event.type === "customer.subscription.created" &&
        status === "active" &&
        plan &&
        updatedProfile?.email
      ) {
        // Send welcome email on new subscription only (not on updates).
        sendWelcomeEmail(updatedProfile.email, PLANS[plan].name).catch((err) =>
          console.error("Welcome email failed:", err)
        );
        // Schedule onboarding sequence (Days 2 and 7) to drive first report + retention.
        scheduleOnboardingSequence(updatedProfile.email, PLANS[plan].name).catch((err) =>
          console.error("Onboarding sequence scheduling failed:", err)
        );
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = await findUserIdForSubscription(adminSupabase, sub);
      if (!userId) {
        console.warn(`Subscription ${sub.id} could not be matched to a Supabase profile — skipping`);
        break;
      }

      // Fetch email and plan before nulling them so the cancellation email has context.
      const { data: cancelledProfile } = await adminSupabase
        .from("profiles")
        .select("email, plan")
        .eq("id", userId)
        .single();

      const { error } = await adminSupabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
          plan: "free",
        })
        .eq("id", userId);

      if (error) {
        console.error(`Failed to cancel profile for user ${userId}:`, error);
      } else if (cancelledProfile?.email) {
        const planName = cancelledProfile.plan === "pro" ? PLANS.pro.name : PLANS.starter.name;
        scheduleCancellationSequence(cancelledProfile.email, planName).catch((err) =>
          console.error("Cancellation sequence scheduling failed:", err)
        );
      }
      break;
    }

    default:
      // Unhandled events are fine — Stripe sends many; we only act on subscription events
      break;
  }

  return NextResponse.json({ received: true });
}
