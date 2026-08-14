import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { canAccessClientPortal } from "@/lib/auth/permissions";
import { listClientInventoryItems } from "@/lib/actions/client-inventory";
import { getSessionClientCompany } from "@/lib/org/context";
import { auth } from "@/lib/auth";

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessClientPortal(session.user)) redirect("/dashboard");

  const company = await getSessionClientCompany(session);
  const items =
    company ?
      await listClientInventoryItems(session.user.orgId, company.id)
    : [];

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{session.user.orgName}</h1>
          <p className="text-sm text-neutral-500">
            {company ? company.name : "Client portal"}
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="text-sm text-neutral-500 hover:text-neutral-800"
          >
            Sign out
          </button>
        </form>
      </header>

      <section>
        <h2 className="font-medium mb-2">Your inventory</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Items stored with us for {company?.name ?? "your company"}.
        </p>
        {!company && (
          <p className="text-sm text-neutral-500">
            Your account is not linked to a client company yet.
          </p>
        )}
        {company && items.length === 0 && (
          <p className="text-sm text-neutral-500">No inventory listed yet.</p>
        )}
        {items.length > 0 && (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b text-neutral-500">
                <th className="py-2 font-medium">SKU</th>
                <th className="py-2 font-medium">Name</th>
                <th className="py-2 font-medium">Qty</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-2">{item.sku}</td>
                  <td className="py-2">{item.name}</td>
                  <td className="py-2">{item.totalQuantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="text-neutral-500 text-sm mt-10">
        Job requests and documents will appear here in Milestone M4.
      </p>
    </div>
  );
}
