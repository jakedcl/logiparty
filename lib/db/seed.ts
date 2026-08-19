/**
 * Golden-path seed — run: npm run db:seed (requires DATABASE_URL)
 * Safe to re-run: uses ON CONFLICT / existence checks.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

async function seed() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required");
  }
  const sql = neon(url);
  const passwordHash = await bcrypt.hash("password123", 10);

  await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES
      ('test', 'TestTenant3PL', '#2563eb', 'TestTenant3PL'),
      ('demo', 'Demo Warehouse Co', '#059669', 'Demo Warehouse')
    ON CONFLICT (slug) DO NOTHING
  `;

  const people = [
    { email: "admin@test.test", first: "Alex", last: "Admin" },
    { email: "morgan@test.test", first: "Morgan", last: "Manager" },
    { email: "sam@test.test", first: "Sam", last: "Warehouse" },
    { email: "dana@test.test", first: "Dana", last: "Driver" },
    { email: "rep1@redbull.test", first: "Riley", last: "Rep" },
    { email: "rep2@redbull.test", first: "Robin", last: "Rep" },
    { email: "admin@demo.test", first: "Devon", last: "Demo" },
  ] as const;

  for (const p of people) {
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${p.email}, ${passwordHash}, ${p.first}, ${p.last})
      ON CONFLICT (email) DO NOTHING
    `;
  }

  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email = 'admin@test.test'
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email = 'morgan@test.test'
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, true, false
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email IN ('sam@test.test', 'dana@test.test')
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, false, true
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email IN ('rep1@redbull.test', 'rep2@redbull.test')
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'demo' AND u.email = 'admin@demo.test'
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;

  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'warehouse'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = 'test' AND u.email = 'sam@test.test'
    ON CONFLICT DO NOTHING
  `;
  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'driver'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = 'test' AND u.email = 'dana@test.test'
    ON CONFLICT DO NOTHING
  `;

  await sql`
    INSERT INTO client_companies (org_id, name)
    SELECT o.id, 'Red Bull'
    FROM organizations o
    WHERE o.slug = 'test'
      AND NOT EXISTS (
        SELECT 1 FROM client_companies c
        WHERE c.org_id = o.id AND c.name = 'Red Bull'
      )
  `;

  await sql`
    INSERT INTO client_users (org_id, client_company_id, user_id, title)
    SELECT o.id, c.id, u.id, 'Rep'
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    JOIN users u ON u.email IN ('rep1@redbull.test', 'rep2@redbull.test')
    WHERE o.slug = 'test'
    ON CONFLICT (client_company_id, user_id) DO NOTHING
  `;

  await sql`
    INSERT INTO client_inventory_items (org_id, client_company_id, sku, name, total_quantity)
    SELECT o.id, c.id, 'RB-BAR-01', 'Branded Bar', 10
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    WHERE o.slug = 'test'
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_items i
        WHERE i.org_id = o.id AND i.sku = 'RB-BAR-01'
      )
  `;
  await sql`
    INSERT INTO inventory_items (org_id, sku, name, total_quantity)
    SELECT o.id, 'DOLLY-01', 'Dolly', 20
    FROM organizations o
    WHERE o.slug = 'test'
      AND NOT EXISTS (
        SELECT 1 FROM inventory_items i WHERE i.org_id = o.id AND i.sku = 'DOLLY-01'
      )
  `;
  await sql`
    INSERT INTO fleet_vehicles (org_id, name, plate)
    SELECT o.id, 'Box Truck 12', 'TST-012'
    FROM organizations o
    WHERE o.slug = 'test'
      AND NOT EXISTS (
        SELECT 1 FROM fleet_vehicles f WHERE f.org_id = o.id AND f.name = 'Box Truck 12'
      )
  `;

  console.log(`
Seed complete. Password for all accounts: password123

  test (http://test.localhost:3000)
    admin@test.test     OrgAdmin (Alex)
    morgan@test.test    Manager
    sam@test.test       Staff / warehouse
    dana@test.test      Staff / driver
    rep1@redbull.test         Client (Red Bull)
    rep2@redbull.test         Client (Red Bull)

  demo (http://demo.localhost:3000)
    admin@demo.test           OrgAdmin (for RLS checks)
`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
