import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invites, organizations } from "@/lib/db/schema";
import { acceptInvite } from "@/lib/actions/invites";
import { signIn } from "@/lib/auth";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!db) {
    return <p className="p-6">Database not configured.</p>;
  }

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1);

  if (!invite || invite.acceptedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-neutral-600">This invitation is invalid or expired.</p>
      </div>
    );
  }

  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, invite.orgId))
    .limit(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">{org?.name ?? "Organization"}</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Complete your account for {invite.email}
        </p>
        <form
          action={async (formData) => {
            "use server";
            formData.set("token", token);
            const result = await acceptInvite(formData);
            const [orgRow] = await db!
              .select({ slug: organizations.slug })
              .from(organizations)
              .where(eq(organizations.id, result.orgId))
              .limit(1);
            await signIn("credentials", {
              email: result.email,
              password: formData.get("password") as string,
              orgSlug: orgRow?.slug ?? "testtenant",
              redirectTo: invite.isClient ? "/portal" : "/dashboard",
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          {invite.isClient && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Job title
              </label>
              <input
                id="title"
                name="title"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded py-2 text-sm font-medium text-white bg-neutral-900"
          >
            Create account
          </button>
        </form>
      </div>
    </div>
  );
}
