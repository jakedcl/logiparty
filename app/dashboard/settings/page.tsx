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
    <div className="max-w-md space-y-8">
      <div>
        <h1 className="lp-page-title">Settings</h1>
        <p className="lp-page-sub">
          {canSettings
            ? "Your profile, organization branding, billing, time off, and activity."
            : canBilling && !canTimeOff && !canActivity
              ? "Your profile and subscription status."
              : "Your profile and account preferences."}
        </p>
      </div>

      <nav className="lp-nav-list" aria-label="Settings sections">
        <Link href="/dashboard/settings/profile">
          <span className="font-semibold text-[var(--foreground)]">
            My Profile
          </span>
          <span className="mt-0.5 block text-xs text-[var(--muted)]">
            Name and password
          </span>
        </Link>
        {canTimeOff ? (
          <Link href="/dashboard/settings/time-off">
            <span className="font-semibold text-[var(--foreground)]">
              Time off
            </span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              {canReviewAvailability(session.user)
                ? "Request PTO and approve or deny pending requests"
                : "Request time off"}
            </span>
          </Link>
        ) : null}
        {canActivity ? (
          <Link href="/dashboard/settings/activity">
            <span className="font-semibold text-[var(--foreground)]">
              Activity log
            </span>
            <span className="mt-0.5 block text-xs text-[var(--muted)]">
              Recent org actions
            </span>
          </Link>
        ) : null}
      </nav>

      {billingFlash ? (
        <p className="border-t border-[var(--border)] py-3 text-sm text-[var(--muted)]">
          {billingFlash}
        </p>
      ) : null}

      {canSettings && org ? (
        <section id="branding" className="space-y-3">
          <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)]">
            Organization
          </h2>
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
