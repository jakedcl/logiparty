"use client";

import { FALLBACK_PRIMARY_COLOR } from "@/lib/theme/primary-color";
import {
  DetailFields,
  EditFormActions,
  ViewEdit,
} from "@/components/ui/view-edit";
import { updateOrgSettings } from "@/lib/actions/settings";

export function OrgSettingsEditor({
  org,
}: {
  org: {
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
    emailFromName: string | null;
  };
}) {
  const primary = org.primaryColor ?? FALLBACK_PRIMARY_COLOR;

  return (
    <ViewEdit
      className="max-w-md"
      view={
        <DetailFields
          rows={[
            { label: "Display name", value: org.name },
            {
              label: "Logo URL",
              value: org.logoUrl ? (
                <a
                  href={org.logoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-800 underline underline-offset-2 break-all"
                >
                  {org.logoUrl}
                </a>
              ) : null,
            },
            {
              label: "Primary color",
              value: (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block size-4 rounded border border-neutral-200"
                    style={{ backgroundColor: primary }}
                    aria-hidden
                  />
                  <span className="font-mono text-xs">{primary}</span>
                </span>
              ),
            },
            {
              label: "Email from",
              value: org.emailFromName ?? org.name,
            },
          ]}
        />
      }
      edit={({ onCancel }) => (
        <form
          action={async (formData) => {
            await updateOrgSettings(formData);
            onCancel();
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Display name
            </label>
            <input
              id="name"
              name="name"
              defaultValue={org.name}
              required
              className="lp-input"
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
              className="lp-input"
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
              defaultValue={primary}
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
              className="lp-input"
            />
          </div>
          <EditFormActions onCancel={onCancel} />
        </form>
      )}
    />
  );
}
