import Link from "next/link";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";

export default async function PortalHomePage() {
  const session = await requireSession();
  const company = await getSessionClientCompany(session);
  const firstName = session.user.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {company
            ? `${company.name} · requests and documents for your jobs`
            : "Your client portal"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/portal/jobs"
          className="border rounded-lg bg-white p-4 hover:border-neutral-400 transition-colors"
        >
          <p className="font-medium">Jobs</p>
          <p className="text-sm text-neutral-500 mt-1">
            Track status and submit requests
          </p>
        </Link>
        <Link
          href="/portal/inventory"
          className="border rounded-lg bg-white p-4 hover:border-neutral-400 transition-colors"
        >
          <p className="font-medium">Inventory</p>
          <p className="text-sm text-neutral-500 mt-1">
            Items stored with {session.user.orgName} for{" "}
            {company?.name ?? "your company"}
          </p>
        </Link>
        <Link
          href="/portal/notes"
          className="border rounded-lg bg-white p-4 hover:border-neutral-400 transition-colors sm:col-span-2"
        >
          <p className="font-medium">Notes</p>
          <p className="text-sm text-neutral-500 mt-1">
            Send a general message to {session.user.orgName}
          </p>
        </Link>
      </div>
    </div>
  );
}
