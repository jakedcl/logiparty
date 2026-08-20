import { redirect } from "next/navigation";
import { canInviteUsers } from "@/lib/auth/permissions";
import {
  createClientCompany,
  listClientCompaniesWithContacts,
} from "@/lib/actions/clients";
import { createClientInvite } from "@/lib/actions/invites";
import { requireSession } from "@/lib/org/context";

function contactDisplayName(
  firstName: string | null,
  lastName: string | null,
  email: string
) {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email;
}

export default async function ClientsPage() {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) redirect("/dashboard");

  const rows = await listClientCompaniesWithContacts(session.user.orgId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Client companies</h1>
        <p className="text-sm text-neutral-500">
          Your customers (e.g. Red Bull). Contacts appear under each company —
          invite more to the client portal.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Companies
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({rows.length})
            </span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No client companies yet. Use + Add company below.
          </p>
        ) : (
          <ul className="border border-neutral-200 rounded-md bg-white divide-y divide-neutral-100 -mx-4 sm:mx-0">
            {rows.map(({ company, contacts }) => (
              <li key={company.id} className="px-3 py-3 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-medium text-neutral-900">
                    {company.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {contacts.length} contact
                    {contacts.length === 1 ? "" : "s"}
                  </p>
                </div>

                {contacts.length === 0 ? (
                  <p className="text-sm text-neutral-500 py-1">
                    No contacts yet. Invite someone below.
                  </p>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <table className="w-full min-w-[28rem] text-sm text-left">
                      <thead>
                        <tr className="border-y border-neutral-100 text-neutral-500 bg-neutral-50/80">
                          <th className="py-1.5 px-3 font-medium w-[10rem]">
                            Name
                          </th>
                          <th className="py-1.5 px-3 font-medium">Email</th>
                          <th className="py-1.5 px-3 font-medium w-[8rem]">
                            Title
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c) => (
                          <tr
                            key={c.clientUserId}
                            className="border-b border-neutral-100 last:border-0 align-middle"
                          >
                            <td className="py-1.5 px-3 text-neutral-900 whitespace-nowrap">
                              {contactDisplayName(
                                c.firstName,
                                c.lastName,
                                c.email
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-neutral-600">
                              {c.email}
                            </td>
                            <td className="py-1.5 px-3 text-neutral-600">
                              {c.title?.trim() || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <details className="group">
                  <summary className="cursor-pointer list-none text-sm text-neutral-600 hover:text-neutral-900 select-none [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <span
                        className="text-neutral-400 group-open:hidden"
                        aria-hidden
                      >
                        +
                      </span>
                      <span
                        className="hidden text-neutral-400 group-open:inline"
                        aria-hidden
                      >
                        −
                      </span>
                      Invite contact
                    </span>
                  </summary>
                  <form
                    action={createClientInvite}
                    className="mt-2 grid gap-2 sm:grid-cols-3 sm:items-end max-w-2xl"
                  >
                    <input
                      type="hidden"
                      name="clientCompanyId"
                      value={company.id}
                    />
                    <label className="text-xs text-neutral-500 sm:col-span-1">
                      Email
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="contact@client.com"
                        className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                      />
                    </label>
                    <label className="text-xs text-neutral-500 sm:col-span-1">
                      Title
                      <input
                        name="title"
                        placeholder="e.g. Event Producer"
                        className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
                      />
                    </label>
                    <button
                      type="submit"
                      className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px] mt-4 sm:mt-0"
                    >
                      Send invite
                    </button>
                  </form>
                </details>
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
              Add company
            </span>
          </summary>
          <form
            action={createClientCompany}
            className="mt-3 flex flex-wrap gap-2 items-end max-w-md"
          >
            <label className="flex-1 text-xs text-neutral-500 min-w-[12rem]">
              Company name
              <input
                name="name"
                required
                placeholder="Company name"
                className="mt-1 w-full border border-neutral-200 rounded px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded px-3 py-1.5 text-sm font-medium bg-neutral-900 text-white h-[34px]"
            >
              Add
            </button>
          </form>
        </details>
      </section>
    </div>
  );
}
