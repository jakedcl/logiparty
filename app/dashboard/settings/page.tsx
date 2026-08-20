import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/settings/billing-panel";
import { OrgSettingsEditor } from "@/components/settings/org-settings-editor";
import {
  canManageBilling,
  canManageOrgSettings,
} from "@/lib/auth/permissions";
import { getOrgForSession, requireSession } from "@/lib/org/context";
import { isStripeConfigured } from "@/lib/stripe";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string }>;
}) {
  const session = await requireSession();
  const canSettings = canManageOrgSettings(session.user);
  const canBilling = canManageBilling(session.user);

  if (!canSettings && !canBilling) redirect("/dashboard");

  const org = await getOrgForSession(session);
  if (!org) redirect("/dashboard");

  const params = await searchParams;
  const billingFlash =
    params.billing === "success"
      ? "Checkout complete — status updates when Stripe confirms the subscription."
      : params.billing === "canceled"
        ? "Checkout canceled."
        : null;

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-semibold mb-1">
          {canSettings ? "Organization settings" : "Billing"}
        </h1>
        <p className="text-sm text-neutral-500">
          {canSettings
            ? "White-label name, logo, color, email sender, and billing."
            : "Subscription status for this organization."}
        </p>
      </div>

      {billingFlash && (
        <p className="text-sm rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700">
          {billingFlash}
        </p>
      )}

      {canSettings && (
        <OrgSettingsEditor
          org={{
            name: org.name,
            logoUrl: org.logoUrl,
            primaryColor: org.primaryColor,
            emailFromName: org.emailFromName,
          }}
        />
      )}

      {canBilling && (
        <BillingPanel
          configured={isStripeConfigured()}
          billingStatus={org.billingStatus}
          hasCustomer={Boolean(org.stripeCustomerId)}
        />
      )}
    </div>
  );
}
