import { neon } from "@neondatabase/serverless";

/**
 * Edge-safe org existence check (Neon HTTP). Used by middleware for A4.
 * Returns null when DATABASE_URL is missing or the query fails (fail open).
 */
export async function orgExistsBySlug(slug: string): Promise<boolean | null> {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    const sql = neon(url);
    const rows = await sql`
      SELECT 1 AS ok FROM organizations WHERE slug = ${slug} LIMIT 1
    `;
    return rows.length > 0;
  } catch (err) {
    console.error("[org] slug lookup failed", err);
    return null;
  }
}
