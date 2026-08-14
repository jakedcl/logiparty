import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { canAccessClientPortal } from "@/lib/auth/permissions";

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessClientPortal(session.user)) redirect("/dashboard");

  return (
    <div className="min-h-screen p-6">
      <header className="mb-8">
        <h1 className="text-xl font-semibold">{session.user.orgName}</h1>
        <p className="text-sm text-neutral-500">Client portal (M4)</p>
      </header>
      <p className="text-neutral-600 text-sm">
        Job requests and documents will appear here in Milestone M4.
      </p>
    </div>
  );
}
