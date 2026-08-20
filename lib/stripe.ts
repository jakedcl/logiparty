import Stripe from "stripe";

/**
 * Optional Stripe (like R2 / Resend): works when env keys exist;
 * safe no-op / clear UI when missing. Never required for core job flows.
 */

export type BillingStatus = "none" | "active" | "past_due" | "canceled";

export function isStripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_PRICE_ID?.trim()
  );
}

/** True when webhook signature verification can run. */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY?.trim() &&
      process.env.STRIPE_WEBHOOK_SECRET?.trim()
  );
}

export function getStripePriceId(): string | null {
  return process.env.STRIPE_PRICE_ID?.trim() || null;
}

let stripeSingleton: Stripe | null = null;

/**
 * Stripe client, or null when secret key is missing.
 * Prefer `isStripeConfigured()` before calling for Checkout (also needs price).
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

/** Map Stripe subscription.status → our soft billing_status. */
export function mapStripeSubscriptionStatus(
  status: string | null | undefined
): BillingStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "none";
  }
}
