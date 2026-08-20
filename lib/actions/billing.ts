"use server";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { canManageBilling } from "@/lib/auth/permissions";
import { requireSession, getOrgForSession } from "@/lib/org/context";
import {
  getStripe,
  getStripePriceId,
  isStripeConfigured,
} from "@/lib/stripe";

function requestOrigin(headersList: Headers): string {
  const host =
    headersList.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    headersList.get("host") ??
    "localhost:3000";
  const proto =
    headersList.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

async function requireBillingActor() {
  const session = await requireSession();
  if (!canManageBilling(session.user)) {
    throw new Error("Forbidden");
  }
  if (!db) throw new Error("Database not configured");
  const org = await getOrgForSession(session);
  if (!org) throw new Error("Organization not found");
  return { org };
}

/** Ensure Stripe Customer exists for org; persist id. */
async function ensureStripeCustomer(org: {
  id: string;
  name: string;
  slug: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Billing isn’t configured yet");

  if (org.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe.customers.create({
    name: org.name,
    metadata: { orgId: org.id, orgSlug: org.slug },
  });

  await db!
    .update(organizations)
    .set({ stripeCustomerId: customer.id })
    .where(eq(organizations.id, org.id));

  return customer.id;
}

/** Redirect to Stripe Checkout (subscription) for the current org. */
export async function createCheckoutSession() {
  if (!isStripeConfigured()) {
    throw new Error("Billing isn’t configured yet");
  }
  const { org } = await requireBillingActor();
  const stripe = getStripe()!;
  const priceId = getStripePriceId()!;
  const customerId = await ensureStripeCustomer(org);

  const headersList = await headers();
  const origin = requestOrigin(headersList);

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard/settings?billing=success`,
    cancel_url: `${origin}/dashboard/settings?billing=canceled`,
    client_reference_id: org.id,
    metadata: { orgId: org.id, orgSlug: org.slug },
    subscription_data: {
      metadata: { orgId: org.id, orgSlug: org.slug },
    },
  });

  if (!checkout.url) throw new Error("Could not start checkout");
  redirect(checkout.url);
}

/** Redirect to Stripe Customer Portal (payment method / cancel). */
export async function createBillingPortalSession() {
  if (!isStripeConfigured()) {
    throw new Error("Billing isn’t configured yet");
  }
  const { org } = await requireBillingActor();
  if (!org.stripeCustomerId) {
    throw new Error("No billing customer yet — subscribe first");
  }

  const stripe = getStripe()!;
  const headersList = await headers();
  const origin = requestOrigin(headersList);

  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${origin}/dashboard/settings`,
  });

  redirect(portal.url);
}
