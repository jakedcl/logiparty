import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingPanel } from "@/components/settings/billing-panel";
import { OrgSettingsEditor } from "@/components/settings/org-settings-editor";
import {
  canManageBilling,
  canManageJobs,
  canManageOrgSettings,
  canReviewAvailability,
  canSubmitAvailability,
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
  const canTimeOff =
    canSubmitAvailability(session.user) ||
    canReviewAvailability(session.user);
  const canActivity = canManageJobs(session.user);

  const org =
    canSettings || canBilling ? await getOrgForSession(session) : null;
  if ((canSettings || canBilling) && !org) redirect("/dashboard");

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
        <h1 className="text-2xl font-semibold mb-1">Settings</h1>
        <p className="text-sm text-neutral-500">
          {canSettings
            ? "Your profile, organization branding, billing, time off, and activity."
            : canBilling && !canTimeOff && !canActivity
              ? "Your profile and subscription status."
              : "Your profile and account preferences."}
        </p>
      </div>

      <nav
        className="flex flex-col gap-1 border border-neutral-200 rounded-md bg-white divide-y divide-neutral-100"
        aria-label="Settings sections"
      >
        <Link
          href="/dashboard/settings/profile"
          className="px-3 py-2.5 text-sm hover:bg-neutral-50"
        >
          <span className="font-medium text-neutral-900">My Profile</span>
          <span className="block text-xs text-neutral-500 mt-0.5">
            Name and password
          </span>
        </Link>
        {canTimeOff ? (
          <Link
            href="/dashboard/settings/time-off"
            className="px-3 py-2.5 text-sm hover:bg-neutral-50"
          >
            <span className="font-medium text-neutral-900">Time off</span>
            <span className="block text-xs text-neutral-500 mt-0.5">
              {canReviewAvailability(session.user)
                ? "Request PTO and approve or deny pending requests"
                : "Request time off"}
            </span>
          </Link>
        ) : null}
        {canActivity ? (
          <Link
            href="/dashboard/settings/activity"
            className="px-3 py-2.5 text-sm hover:bg-neutral-50"
          >
            <span className="font-medium text-neutral-900">Activity log</span>
            <span className="block text-xs text-neutral-500 mt-0.5">
              Recent org actions
            </span>
          </Link>
        ) : null}
      </nav>

      {billingFlash && (
        <p className="text-sm rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700">
          {billingFlash}
        </p>
      )}

      {canSettings && org ? (
        <section id="branding" className="space-y-3">
          <h2 className="text-lg font-medium">Organization</h2>
          <OrgSettingsEditor
            org={{
              name: org.name,
              logoUrl: org.logoUrl,
              primaryColor: org.primaryColor,
              emailFromName: org.emailFromName,
            }}
          />
        </section>
      ) : null}

      {canBilling && org ? (
        <BillingPanel
          configured={isStripeConfigured()}
          billingStatus={org.billingStatus}
          hasCustomer={Boolean(org.stripeCustomerId)}
        />
      ) : null}
    </div>
  );
}
