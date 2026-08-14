import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { getOrgSlugFromHost } from "@/lib/org/subdomain";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const host = (await headers()).get("host") ?? "";
  const orgSlug =
    getOrgSlugFromHost(host) ?? process.env.NEXT_PUBLIC_DEV_ORG_SLUG ?? "acme";

  let orgName = orgSlug;
  if (db) {
    const [org] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    if (org) orgName = org.name;
  }

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm border rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold mb-1">{orgName}</h1>
        <p className="text-sm text-neutral-500 mb-6">Sign in to continue</p>
        {params.error && (
          <p className="text-sm text-red-600 mb-4">Invalid email or password.</p>
        )}
        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            try {
              await signIn("credentials", {
                email,
                password,
                orgSlug,
                redirectTo: "/dashboard",
              });
            } catch {
              redirect("/login?error=1");
            }
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "#2563eb" }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
