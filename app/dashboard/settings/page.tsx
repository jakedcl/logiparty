import { redirect } from "next/navigation";
import { OrgSettingsEditor } from "@/components/settings/org-settings-editor";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { getOrgForSession, requireSession } from "@/lib/org/context";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!canManageOrgSettings(session.user)) redirect("/dashboard");

  const org = await getOrgForSession(session);
  if (!org) redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Organization settings</h1>
        <p className="text-sm text-neutral-500">
          White-label name, logo, color, and email sender.
        </p>
      </div>
      <OrgSettingsEditor org={org} />
    </div>
  );
}
