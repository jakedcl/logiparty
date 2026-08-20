/**
 * Golden-path seed — run: npm run db:seed (requires DATABASE_URL)
 * Safe to re-run: uses ON CONFLICT / existence checks.
 *
 * Creates TWO fully populated tenants:
 *   - nydac  → New York Design and Construction (Jake's cast + Red Bull)
 *   - test   → Acme Event Logistics (playground cast + Monster)
 *
 * users.email is globally unique — casts use different emails.
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

type Sql = ReturnType<typeof neon>;

type SeedPerson = {
  email: string;
  first: string;
  last: string;
};

type SeedOrg = {
  slug: string;
  name: string;
  logoUrl: string;
  primaryColor: string;
  people: readonly SeedPerson[];
  orgAdminEmails: readonly string[];
  managerEmails: readonly string[];
  staffEmails: readonly string[];
  warehouseEmails: readonly string[];
  driverEmails: readonly string[];
  clientEmails: readonly string[];
  clientCompany: string;
  clientTitles: Record<string, string>;
  clientInventory: { sku: string; name: string; qty: number };
  orgInventory: { sku: string; name: string; qty: number };
  fleet: { name: string; plate: string };
};

const NYDAC: SeedOrg = {
  slug: "nydac",
  name: "New York Design and Construction",
  logoUrl: "/seed/nydac-logo.svg",
  primaryColor: "#1e3a5f",
  people: [
    { email: "ed@test.test", first: "Ed", last: "" },
    { email: "mike@test.test", first: "Mike", last: "Oso" },
    { email: "don@test.test", first: "Don", last: "" },
    { email: "paul@test.test", first: "Paul", last: "" },
    { email: "tom@test.test", first: "Tom", last: "" },
    { email: "rob@test.test", first: "Rob", last: "" },
    { email: "jerome@test.test", first: "Jerome", last: "" },
    { email: "michaela@redbull.test", first: "Michaela", last: "" },
    { email: "dom@redbull.test", first: "Dom", last: "" },
  ],
  orgAdminEmails: ["ed@test.test"],
  managerEmails: ["mike@test.test", "don@test.test"],
  staffEmails: [
    "paul@test.test",
    "tom@test.test",
    "rob@test.test",
    "jerome@test.test",
  ],
  warehouseEmails: ["tom@test.test", "rob@test.test"],
  driverEmails: ["paul@test.test", "jerome@test.test"],
  clientEmails: ["michaela@redbull.test", "dom@redbull.test"],
  clientCompany: "Red Bull",
  clientTitles: {
    "michaela@redbull.test": "POC",
    "dom@redbull.test": "Rep",
  },
  clientInventory: { sku: "RB-BAR-01", name: "Branded Bar", qty: 10 },
  orgInventory: { sku: "DOLLY-01", name: "Dolly", qty: 20 },
  fleet: { name: "Box Truck 12", plate: "NYD-012" },
};

const TEST: SeedOrg = {
  slug: "test",
  name: "Acme Event Logistics",
  logoUrl: "/seed/test-tenant-logo.svg",
  primaryColor: "#ea580c",
  people: [
    { email: "boss@playground.test", first: "Alex", last: "Boss" },
    { email: "riley@playground.test", first: "Riley", last: "Lane" },
    { email: "chris@playground.test", first: "Chris", last: "Ware" },
    { email: "pat@playground.test", first: "Pat", last: "Stock" },
    { email: "jamie@playground.test", first: "Jamie", last: "Drive" },
    { email: "nina@monster.test", first: "Nina", last: "" },
    { email: "kai@monster.test", first: "Kai", last: "" },
  ],
  orgAdminEmails: ["boss@playground.test"],
  managerEmails: ["riley@playground.test"],
  staffEmails: [
    "chris@playground.test",
    "pat@playground.test",
    "jamie@playground.test",
  ],
  warehouseEmails: ["chris@playground.test", "pat@playground.test"],
  driverEmails: ["jamie@playground.test"],
  clientEmails: ["nina@monster.test", "kai@monster.test"],
  clientCompany: "Monster",
  clientTitles: {
    "nina@monster.test": "POC",
    "kai@monster.test": "Rep",
  },
  clientInventory: { sku: "MN-TENT-01", name: "Promo Tent", qty: 6 },
  orgInventory: { sku: "PALLET-JACK-01", name: "Pallet Jack", qty: 8 },
  fleet: { name: "Sprinter Van 3", plate: "ACM-003" },
};

const ORGS: readonly SeedOrg[] = [NYDAC, TEST];

async function upsertPeople(sql: Sql, people: readonly SeedPerson[], passwordHash: string) {
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
}

async function seedOrg(sql: Sql, org: SeedOrg, passwordHash: string) {
  await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name, logo_url)
    VALUES
      (${org.slug}, ${org.name}, ${org.primaryColor}, ${org.name}, ${org.logoUrl})
    ON CONFLICT (slug) DO NOTHING
  `;

  // Always refresh branding so re-seed applies name/logo without full reset.
  await sql`
    UPDATE organizations
    SET
      name = ${org.name},
      email_from_name = ${org.name},
      logo_url = ${org.logoUrl},
      primary_color = ${org.primaryColor}
    WHERE slug = ${org.slug}
  `;

  await upsertPeople(sql, org.people, passwordHash);

  for (const email of org.orgAdminEmails) {
    await sql`
      INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
      SELECT o.id, u.id, true, true, false, false
      FROM organizations o, users u
      WHERE o.slug = ${org.slug} AND u.email = ${email}
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        is_org_admin = true, is_manager = true, is_staff = false, is_client = false
    `;
  }

  if (org.managerEmails.length) {
    await sql`
      INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
      SELECT o.id, u.id, false, true, false, false
      FROM organizations o, users u
      WHERE o.slug = ${org.slug} AND u.email = ANY(${org.managerEmails})
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        is_org_admin = false, is_manager = true, is_staff = false, is_client = false
    `;
  }

  if (org.staffEmails.length) {
    await sql`
      INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
      SELECT o.id, u.id, false, false, true, false
      FROM organizations o, users u
      WHERE o.slug = ${org.slug} AND u.email = ANY(${org.staffEmails})
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        is_org_admin = false, is_manager = false, is_staff = true, is_client = false
    `;
  }

  if (org.clientEmails.length) {
    await sql`
      INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
      SELECT o.id, u.id, false, false, false, true
      FROM organizations o, users u
      WHERE o.slug = ${org.slug} AND u.email = ANY(${org.clientEmails})
      ON CONFLICT (org_id, user_id) DO UPDATE SET
        is_org_admin = false, is_manager = false, is_staff = false, is_client = true
    `;
  }

  if (org.warehouseEmails.length) {
    await sql`
      INSERT INTO staff_capability_tags (membership_id, tag)
      SELECT m.id, 'warehouse'
      FROM org_memberships m
      JOIN users u ON u.id = m.user_id
      JOIN organizations o ON o.id = m.org_id
      WHERE o.slug = ${org.slug} AND u.email = ANY(${org.warehouseEmails})
      ON CONFLICT DO NOTHING
    `;
  }

  if (org.driverEmails.length) {
    await sql`
      INSERT INTO staff_capability_tags (membership_id, tag)
      SELECT m.id, 'driver'
      FROM org_memberships m
      JOIN users u ON u.id = m.user_id
      JOIN organizations o ON o.id = m.org_id
      WHERE o.slug = ${org.slug} AND u.email = ANY(${org.driverEmails})
      ON CONFLICT DO NOTHING
    `;
  }

  await sql`
    INSERT INTO client_companies (org_id, name)
    SELECT o.id, ${org.clientCompany}
    FROM organizations o
    WHERE o.slug = ${org.slug}
      AND NOT EXISTS (
        SELECT 1 FROM client_companies c
        WHERE c.org_id = o.id AND c.name = ${org.clientCompany}
      )
  `;

  for (const email of org.clientEmails) {
    const title = org.clientTitles[email] ?? "Rep";
    await sql`
      INSERT INTO client_users (org_id, client_company_id, user_id, title)
      SELECT o.id, c.id, u.id, ${title}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = ${org.clientCompany}
      JOIN users u ON u.email = ${email}
      WHERE o.slug = ${org.slug}
      ON CONFLICT (client_company_id, user_id) DO NOTHING
    `;
  }

  const ci = org.clientInventory;
  await sql`
    INSERT INTO client_inventory_items (org_id, client_company_id, sku, name, total_quantity)
    SELECT o.id, c.id, ${ci.sku}, ${ci.name}, ${ci.qty}
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = ${org.clientCompany}
    WHERE o.slug = ${org.slug}
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_items i
        WHERE i.org_id = o.id AND i.sku = ${ci.sku}
      )
  `;

  const oi = org.orgInventory;
  await sql`
    INSERT INTO inventory_items (org_id, sku, name, total_quantity)
    SELECT o.id, ${oi.sku}, ${oi.name}, ${oi.qty}
    FROM organizations o
    WHERE o.slug = ${org.slug}
      AND NOT EXISTS (
        SELECT 1 FROM inventory_items i WHERE i.org_id = o.id AND i.sku = ${oi.sku}
      )
  `;

  const fl = org.fleet;
  await sql`
    INSERT INTO fleet_vehicles (org_id, name, plate)
    SELECT o.id, ${fl.name}, ${fl.plate}
    FROM organizations o
    WHERE o.slug = ${org.slug}
      AND NOT EXISTS (
        SELECT 1 FROM fleet_vehicles f WHERE f.org_id = o.id AND f.name = ${fl.name}
      )
  `;
}

async function seed() {
  loadEnvLocal();
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required");
  }
  const sql = neon(url);
  const passwordHash = await bcrypt.hash("password123", 10);

  // Migrate superseded second Red Bull user (Alex → Dom) if still present.
  await sql`
    UPDATE users
    SET email = 'dom@redbull.test', first_name = 'Dom', last_name = ''
    WHERE email = 'alex@redbull.test'
      AND NOT EXISTS (SELECT 1 FROM users WHERE email = 'dom@redbull.test')
  `;

  for (const org of ORGS) {
    await seedOrg(sql, org, passwordHash);
  }

  console.log(`
Seed complete. Password for all accounts: password123

  nydac — New York Design and Construction (http://nydac.localhost:3000)
    ed@test.test              OrgAdmin (Ed)
    mike@test.test            Manager (Mike Oso)
    don@test.test             Manager (Don)
    paul@test.test            Staff / driver
    tom@test.test             Staff / warehouse
    rob@test.test             Staff / warehouse
    jerome@test.test          Staff / driver
    michaela@redbull.test     Client / POC (Red Bull)
    dom@redbull.test          Client (Red Bull)
    logo: /seed/nydac-logo.svg

  test — Acme Event Logistics (http://test.localhost:3000)
    boss@playground.test      OrgAdmin (Alex Boss)
    riley@playground.test     Manager (Riley Lane)
    chris@playground.test     Staff / warehouse
    pat@playground.test       Staff / warehouse
    jamie@playground.test     Staff / driver
    nina@monster.test         Client / POC (Monster)
    kai@monster.test          Client (Monster)
    logo: /seed/test-tenant-logo.svg (orange TEST badge)
`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
