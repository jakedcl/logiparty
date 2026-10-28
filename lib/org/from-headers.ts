import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { getOrgSlugFromHeaders as getOrgSlugFromHeadersSync } from "@/lib/org/subdomain";

export async function getOrgSlugFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  return getOrgSlugFromHeadersSync(headersList);
}

export async function getOrgBySlugFromHeaders() {
  const slug = await getOrgSlugFromHeaders();
  if (!slug || !db) return null;
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  return org ?? null;
}
