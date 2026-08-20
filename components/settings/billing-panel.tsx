"use client";

import {
  createBillingPortalSession,
  createCheckoutSession,
} from "@/lib/actions/billing";

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
      <section className="space-y-2 border-t border-neutral-200 pt-6">
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
    <section className="space-y-3 border-t border-neutral-200 pt-6">
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
            <button
              type="submit"
              className="rounded bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Subscribe
            </button>
          </form>
        )}
        {hasCustomer && (
          <form action={createBillingPortalSession}>
            <button
              type="submit"
              className="rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
            >
              Manage billing
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
