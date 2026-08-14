import { requireSession } from "@/lib/org/context";

export default async function DashboardPage() {
  const session = await requireSession();

  return (
    <>
      <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
      <p className="text-neutral-600 text-sm mb-4">
        Signed in as {session.user.email}
      </p>
      <p className="text-neutral-600 text-sm">
        Org inventory, client inventory, and fleet are live. Tools next (M2).
        Jobs arrive in M3.
      </p>
    </>
  );
}
