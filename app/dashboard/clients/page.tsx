import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { canInviteUsers } from "@/lib/auth/permissions";
import { createClientCompany } from "@/lib/actions/clients";
import { createClientInvite } from "@/lib/actions/invites";
import { requireSession } from "@/lib/org/context";
import { db } from "@/lib/db";
import { clientCompanies } from "@/lib/db/schema";

export default async function ClientsPage() {
  const session = await requireSession();
  if (!canInviteUsers(session.user)) redirect("/dashboard");

  const companies =
    db ?
      await db
        .select()
        .from(clientCompanies)
        .where(eq(clientCompanies.orgId, session.user.orgId))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Client companies</h1>
        <p className="text-sm text-neutral-500">
          Your customers (e.g. Red Bull). Invite contacts to the client portal.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium text-neutral-800">
            Companies
            <span className="ml-1.5 text-neutral-400 font-normal">
              ({companies.length})
            </span>
          </h2>
        </div>

        {companies.length === 0 ? (
          <p className="text-sm text-neutral-500 py-4">
            No client companies yet. Use + Add company below.
          </p>
        ) : (
          <ul className="border border-neutral-200 rounded-md bg-white divide-y divide-neutral-100 -mx-4 sm:mx-0">
            {companies.map((company) => (
              <li key={company.id} className="px-3 py-3">
                <p className="text-sm font-medium text-neutral-900 mb-2">
                  {company.name}
                </p>
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
