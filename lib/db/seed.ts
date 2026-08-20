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

  const testLogoUrl = "/seed/test-tenant-logo.svg";
  const testPrimaryColor = "#ea580c";

  await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name, logo_url)
    VALUES
      ('test', 'TestTenant3PL', ${testPrimaryColor}, 'TestTenant3PL', ${testLogoUrl}),
      ('demo', 'Demo Warehouse Co', '#059669', 'Demo Warehouse', NULL)
    ON CONFLICT (slug) DO NOTHING
  `;

  // Always refresh test-tenant branding so re-seed applies logo without full reset.
  await sql`
    UPDATE organizations
    SET logo_url = ${testLogoUrl}, primary_color = ${testPrimaryColor}
    WHERE slug = 'test'
  `;

  // Display names: first + last joined (empty last → single name like "Ed").
  const people = [
    { email: "ed@test.test", first: "Ed", last: "" },
    { email: "mike@test.test", first: "Mike", last: "Oso" },
    { email: "don@test.test", first: "Don", last: "" },
    { email: "paul@test.test", first: "Paul", last: "" },
    { email: "tom@test.test", first: "Tom", last: "" },
    { email: "rob@test.test", first: "Rob", last: "" },
    { email: "jerome@test.test", first: "Jerome", last: "" },
    { email: "michaela@redbull.test", first: "Michaela", last: "" },
    { email: "alex@redbull.test", first: "Alex", last: "" },
    { email: "admin@demo.test", first: "Devon", last: "Demo" },
  ] as const;

  for (const p of people) {
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES (${p.email}, ${passwordHash}, ${p.first}, ${p.last})
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name
    `;
  }

  // Ed — OrgAdmin (boss)
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email = 'ed@test.test'
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = true, is_manager = true, is_staff = false, is_client = false
  `;
  // Mike Oso + Don — Managers
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'test' AND u.email IN ('mike@test.test', 'don@test.test')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = true, is_staff = false, is_client = false
  `;
  // Staff: Paul, Tom, Rob, Jerome
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, true, false
    FROM organizations o, users u
    WHERE o.slug = 'test'
      AND u.email IN (
        'paul@test.test',
        'tom@test.test',
        'rob@test.test',
        'jerome@test.test'
      )
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = false, is_staff = true, is_client = false
  `;
  // Clients: Michaela + Alex (Red Bull)
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, false, true
    FROM organizations o, users u
    WHERE o.slug = 'test'
      AND u.email IN ('michaela@redbull.test', 'alex@redbull.test')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = false, is_staff = false, is_client = true
  `;
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'demo' AND u.email = 'admin@demo.test'
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;

  // Warehouse: Tom + Rob
  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'warehouse'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = 'test' AND u.email IN ('tom@test.test', 'rob@test.test')
    ON CONFLICT DO NOTHING
  `;
  // Driver: Paul + Jerome
  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'driver'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = 'test' AND u.email IN ('paul@test.test', 'jerome@test.test')
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
    SELECT o.id, c.id, u.id,
      CASE u.email
        WHEN 'michaela@redbull.test' THEN 'POC'
        ELSE 'Rep'
      END
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    JOIN users u ON u.email IN ('michaela@redbull.test', 'alex@redbull.test')
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
    ed@test.test              OrgAdmin (Ed)
    mike@test.test            Manager (Mike Oso)
    don@test.test             Manager (Don)
    paul@test.test            Staff / driver
    tom@test.test             Staff / warehouse
    rob@test.test             Staff / warehouse
    jerome@test.test          Staff / driver
    michaela@redbull.test     Client / POC (Red Bull)
    alex@redbull.test         Client (Red Bull)

  demo (http://demo.localhost:3000)
    admin@demo.test           OrgAdmin (for RLS checks)
`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
