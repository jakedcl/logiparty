import { redirect } from "next/navigation";
import { canManageOrgSettings } from "@/lib/auth/permissions";
import { updateOrgSettings } from "@/lib/actions/settings";
import { getOrgForSession, requireSession } from "@/lib/org/context";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!canManageOrgSettings(session.user)) redirect("/dashboard");

  const org = await getOrgForSession(session);
  if (!org) redirect("/dashboard");

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Organization settings</h1>
      <form action={updateOrgSettings} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Display name
          </label>
          <input
            id="name"
            name="name"
            defaultValue={org.name}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="logoUrl" className="block text-sm font-medium mb-1">
            Logo URL
          </label>
          <input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={org.logoUrl ?? ""}
            placeholder="https://..."
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="primaryColor"
            className="block text-sm font-medium mb-1"
          >
            Primary color
          </label>
          <input
            id="primaryColor"
            name="primaryColor"
            type="color"
            defaultValue={org.primaryColor ?? "#2563eb"}
            className="h-10 w-20 border rounded"
          />
        </div>
        <div>
          <label
            htmlFor="emailFromName"
            className="block text-sm font-medium mb-1"
          >
            Email from name
          </label>
          <input
            id="emailFromName"
            name="emailFromName"
            defaultValue={org.emailFromName ?? org.name}
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: org.primaryColor ?? "#2563eb" }}
        >
          Save
        </button>
      </form>
    </div>
  );
}
