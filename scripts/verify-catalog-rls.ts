/**
 * Smoke-check catalog RLS: org A data is invisible under org B context.
 * Run: npx tsx scripts/verify-catalog-rls.ts (requires DATABASE_URL)
 * Creates an ephemeral second org for isolation check (seed already has nydac + test).
 */
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");
  const sql = neon(url);

  const [a] = await sql`SELECT id, slug FROM organizations WHERE slug = 'nydac' LIMIT 1`;
  if (!a) {
    throw new Error("Need nydac org — run npm run db:seed");
  }

  const probeSlug = `rls-probe-${Date.now()}`;
  const [b] = await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES (${probeSlug}, 'RLS Probe', '#000000', 'RLS Probe')
    RETURNING id, slug
  `;

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
    await sql`DELETE FROM organizations WHERE id = ${b.id}`;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
