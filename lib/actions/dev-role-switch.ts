"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
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

  const headersList = await headers();
  // Prefer host / middleware slug so personas match the tenant you're on
  // (not a stale session org from another subdomain cookie).
  const orgSlug = getOrgSlugFromHeaders(headersList);
  if (!orgSlug) {
    throw new Error("No organization context");
  }

  const personaId = String(formData.get("persona") ?? "");
  const persona = getDevPersona(personaId, orgSlug);
  if (!persona) {
    throw new Error("Unknown persona");
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
