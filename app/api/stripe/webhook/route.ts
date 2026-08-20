import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import {
  getStripe,
  isStripeWebhookConfigured,
  mapStripeSubscriptionStatus,
} from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Stripe webhooks — apex URL: https://logiparty.com/api/stripe/webhook
 * Uses raw body for signature verification. No auth cookie required.
 */
export async function POST(request: Request) {
  if (!isStripeWebhookConfigured()) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured" },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!.trim();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("[stripe webhook] signature verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (!db) return;
  if (session.mode !== "subscription") return;

  const orgId =
    session.metadata?.orgId ??
    session.client_reference_id ??
    null;
  if (!orgId) {
    console.warn("[stripe webhook] checkout.session.completed missing orgId");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  await db
    .update(organizations)
    .set({
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      billingStatus: "active",
    })
    .where(eq(organizations.id, orgId));
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  if (!db) return;

  const orgId = sub.metadata?.orgId ?? null;
  const status = mapStripeSubscriptionStatus(sub.status);
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;

  if (orgId) {
    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: sub.id,
        billingStatus: status,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
      })
      .where(eq(organizations.id, orgId));
    return;
  }

  // Fallback: match by subscription or customer id (idempotent upsert of status).
  const [bySub] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.stripeSubscriptionId, sub.id))
    .limit(1);

  if (bySub) {
    await db
      .update(organizations)
      .set({ billingStatus: status })
      .where(eq(organizations.id, bySub.id));
    return;
  }

  if (customerId) {
    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: sub.id,
        billingStatus: status,
      })
      .where(eq(organizations.stripeCustomerId, customerId));
  }
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  if (!db) return;

  const orgId = sub.metadata?.orgId ?? null;
  if (orgId) {
    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: sub.id,
        billingStatus: "canceled",
      })
      .where(eq(organizations.id, orgId));
    return;
  }

  await db
    .update(organizations)
    .set({ billingStatus: "canceled" })
    .where(eq(organizations.stripeSubscriptionId, sub.id));
}
