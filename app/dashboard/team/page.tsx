import { redirect } from "next/navigation";
import { canInviteUsers } from "@/lib/auth/permissions";
import { createStaffInvite } from "@/lib/actions/invites";
import {
  updateMembershipRoles,
  updateStaffTags,
  listTeamMembers,
} from "@/lib/actions/team";
import { requireSession } from "@/lib/org/context";
import { STAFF_TAGS } from "@/lib/db/schema";

export default async function TeamPage() {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) redirect("/dashboard");

  const members = await listTeamMembers(session.user.orgId);
  const internalMembers = members.filter((m) => !m.membership.isClient);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Team</h1>
        <p className="text-sm text-neutral-500">
          Invite staff and managers. Set capability tags for crew pickers.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Members
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({internalMembers.length})
            </span>
          </h2>
        </div>

        {internalMembers.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No team members yet. Use + Invite below.
          </p>
        ) : (
          <ul className="border border-neutral-200 rounded-md bg-white divide-y divide-neutral-100 -mx-4 sm:mx-0">
            {internalMembers.map(({ membership, user, tags }) => (
              <li key={membership.id} className="px-3 py-3 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium text-neutral-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-neutral-500">{user.email}</p>
                </div>
                <form
                  action={updateMembershipRoles}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm"
                >
                  <input
                    type="hidden"
                    name="membershipId"
                    value={membership.id}
                  />
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
                    <input
                      type="hidden"
                      name="membershipId"
                      value={membership.id}
                    />
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
              </li>
            ))}
          </ul>
        )}

        <details className="group border-t border-neutral-200 pt-4">
          <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <span className="text-neutral-400 group-open:hidden" aria-hidden>
                +
              </span>
              <span
                className="hidden text-neutral-400 group-open:inline"
                aria-hidden
              >
                −
              </span>
              Invite team member
            </span>
          </summary>
          <form
            action={createStaffInvite}
            className="mt-3 space-y-3 max-w-lg"
          >
            <label className="block text-xs text-neutral-500">
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="email@company.com"
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-4 text-sm text-neutral-700">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="isOrgAdmin" /> Org admin
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="isManager" defaultChecked />{" "}
                Manager
              </label>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="isStaff" /> Staff (crew picker)
              </label>
            </div>
            <p className="text-xs text-neutral-500">
              Managers can also be staff — check both to appear in crew
              assignments.
            </p>
            <button
              type="submit"
              className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white"
            >
              Send invite
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
