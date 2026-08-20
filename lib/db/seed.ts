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

const ORG_SLUG = "nydac";
const ORG_NAME = "New York Design and Construction";

async function seed() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required");
  }
  const sql = neon(url);
  const passwordHash = await bcrypt.hash("password123", 10);

  const logoUrl = "/seed/test-tenant-logo.svg";
  const primaryColor = "#0f172a";

  await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name, logo_url)
    VALUES
      (${ORG_SLUG}, ${ORG_NAME}, ${primaryColor}, ${ORG_NAME}, ${logoUrl})
    ON CONFLICT (slug) DO NOTHING
  `;

  // Always refresh NYDAC branding so re-seed applies name/logo without full reset.
  await sql`
    UPDATE organizations
    SET
      name = ${ORG_NAME},
      email_from_name = ${ORG_NAME},
      logo_url = ${logoUrl},
      primary_color = ${primaryColor}
    WHERE slug = ${ORG_SLUG}
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
    { email: "dom@redbull.test", first: "Dom", last: "" },
  ] as const;

  // Migrate superseded second Red Bull user (Alex → Dom) if still present.
  await sql`
    UPDATE users
    SET email = 'dom@redbull.test', first_name = 'Dom', last_name = ''
    WHERE email = 'alex@redbull.test'
      AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'dom@redbull.test')
  `;

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
    WHERE o.slug = ${ORG_SLUG} AND u.email = 'ed@test.test'
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = true, is_manager = true, is_staff = false, is_client = false
  `;
  // Mike Oso + Don — Managers
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, true, false, false
    FROM organizations o, users u
    WHERE o.slug = ${ORG_SLUG} AND u.email IN ('mike@test.test', 'don@test.test')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = true, is_staff = false, is_client = false
  `;
  // Staff: Paul, Tom, Rob, Jerome
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, true, false
    FROM organizations o, users u
    WHERE o.slug = ${ORG_SLUG}
      AND u.email IN (
        'paul@test.test',
        'tom@test.test',
        'rob@test.test',
        'jerome@test.test'
      )
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = false, is_staff = true, is_client = false
  `;
  // Clients: Michaela + Dom (Red Bull)
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, false, true
    FROM organizations o, users u
    WHERE o.slug = ${ORG_SLUG}
      AND u.email IN ('michaela@redbull.test', 'dom@redbull.test')
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = false, is_staff = false, is_client = true
  `;
  // Warehouse: Tom + Rob
  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'warehouse'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = ${ORG_SLUG} AND u.email IN ('tom@test.test', 'rob@test.test')
    ON CONFLICT DO NOTHING
  `;
  // Driver: Paul + Jerome
  await sql`
    INSERT INTO staff_capability_tags (membership_id, tag)
    SELECT m.id, 'driver'
    FROM org_memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.org_id
    WHERE o.slug = ${ORG_SLUG} AND u.email IN ('paul@test.test', 'jerome@test.test')
    ON CONFLICT DO NOTHING
  `;

  await sql`
    INSERT INTO client_companies (org_id, name)
    SELECT o.id, 'Red Bull'
    FROM organizations o
    WHERE o.slug = ${ORG_SLUG}
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
    JOIN users u ON u.email IN ('michaela@redbull.test', 'dom@redbull.test')
    WHERE o.slug = ${ORG_SLUG}
    ON CONFLICT (client_company_id, user_id) DO NOTHING
  `;

  await sql`
    INSERT INTO client_inventory_items (org_id, client_company_id, sku, name, total_quantity)
    SELECT o.id, c.id, 'RB-BAR-01', 'Branded Bar', 10
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    WHERE o.slug = ${ORG_SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_items i
        WHERE i.org_id = o.id AND i.sku = 'RB-BAR-01'
      )
  `;
  await sql`
    INSERT INTO inventory_items (org_id, sku, name, total_quantity)
    SELECT o.id, 'DOLLY-01', 'Dolly', 20
    FROM organizations o
    WHERE o.slug = ${ORG_SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM inventory_items i WHERE i.org_id = o.id AND i.sku = 'DOLLY-01'
      )
  `;
  await sql`
    INSERT INTO fleet_vehicles (org_id, name, plate)
    SELECT o.id, 'Box Truck 12', 'TST-012'
    FROM organizations o
    WHERE o.slug = ${ORG_SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM fleet_vehicles f WHERE f.org_id = o.id AND f.name = 'Box Truck 12'
      )
  `;

  console.log(`
Seed complete. Password for all accounts: password123

  nydac (http://nydac.localhost:3000)
    ed@test.test              OrgAdmin (Ed)
    mike@test.test            Manager (Mike Oso)
    don@test.test             Manager (Don)
    paul@test.test            Staff / driver
    tom@test.test             Staff / warehouse
    rob@test.test             Staff / warehouse
    jerome@test.test          Staff / driver
    michaela@redbull.test     Client / POC (Red Bull)
    dom@redbull.test          Client (Red Bull)
`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
