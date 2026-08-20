"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { absoluteRedirectUrl } from "@/lib/auth/redirect";
import {
  getDevPersona,
  isDevRoleSwitchAllowed,
} from "@/lib/dev/role-switch";
import { getOrgSlugFromHeaders } from "@/lib/org/subdomain";

/** Seed password — server-only; never import into client components. */
const SEED_PASSWORD = "password123";

export async function switchDevPersona(formData: FormData): Promise<void> {
  if (!isDevRoleSwitchAllowed()) {
    throw new Error("Dev role switch is disabled");
  }

  const personaId = String(formData.get("persona") ?? "");
  const persona = getDevPersona(personaId);
  if (!persona) {
    throw new Error("Unknown persona");
  }

  const headersList = await headers();
  const session = await auth();
  const orgSlug =
    session?.user?.orgSlug ?? getOrgSlugFromHeaders(headersList);
  if (!orgSlug) {
    throw new Error("No organization context");
  }

  try {
    await signIn("credentials", {
      email: persona.email,
      password: SEED_PASSWORD,
      orgSlug,
      redirectTo: absoluteRedirectUrl(headersList, persona.redirectPath),
    });
  } catch (error) {
    // Auth.js throws a redirect on success — rethrow so Next.js handles it.
    if (
      typeof error === "object" &&
      error &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    redirect("/login?error=1");
  }
}
