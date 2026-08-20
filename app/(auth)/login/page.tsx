import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth, signIn } from "@/lib/auth";
import { absoluteRedirectUrl, postAuthPath } from "@/lib/auth/redirect";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; missingOrg?: string }>;
}) {
  const headersList = await headers();
  const session = await auth();
  if (session?.user) {
    // Absolute URL keeps redirect on tenant host (AUTH_URL is apex).
    redirect(absoluteRedirectUrl(headersList, postAuthPath(session.user)));
  }

  const orgSlug = getOrgSlugFromHeaders(headersList);

  const params = await searchParams;

  if (!orgSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm border rounded-lg bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold mb-2">Sign in</h1>
          <p className="text-sm text-neutral-600">
            Open your organization subdomain to sign in (for example{" "}
            <code className="text-xs bg-neutral-100 px-1 rounded">
              your-org.logiparty.com
            </code>
            , or locally{" "}
            <code className="text-xs bg-neutral-100 px-1 rounded">
              your-org.localhost:3000
            </code>
            ).
          </p>
          <p className="mt-4 text-sm text-neutral-600">
            <Link href="/" className="text-neutral-900 underline underline-offset-2">
              ← Back to Logiparty
            </Link>
          </p>
        </div>
      </div>
    );
  }

  let org: {
    name: string;
    primaryColor: string | null;
    logoUrl: string | null;
  } | null = null;

  if (db) {
    const [row] = await db
      .select({
        name: organizations.name,
        primaryColor: organizations.primaryColor,
        logoUrl: organizations.logoUrl,
      })
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);
    org = row ?? null;
  }

  const orgName = org?.name ?? orgSlug;
  const primaryColor = org?.primaryColor ?? "#2563eb";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-sm border rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col items-start gap-3">
          {org?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={org.logoUrl}
              alt=""
              className="h-10 w-auto max-w-[160px]"
            />
          ) : null}
          <div>
            <h1 className="text-xl font-semibold">{orgName}</h1>
            <p className="text-sm text-neutral-500">Sign in to continue</p>
          </div>
        </div>
        {params.error && (
          <p className="text-sm text-red-600 mb-4">Invalid email or password.</p>
        )}
        <form
          action={async (formData) => {
            "use server";
            const email = formData.get("email") as string;
            const password = formData.get("password") as string;
            try {
              const reqHeaders = await headers();
              // Absolute URL keeps post-login on tenant subdomain (AUTH_URL is apex).
              await signIn("credentials", {
                email,
                password,
                orgSlug,
                redirectTo: absoluteRedirectUrl(reqHeaders, "/"),
              });
            } catch (error) {
              // Auth.js throws a redirect on success — rethrow so it isn't treated as failure.
              if (
                typeof error === "object" &&
                error &&
                "digest" in error &&
                String((error as { digest?: string }).digest).startsWith(
                  "NEXT_REDIRECT"
                )
              ) {
                throw error;
              }
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
            style={{ backgroundColor: primaryColor }}
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
