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
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Client companies</h1>
        <p className="text-sm text-neutral-500">
          Your customers (e.g. Red Bull). Invite contacts to the client portal.
        </p>
      </div>

      <section className="border rounded-lg p-4 bg-white max-w-lg">
        <h2 className="font-medium mb-3">Add client company</h2>
        <form action={createClientCompany} className="flex gap-2">
          <input
            name="name"
            required
            placeholder="Company name"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
          >
            Add
          </button>
        </form>
      </section>

      {companies.map((company) => (
        <section key={company.id} className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium mb-3">{company.name}</h2>
          <form action={createClientInvite} className="space-y-2 max-w-lg">
            <input type="hidden" name="clientCompanyId" value={company.id} />
            <input
              name="email"
              type="email"
              required
              placeholder="contact@client.com"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <input
              name="title"
              placeholder="Title (e.g. Event Producer)"
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded px-4 py-2 text-sm font-medium bg-neutral-900 text-white"
            >
              Invite client user
            </button>
          </form>
        </section>
      ))}

      {companies.length === 0 && (
        <p className="text-sm text-neutral-500">No client companies yet.</p>
      )}
    </div>
  );
}
