/**
 * Smoke-check catalog RLS: org A data is invisible under org B context.
 * Run: npx tsx scripts/verify-catalog-rls.ts (requires DATABASE_URL)
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);

  const orgs = await sql`SELECT id, slug FROM organizations ORDER BY slug LIMIT 2`;
  if (orgs.length < 2) {
    throw new Error("Need two orgs (seed acme + demo) to verify isolation");
  }
  const [a, b] = orgs;

  const marker = `rls-check-${Date.now()}`;
  await sql`
    INSERT INTO inventory_items (org_id, sku, name, total_quantity)
    VALUES (${a.id}, ${marker}, 'RLS check item', 1)
  `;

  try {
    const underA = await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sql`SELECT set_config('app.current_org_id', ${a.id}, true)`,
      sql`SELECT sku FROM inventory_items WHERE sku = ${marker}`,
    ]);
    const underB = await sql.transaction([
      sql`SET LOCAL ROLE logiparty_app`,
      sql`SELECT set_config('app.current_org_id', ${b.id}, true)`,
      sql`SELECT sku FROM inventory_items WHERE sku = ${marker}`,
    ]);

    const seenA = (underA[2] as { sku: string }[]).length;
    const seenB = (underB[2] as { sku: string }[]).length;

    if (seenA !== 1) {
      throw new Error(`Expected 1 row under org ${a.slug}, got ${seenA}`);
    }
    if (seenB !== 0) {
      throw new Error(
        `RLS FAIL: org ${b.slug} saw ${seenB} row(s) belonging to ${a.slug}`
      );
    }

    console.log(
      `OK: item for ${a.slug} visible under ${a.slug}, hidden under ${b.slug}`
    );
  } finally {
    await sql`DELETE FROM inventory_items WHERE sku = ${marker}`;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
