"use client";

import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

const STATUS_LABEL: Record<string, string> = {
  none: "Not subscribed",
  active: "Active",
  past_due: "Past due",
  canceled: "Canceled",
};

export function BillingPanel({
  configured,
  billingStatus,
  hasCustomer,
}: {
  configured: boolean;
  billingStatus: string | null;
  hasCustomer: boolean;
}) {
  const status = billingStatus ?? "none";
  const label = STATUS_LABEL[status] ?? status;

  if (!configured) {
    return (
      <section
        id="billing"
        className="space-y-2 border-t border-neutral-200 pt-6"
      >
        <h2 className="text-lg font-medium">Billing</h2>
        <p className="text-sm text-neutral-500">
          Billing isn’t configured yet. When Stripe keys are added to the
          environment, you can subscribe and manage payment methods here.
        </p>
      </section>
    );
  }

  const isActive = status === "active";

  return (
    <section
      id="billing"
      className="space-y-3 border-t border-neutral-200 pt-6"
    >
      <div>
        <h2 className="text-lg font-medium">Billing</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Subscription for this organization. Unpaid status does not lock the
          app during the pilot.
        </p>
      </div>
      <p className="text-sm">
        Status:{" "}
        <span className="font-medium text-neutral-900">{label}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {!isActive && (
          <form action={createCheckoutSession}>
            <Button type="submit">Subscribe</Button>
          </form>
        )}
        {hasCustomer && (
          <form action={createBillingPortalSession}>
            <Button type="submit" variant="outline">
              Manage billing
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
