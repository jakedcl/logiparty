import { redirect } from "next/navigation";
import { canInviteUsers } from "@/lib/auth/permissions";
import { createStaffInvite } from "@/lib/actions/invites";
import { updateMembershipRoles, updateStaffTags, listTeamMembers } from "@/lib/actions/team";
import { requireSession } from "@/lib/org/context";
import { STAFF_TAGS } from "@/lib/db/schema";

export default async function TeamPage() {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) redirect("/dashboard");

  const members = await listTeamMembers(session.user.orgId);
  const internalMembers = members.filter((m) => !m.membership.isClient);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Team</h1>
        <p className="text-sm text-neutral-500">
          Invite staff and managers. Set capability tags for crew pickers (M3).
        </p>
      </div>

      <section className="border rounded-lg p-4 bg-white">
        <h2 className="font-medium mb-3">Invite team member</h2>
        <form action={createStaffInvite} className="space-y-3 max-w-lg">
          <input
            name="email"
            type="email"
            required
            placeholder="email@company.com"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isOrgAdmin" /> Org admin
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isManager" defaultChecked /> Manager
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isStaff" /> Staff (crew picker)
            </label>
          </div>
          <p className="text-xs text-neutral-500">
            Managers can also be staff — check both to appear in crew assignments.
          </p>
          <button
            type="submit"
            className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
          >
            Send invite
          </button>
        </form>
      </section>

      <section>
        <h2 className="font-medium mb-3">Members</h2>
        <ul className="space-y-4">
          {internalMembers.map(({ membership, user, tags }) => (
            <li key={membership.id} className="border rounded-lg p-4 bg-white">
              <p className="font-medium">
                {user.firstName} {user.lastName}{" "}
                <span className="text-neutral-500 font-normal text-sm">
                  {user.email}
                </span>
              </p>
              <form action={updateMembershipRoles} className="mt-2 flex flex-wrap gap-3 text-sm">
                <input type="hidden" name="membershipId" value={membership.id} />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="isOrgAdmin"
                    defaultChecked={membership.isOrgAdmin}
                  />
                  Admin
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="isManager"
                    defaultChecked={membership.isManager}
                  />
                  Manager
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    name="isStaff"
                    defaultChecked={membership.isStaff}
                  />
                  Staff
                </label>
                <button type="submit" className="text-xs underline">
                  Save roles
                </button>
              </form>
              {membership.isStaff && (
                <form action={updateStaffTags} className="mt-2">
                  <input type="hidden" name="membershipId" value={membership.id} />
                  <p className="text-xs text-neutral-500 mb-1">Capability tags</p>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {STAFF_TAGS.map((tag) => (
                      <label key={tag} className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          name={`tag-${tag}`}
                          defaultChecked={tags.includes(tag)}
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                  <button type="submit" className="text-xs underline mt-1">
                    Save tags
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
