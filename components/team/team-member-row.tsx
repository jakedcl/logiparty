"use client";

import { useState } from "react";
import {
  updateMembershipRoles,
  updateStaffTags,
} from "@/lib/actions/team";
import { STAFF_TAGS } from "@/lib/db/schema";

function roleLabels(m: {
  isOrgAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
}): string {
  const parts: string[] = [];
  if (m.isOrgAdmin) parts.push("Admin");
  if (m.isManager) parts.push("Manager");
  if (m.isStaff) parts.push("Staff");
  return parts.length > 0 ? parts.join(", ") : "No roles";
}

export function TeamMemberRow({
  membership,
  user,
  tags,
}: {
  membership: {
    id: string;
    isOrgAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
  tags: string[];
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="px-3 py-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
          <p className="text-sm font-medium text-neutral-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-neutral-500">{user.email}</p>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded px-2.5 py-1 text-sm font-medium text-neutral-700 border border-neutral-300 hover:bg-neutral-50"
          >
            Edit
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="shrink-0 rounded px-2.5 py-1 text-sm text-neutral-600 border border-neutral-300 hover:bg-neutral-50"
          >
            Cancel
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-1 text-sm">
          <p className="text-neutral-800">
            <span className="text-neutral-500">Roles:</span>{" "}
            {roleLabels(membership)}
          </p>
          {membership.isStaff ? (
            <p className="text-neutral-800">
              <span className="text-neutral-500">Tags:</span>{" "}
              {tags.length > 0 ? (
                tags.join(", ")
              ) : (
                <span className="text-neutral-400">None</span>
              )}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <form
            action={updateMembershipRoles}
            className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
          >
            <input type="hidden" name="membershipId" value={membership.id} />
            <label className="flex items-center gap-1.5 text-neutral-700">
              <input
                type="checkbox"
                name="isOrgAdmin"
                defaultChecked={membership.isOrgAdmin}
              />
              Admin
            </label>
            <label className="flex items-center gap-1.5 text-neutral-700">
              <input
                type="checkbox"
                name="isManager"
                defaultChecked={membership.isManager}
              />
              Manager
            </label>
            <label className="flex items-center gap-1.5 text-neutral-700">
              <input
                type="checkbox"
                name="isStaff"
                defaultChecked={membership.isStaff}
              />
              Staff
            </label>
            <button
              type="submit"
              className="text-sm text-neutral-700 hover:text-neutral-900 font-medium"
            >
              Save roles
            </button>
          </form>

          {membership.isStaff ? (
            <form action={updateStaffTags} className="space-y-1.5">
              <input type="hidden" name="membershipId" value={membership.id} />
              <p className="text-xs text-neutral-500">Capability tags</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                {STAFF_TAGS.map((tag) => (
                  <label
                    key={tag}
                    className="flex items-center gap-1.5 text-neutral-700"
                  >
                    <input
                      type="checkbox"
                      name={`tag-${tag}`}
                      defaultChecked={tags.includes(tag)}
                    />
                    {tag}
                  </label>
                ))}
                <button
                  type="submit"
                  className="text-sm text-neutral-700 hover:text-neutral-900 font-medium"
                >
                  Save tags
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}
    </li>
  );
}
