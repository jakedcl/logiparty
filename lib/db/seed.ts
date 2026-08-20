/**
 * Golden-path seed — run: npm run db:seed (requires DATABASE_URL)
 * Safe to re-run: uses ON CONFLICT / existence checks.
 *
 * Creates THREE fully populated tenants:
 *   - nydac  → New York Design and Construction (Jake's cast + rich warehouse)
 *   - test   → Acme Event Logistics (playground cast + Monster)
 *   - axis   → Axis Global Staging (generic cast + Volt Energy)
 *
 * After base orgs, seedNydacRich() beefs up nydac only (extra clients,
 * inventory, fleet, multi-status jobs, crew, activity).
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

// Tagged-template neon client. Avoid ReturnType<typeof neon> — package generics disagree with neon(url).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = any;

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
  /** One upcoming job so Jobs list isn't empty after seed. */
  sampleJob: {
    name: string;
    locationLabel: string;
    address: string;
    pocName: string;
  };
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
  sampleJob: {
    name: "Red Bull Summer Pop-Up",
    locationLabel: "Load-in",
    address: "200 Pier 17, New York, NY",
    pocName: "Michaela",
  },
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
  sampleJob: {
    name: "Monster Campus Activation",
    locationLabel: "Venue",
    address: "1 Acme Way, Austin, TX",
    pocName: "Nina",
  },
};

const AXIS: SeedOrg = {
  slug: "axis",
  name: "Axis Global Staging",
  logoUrl: "/seed/axis-logo.svg",
  primaryColor: "#0f766e",
  people: [
    { email: "jordan@axis.test", first: "Jordan", last: "Hale" },
    { email: "avery@axis.test", first: "Avery", last: "Quinn" },
    { email: "casey@axis.test", first: "Casey", last: "Reed" },
    { email: "drew@axis.test", first: "Drew", last: "Park" },
    { email: "blake@axis.test", first: "Blake", last: "Ortiz" },
    { email: "taylor@volt.test", first: "Taylor", last: "Kim" },
    { email: "reese@volt.test", first: "Reese", last: "Ng" },
  ],
  orgAdminEmails: ["jordan@axis.test"],
  managerEmails: ["avery@axis.test"],
  staffEmails: ["casey@axis.test", "drew@axis.test", "blake@axis.test"],
  warehouseEmails: ["casey@axis.test", "drew@axis.test"],
  driverEmails: ["blake@axis.test"],
  clientEmails: ["taylor@volt.test", "reese@volt.test"],
  clientCompany: "Volt Energy",
  clientTitles: {
    "taylor@volt.test": "POC",
    "reese@volt.test": "Rep",
  },
  clientInventory: { sku: "VT-KIOSK-01", name: "Brand Kiosk", qty: 8 },
  orgInventory: { sku: "CART-01", name: "Utility Cart", qty: 12 },
  fleet: { name: "Box Truck 7", plate: "AXS-007" },
  sampleJob: {
    name: "Volt Trade Show Load-In",
    locationLabel: "Hall B",
    address: "500 Expo Blvd, Chicago, IL",
    pocName: "Taylor Kim",
  },
};

const ORGS: readonly SeedOrg[] = [NYDAC, TEST, AXIS];

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

  const job = org.sampleJob;
  const adminEmail = org.orgAdminEmails[0];
  await sql`
    INSERT INTO jobs (
      org_id, client_company_id, name, status,
      job_start, job_end, client_poc_name, created_by
    )
    SELECT
      o.id,
      c.id,
      ${job.name},
      'upcoming',
      NOW() + INTERVAL '7 days',
      NOW() + INTERVAL '8 days',
      ${job.pocName},
      u.id
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = ${org.clientCompany}
    JOIN users u ON u.email = ${adminEmail}
    WHERE o.slug = ${org.slug}
      AND NOT EXISTS (
        SELECT 1 FROM jobs j WHERE j.org_id = o.id AND j.name = ${job.name}
      )
  `;

  await sql`
    INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
    SELECT j.id, j.org_id, ${job.locationLabel}, ${job.address}, 0
    FROM jobs j
    JOIN organizations o ON o.id = j.org_id
    WHERE o.slug = ${org.slug} AND j.name = ${job.name}
      AND NOT EXISTS (
        SELECT 1 FROM job_locations jl WHERE jl.job_id = j.id
      )
  `;
}

/** Extra NYDAC client portal users (emails unique vs test/axis casts). */
const NYDAC_EXTRA_PEOPLE: readonly SeedPerson[] = [
  { email: "sara@monster.nydac.test", first: "Sara", last: "Chen" },
  { email: "lee@monster.nydac.test", first: "Lee", last: "Park" },
  { email: "maya@gothamglow.test", first: "Maya", last: "Ruiz" },
  { email: "nick@gothamglow.test", first: "Nick", last: "Bell" },
];

const NYDAC_WAREHOUSE = "88 Bushwick Ave, Brooklyn, NY 11211";
const NYDAC_YARD = "44 Review Ave, Long Island City, NY 11101";

const NYDAC_SITES = [
  {
    name: "Bushwick Warehouse",
    address: NYDAC_WAREHOUSE,
  },
  {
    name: "Queens Yard",
    address: NYDAC_YARD,
  },
] as const;

type RichInvItem = {
  sku: string;
  name: string;
  qty: number;
  description?: string;
};

type RichFleet = {
  name: string;
  plate: string;
  description?: string;
  isActive?: boolean;
};

type RichJobLine = {
  itemType: "client" | "org";
  sku: string;
  quantityAssigned: number;
  quantityLoaded: number;
};

type RichCrew = {
  email: string;
  phase: "LoadIn" | "LoadOut";
  role: "Driver" | "Laborer" | "Lead";
};

type RichJob = {
  name: string;
  clientCompany: string;
  status: "draft" | "upcoming" | "ready" | "completed" | "denied";
  pocName: string;
  pocPhone?: string;
  leadEmail: string;
  notes?: string;
  /** Relative day offsets from NOW for scheduling. */
  timing: {
    jobStartDays: number;
    jobEndDays: number;
    loadInStartDays?: number;
    loadInEndDays?: number;
    loadOutStartDays?: number;
    loadOutEndDays?: number;
  };
  locations: { label: string; address: string }[];
  inventory: RichJobLine[];
  fleetNames: string[];
  crew: RichCrew[];
};

async function ensureClientCompany(sql: Sql, companyName: string) {
  await sql`
    INSERT INTO client_companies (org_id, name)
    SELECT o.id, ${companyName}
    FROM organizations o
    WHERE o.slug = 'nydac'
      AND NOT EXISTS (
        SELECT 1 FROM client_companies c
        WHERE c.org_id = o.id AND c.name = ${companyName}
      )
  `;
}

/** Two NYDAC storage sites for Inventory location filter smoke. */
async function ensureNydacWarehouses(sql: Sql) {
  for (const site of NYDAC_SITES) {
    await sql`
      INSERT INTO warehouses (org_id, name, address, is_active)
      SELECT o.id, ${site.name}, ${site.address}, true
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND NOT EXISTS (
          SELECT 1 FROM warehouses w
          WHERE w.org_id = o.id AND w.name = ${site.name}
        )
    `;
    await sql`
      UPDATE warehouses w
      SET address = ${site.address}, is_active = true
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND w.org_id = o.id
        AND w.name = ${site.name}
    `;
  }

  // Split existing catalog rows across the two sites (idempotent-ish).
  await sql`
    UPDATE client_inventory_items i
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND i.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Bushwick Warehouse'
      AND i.warehouse_id IS NULL
      AND mod(abs(hashtext(i.sku)), 2) = 0
  `;
  await sql`
    UPDATE client_inventory_items i
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND i.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Queens Yard'
      AND i.warehouse_id IS NULL
  `;
  await sql`
    UPDATE inventory_items i
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND i.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Bushwick Warehouse'
      AND i.warehouse_id IS NULL
      AND mod(abs(hashtext(i.sku)), 2) = 0
  `;
  await sql`
    UPDATE inventory_items i
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND i.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Queens Yard'
      AND i.warehouse_id IS NULL
  `;
  await sql`
    UPDATE fleet_vehicles f
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND f.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Bushwick Warehouse'
      AND f.warehouse_id IS NULL
      AND mod(abs(hashtext(f.name)), 2) = 0
  `;
  await sql`
    UPDATE fleet_vehicles f
    SET warehouse_id = w.id
    FROM organizations o, warehouses w
    WHERE o.slug = 'nydac'
      AND f.org_id = o.id
      AND w.org_id = o.id
      AND w.name = 'Queens Yard'
      AND f.warehouse_id IS NULL
  `;
}

async function ensureClientItems(
  sql: Sql,
  companyName: string,
  items: readonly RichInvItem[]
) {
  for (const item of items) {
    await sql`
      INSERT INTO client_inventory_items (
        org_id, client_company_id, sku, name, description, total_quantity
      )
      SELECT o.id, c.id, ${item.sku}, ${item.name}, ${item.description ?? null}, ${item.qty}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = ${companyName}
      WHERE o.slug = 'nydac'
        AND NOT EXISTS (
          SELECT 1 FROM client_inventory_items i
          WHERE i.org_id = o.id AND i.sku = ${item.sku}
        )
    `;
    await sql`
      UPDATE client_inventory_items i
      SET
        name = ${item.name},
        description = ${item.description ?? null},
        total_quantity = ${item.qty}
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND i.org_id = o.id
        AND i.sku = ${item.sku}
    `;
  }
}

async function ensureOrgItems(sql: Sql, items: readonly RichInvItem[]) {
  for (const item of items) {
    await sql`
      INSERT INTO inventory_items (org_id, sku, name, description, total_quantity)
      SELECT o.id, ${item.sku}, ${item.name}, ${item.description ?? null}, ${item.qty}
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND NOT EXISTS (
          SELECT 1 FROM inventory_items i
          WHERE i.org_id = o.id AND i.sku = ${item.sku}
        )
    `;
    await sql`
      UPDATE inventory_items i
      SET
        name = ${item.name},
        description = ${item.description ?? null},
        total_quantity = ${item.qty}
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND i.org_id = o.id
        AND i.sku = ${item.sku}
    `;
  }
}

async function ensureFleetVehicles(sql: Sql, vehicles: readonly RichFleet[]) {
  for (const v of vehicles) {
    const active = v.isActive !== false;
    await sql`
      INSERT INTO fleet_vehicles (org_id, name, plate, description, is_active)
      SELECT o.id, ${v.name}, ${v.plate}, ${v.description ?? null}, ${active}
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND NOT EXISTS (
          SELECT 1 FROM fleet_vehicles f
          WHERE f.org_id = o.id AND f.name = ${v.name}
        )
    `;
    await sql`
      UPDATE fleet_vehicles f
      SET
        plate = ${v.plate},
        description = ${v.description ?? null},
        is_active = ${active}
      FROM organizations o
      WHERE o.slug = 'nydac'
        AND f.org_id = o.id
        AND f.name = ${v.name}
    `;
  }
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function optionalDays(days: number | undefined): Date | null {
  return days === undefined ? null : daysFromNow(days);
}

async function ensureJobShell(sql: Sql, job: RichJob) {
  const t = job.timing;
  const jobStart = daysFromNow(t.jobStartDays);
  const jobEnd = daysFromNow(t.jobEndDays);
  const loadInStart = optionalDays(t.loadInStartDays);
  const loadInEnd = optionalDays(t.loadInEndDays);
  const loadOutStart = optionalDays(t.loadOutStartDays);
  const loadOutEnd = optionalDays(t.loadOutEndDays);

  await sql`
    INSERT INTO jobs (
      org_id, client_company_id, name, status,
      job_start, job_end,
      load_in_start, load_in_end, load_out_start, load_out_end,
      client_poc_name, client_poc_phone, job_lead_user_id, notes, created_by
    )
    SELECT
      o.id,
      c.id,
      ${job.name},
      ${job.status},
      ${jobStart},
      ${jobEnd},
      ${loadInStart},
      ${loadInEnd},
      ${loadOutStart},
      ${loadOutEnd},
      ${job.pocName},
      ${job.pocPhone ?? null},
      lead.id,
      ${job.notes ?? null},
      ed.id
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = ${job.clientCompany}
    JOIN users ed ON ed.email = 'ed@test.test'
    JOIN users lead ON lead.email = ${job.leadEmail}
    WHERE o.slug = 'nydac'
      AND NOT EXISTS (
        SELECT 1 FROM jobs j WHERE j.org_id = o.id AND j.name = ${job.name}
      )
  `;

  // Refresh schedule / status / lead on re-seed so dates stay relative to NOW.
  await sql`
    UPDATE jobs j
    SET
      status = ${job.status},
      job_start = ${jobStart},
      job_end = ${jobEnd},
      load_in_start = ${loadInStart},
      load_in_end = ${loadInEnd},
      load_out_start = ${loadOutStart},
      load_out_end = ${loadOutEnd},
      client_poc_name = ${job.pocName},
      client_poc_phone = ${job.pocPhone ?? null},
      job_lead_user_id = lead.id,
      notes = ${job.notes ?? null},
      updated_at = NOW()
    FROM organizations o, users lead
    WHERE o.slug = 'nydac'
      AND j.org_id = o.id
      AND j.name = ${job.name}
      AND lead.email = ${job.leadEmail}
  `;
}

async function ensureJobLocations(
  sql: Sql,
  jobName: string,
  locations: { label: string; address: string }[]
) {
  // Replace locations so sort_order stays unique vs thin base-seed rows.
  await sql`
    DELETE FROM job_locations jl
    USING jobs j, organizations o
    WHERE jl.job_id = j.id
      AND j.org_id = o.id
      AND o.slug = 'nydac'
      AND j.name = ${jobName}
  `;

  let sort = 0;
  for (const loc of locations) {
    await sql`
      INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
      SELECT j.id, j.org_id, ${loc.label}, ${loc.address}, ${sort}
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      WHERE o.slug = 'nydac' AND j.name = ${jobName}
    `;
    sort += 1;
  }
}

async function ensureJobInventory(sql: Sql, jobName: string, lines: RichJobLine[]) {
  for (const line of lines) {
    if (line.itemType === "client") {
      await sql`
        INSERT INTO job_inventory_lines (
          job_id, org_id, item_type, client_item_id, org_item_id,
          quantity_assigned, quantity_loaded
        )
        SELECT
          j.id, j.org_id, 'client', ci.id, NULL,
          ${line.quantityAssigned}, ${line.quantityLoaded}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN client_inventory_items ci ON ci.org_id = o.id AND ci.sku = ${line.sku}
        WHERE o.slug = 'nydac' AND j.name = ${jobName}
          AND NOT EXISTS (
            SELECT 1 FROM job_inventory_lines l
            WHERE l.job_id = j.id AND l.client_item_id = ci.id
          )
      `;
      await sql`
        UPDATE job_inventory_lines l
        SET
          quantity_assigned = ${line.quantityAssigned},
          quantity_loaded = ${line.quantityLoaded}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN client_inventory_items ci ON ci.org_id = o.id AND ci.sku = ${line.sku}
        WHERE o.slug = 'nydac'
          AND j.name = ${jobName}
          AND l.job_id = j.id
          AND l.client_item_id = ci.id
      `;
    } else {
      await sql`
        INSERT INTO job_inventory_lines (
          job_id, org_id, item_type, client_item_id, org_item_id,
          quantity_assigned, quantity_loaded
        )
        SELECT
          j.id, j.org_id, 'org', NULL, oi.id,
          ${line.quantityAssigned}, ${line.quantityLoaded}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN inventory_items oi ON oi.org_id = o.id AND oi.sku = ${line.sku}
        WHERE o.slug = 'nydac' AND j.name = ${jobName}
          AND NOT EXISTS (
            SELECT 1 FROM job_inventory_lines l
            WHERE l.job_id = j.id AND l.org_item_id = oi.id
          )
      `;
      await sql`
        UPDATE job_inventory_lines l
        SET
          quantity_assigned = ${line.quantityAssigned},
          quantity_loaded = ${line.quantityLoaded}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN inventory_items oi ON oi.org_id = o.id AND oi.sku = ${line.sku}
        WHERE o.slug = 'nydac'
          AND j.name = ${jobName}
          AND l.job_id = j.id
          AND l.org_item_id = oi.id
      `;
    }
  }
}

async function ensureJobFleet(sql: Sql, jobName: string, fleetNames: string[]) {
  for (const name of fleetNames) {
    await sql`
      INSERT INTO job_fleet_assignments (job_id, fleet_vehicle_id, org_id)
      SELECT j.id, f.id, j.org_id
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      JOIN fleet_vehicles f ON f.org_id = o.id AND f.name = ${name}
      WHERE o.slug = 'nydac' AND j.name = ${jobName}
      ON CONFLICT DO NOTHING
    `;
  }
}

async function ensureJobCrew(sql: Sql, jobName: string, crew: RichCrew[]) {
  // Replace crew so re-seed can reshuffle assignments (ON CONFLICT alone can't remove).
  await sql`
    DELETE FROM job_assignments ja
    USING jobs j, organizations o
    WHERE ja.job_id = j.id
      AND j.org_id = o.id
      AND o.slug = 'nydac'
      AND j.name = ${jobName}
  `;

  for (const c of crew) {
    await sql`
      INSERT INTO job_assignments (job_id, org_id, user_id, phase, assigned_role)
      SELECT j.id, j.org_id, u.id, ${c.phase}, ${c.role}
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      JOIN users u ON u.email = ${c.email}
      WHERE o.slug = 'nydac' AND j.name = ${jobName}
      ON CONFLICT (job_id, user_id, phase) DO UPDATE SET
        assigned_role = EXCLUDED.assigned_role
    `;
  }
}

async function ensureActivity(
  sql: Sql,
  jobName: string,
  actorEmail: string,
  action: string,
  entityType: string,
  isClientVisible = false
) {
  await sql`
    INSERT INTO activity_logs (
      org_id, job_id, user_id, action, entity_type, entity_id,
      metadata, is_client_visible
    )
    SELECT
      j.org_id, j.id, u.id, ${action}, ${entityType}, j.id,
      '{}'::jsonb, ${isClientVisible}
    FROM jobs j
    JOIN organizations o ON o.id = j.org_id
    JOIN users u ON u.email = ${actorEmail}
    WHERE o.slug = 'nydac' AND j.name = ${jobName}
      AND NOT EXISTS (
        SELECT 1 FROM activity_logs a
        WHERE a.job_id = j.id AND a.action = ${action} AND a.user_id = u.id
      )
  `;
}

/**
 * Beefy NYDAC warehouse — extra clients, catalogs, fleet, multi-status jobs.
 * Idempotent; safe after base seedOrg('nydac').
 */
async function seedNydacRich(sql: Sql, passwordHash: string) {
  await upsertPeople(sql, NYDAC_EXTRA_PEOPLE, passwordHash);

  // Client memberships for Monster + Gotham Glow
  const extraClientEmails = NYDAC_EXTRA_PEOPLE.map((p) => p.email);
  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, false, true
    FROM organizations o, users u
    WHERE o.slug = 'nydac' AND u.email = ANY(${extraClientEmails})
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      is_org_admin = false, is_manager = false, is_staff = false, is_client = true
  `;

  await ensureClientCompany(sql, "Monster Energy");
  await ensureClientCompany(sql, "Gotham Glow");

  for (const email of ["sara@monster.nydac.test", "lee@monster.nydac.test"]) {
    const title = email.startsWith("sara") ? "POC" : "Rep";
    await sql`
      INSERT INTO client_users (org_id, client_company_id, user_id, title)
      SELECT o.id, c.id, u.id, ${title}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = 'Monster Energy'
      JOIN users u ON u.email = ${email}
      WHERE o.slug = 'nydac'
      ON CONFLICT (client_company_id, user_id) DO NOTHING
    `;
  }
  for (const email of ["maya@gothamglow.test", "nick@gothamglow.test"]) {
    const title = email.startsWith("maya") ? "POC" : "Rep";
    await sql`
      INSERT INTO client_users (org_id, client_company_id, user_id, title)
      SELECT o.id, c.id, u.id, ${title}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = 'Gotham Glow'
      JOIN users u ON u.email = ${email}
      WHERE o.slug = 'nydac'
      ON CONFLICT (client_company_id, user_id) DO NOTHING
    `;
  }

  // —— Client inventory (many SKUs) ——
  await ensureClientItems(sql, "Red Bull", [
    {
      sku: "RB-BAR-01",
      name: "Branded Bar",
      qty: 14,
      description: "Red Bull wing-branded portable bar",
    },
    {
      sku: "RB-COOLER-24",
      name: "Can Cooler 24qt",
      qty: 48,
      description: "Rolling cooler for cans",
    },
    {
      sku: "RB-BANNER-10",
      name: "Backdrop Banner 10ft",
      qty: 12,
      description: "Tension fabric backdrop",
    },
    {
      sku: "RB-CASE-SLEEVE",
      name: "Case Sleeve Display",
      qty: 60,
      description: "Floor case wraps",
    },
    {
      sku: "RB-LOUNGE-SOFA",
      name: "Lounge Sofa Module",
      qty: 8,
      description: "Modular lounge seating",
    },
    {
      sku: "RB-HIGHBOY",
      name: "Highboy Table",
      qty: 20,
      description: "Branded cocktail highboy",
    },
    {
      sku: "RB-LED-CUBE",
      name: "LED Cube Seat",
      qty: 24,
      description: "Illuminated cube seating",
    },
  ]);

  await ensureClientItems(sql, "Monster Energy", [
    {
      sku: "MN-TENT-10",
      name: "Claw Tent 10x10",
      qty: 10,
      description: "Pop-up branded tent",
    },
    {
      sku: "MN-COOLER-ROLL",
      name: "Rolling Cooler",
      qty: 30,
      description: "Monster claw cooler",
    },
    {
      sku: "MN-BANNER-WALL",
      name: "Media Wall Banner",
      qty: 6,
      description: "8ft media wall",
    },
    {
      sku: "MN-BAR-CART",
      name: "Activation Bar Cart",
      qty: 4,
      description: "Mobile pour cart",
    },
    {
      sku: "MN-CASE-PALLET",
      name: "Case Pallet Wrap Kit",
      qty: 40,
      description: "Pallet wrap + headers",
    },
    {
      sku: "MN-STOOL",
      name: "Branded Stool",
      qty: 36,
      description: "Black claw stools",
    },
  ]);

  await ensureClientItems(sql, "Gotham Glow", [
    {
      sku: "GG-MIRROR-PANEL",
      name: "Mirror Panel 4x8",
      qty: 16,
      description: "Fashion mirror wall panel",
    },
    {
      sku: "GG-RUNWAY-RISER",
      name: "Runway Riser Section",
      qty: 12,
      description: "4ft runway deck section",
    },
    {
      sku: "GG-VANITY-CART",
      name: "Vanity Cart",
      qty: 6,
      description: "Backstage vanity with lights",
    },
    {
      sku: "GG-BANNER-SILK",
      name: "Silk Drop Banner",
      qty: 10,
      description: "Floor-to-ceiling silk",
    },
    {
      sku: "GG-LOUNGE-CHAIR",
      name: "Velvet Lounge Chair",
      qty: 18,
      description: "VIP lounge seating",
    },
    {
      sku: "GG-PED-CASE",
      name: "Pedestal Display Case",
      qty: 14,
      description: "Product pedestal + acrylic",
    },
  ]);

  // —— Our inventory ——
  await ensureOrgItems(sql, [
    {
      sku: "DOLLY-01",
      name: "Dolly",
      qty: 40,
      description: "Standard warehouse dolly",
    },
    {
      sku: "RAMP-ALUM-01",
      name: "Aluminum Load Ramp",
      qty: 8,
      description: "Folding aluminum ramp",
    },
    {
      sku: "TABLE-FOLD-6",
      name: "Folding Table 6ft",
      qty: 30,
      description: "Banquet folding table",
    },
    {
      sku: "CABLE-RAMP-3",
      name: "Cable Ramp 3-Channel",
      qty: 24,
      description: "Floor cable protector",
    },
    {
      sku: "HANDTRUCK-01",
      name: "Hand Truck",
      qty: 18,
      description: "Two-wheel hand truck",
    },
    {
      sku: "PALLET-JACK-01",
      name: "Pallet Jack",
      qty: 6,
      description: "Manual pallet jack",
    },
    {
      sku: "STRAP-RATCHET",
      name: "Ratchet Strap Pack",
      qty: 50,
      description: "Pack of 4 straps",
    },
    {
      sku: "CONE-TRAFFIC",
      name: "Traffic Cone",
      qty: 40,
      description: "28in safety cone",
    },
    {
      sku: "BLANKET-MOVE",
      name: "Moving Blanket",
      qty: 60,
      description: "Furniture pad",
    },
    {
      sku: "CART-UTILITY",
      name: "Utility Cart",
      qty: 12,
      description: "3-shelf utility cart",
    },
  ]);

  // —— Fleet ——
  await ensureFleetVehicles(sql, [
    {
      name: "Box Truck 12",
      plate: "NYD-012",
      description: "26ft box truck",
      isActive: true,
    },
    {
      name: "Box Truck 18",
      plate: "NYD-018",
      description: "26ft box with liftgate",
      isActive: true,
    },
    {
      name: "Cargo Van 4",
      plate: "NYD-004",
      description: "High-roof cargo van",
      isActive: true,
    },
    {
      name: "Sprinter 7",
      plate: "NYD-007",
      description: "Mercedes Sprinter crew van",
      isActive: true,
    },
    {
      name: "Box Truck 22",
      plate: "NYD-022",
      description: "Spare / shop truck",
      isActive: false,
    },
  ]);

  await ensureNydacWarehouses(sql);

  // —— Jobs across statuses ——
  const jobs: RichJob[] = [
    {
      name: "Red Bull Holiday Window Concept",
      clientCompany: "Red Bull",
      status: "draft",
      pocName: "Michaela",
      pocPhone: "212-555-0101",
      leadEmail: "mike@test.test",
      notes: "Client still finalizing window set. Do not book fleet yet.",
      timing: {
        jobStartDays: 28,
        jobEndDays: 30,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        {
          label: "Venue",
          address: "5th Ave & 57th St, New York, NY (window concept TBD)",
        },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "RB-BANNER-10",
          quantityAssigned: 2,
          quantityLoaded: 0,
        },
      ],
      fleetNames: [],
      crew: [],
    },
    {
      name: "Monster Rooftop Soft Ask",
      clientCompany: "Monster Energy",
      status: "denied",
      pocName: "Sara",
      pocPhone: "212-555-0202",
      leadEmail: "mike@test.test",
      notes: "Denied — no capacity that week; client told to re-request for Q4.",
      timing: {
        jobStartDays: -14,
        jobEndDays: -13,
      },
      locations: [
        { label: "Venue", address: "Rooftop TBD, Midtown Manhattan" },
      ],
      inventory: [],
      fleetNames: [],
      crew: [],
    },
    {
      // Base seed already creates this as upcoming — enrich to partial assign.
      name: "Red Bull Summer Pop-Up",
      clientCompany: "Red Bull",
      status: "upcoming",
      pocName: "Michaela",
      pocPhone: "212-555-0101",
      leadEmail: "mike@test.test",
      notes:
        "Partial assign — LoadIn crew set; LoadOut driver only (no LO labor) + cooler count pending.",
      timing: {
        jobStartDays: 7,
        jobEndDays: 8,
        loadInStartDays: 6,
        loadInEndDays: 7,
        loadOutStartDays: 8,
        loadOutEndDays: 9,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        { label: "Load-in", address: "200 Pier 17, New York, NY" },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "RB-BAR-01",
          quantityAssigned: 4,
          quantityLoaded: 2,
        },
        {
          itemType: "client",
          sku: "RB-COOLER-24",
          quantityAssigned: 12,
          quantityLoaded: 0,
        },
        {
          itemType: "org",
          sku: "DOLLY-01",
          quantityAssigned: 6,
          quantityLoaded: 6,
        },
      ],
      fleetNames: ["Cargo Van 4"],
      // LoadIn full; LoadOut driver only → stays upcoming (auto-ready incomplete)
      crew: [
        { email: "mike@test.test", phase: "LoadIn", role: "Lead" },
        { email: "paul@test.test", phase: "LoadIn", role: "Driver" },
        { email: "tom@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "jerome@test.test", phase: "LoadOut", role: "Driver" },
      ],
    },
    {
      name: "Monster Times Square Takeover",
      clientCompany: "Monster Energy",
      status: "upcoming",
      pocName: "Sara Chen",
      pocPhone: "646-555-0199",
      leadEmail: "don@test.test",
      notes:
        "Inventory assigned; fleet TBD. LoadIn crew set; LoadOut driver only. Sara wants claw tents front-and-center.",
      timing: {
        jobStartDays: 12,
        jobEndDays: 13,
        loadInStartDays: 11,
        loadInEndDays: 12,
        loadOutStartDays: 13,
        loadOutEndDays: 14,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        {
          label: "Venue",
          address: "1500 Broadway, New York, NY 10036",
        },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "MN-TENT-10",
          quantityAssigned: 4,
          quantityLoaded: 0,
        },
        {
          itemType: "client",
          sku: "MN-COOLER-ROLL",
          quantityAssigned: 10,
          quantityLoaded: 0,
        },
        {
          itemType: "client",
          sku: "MN-BANNER-WALL",
          quantityAssigned: 2,
          quantityLoaded: 0,
        },
        {
          itemType: "org",
          sku: "CABLE-RAMP-3",
          quantityAssigned: 8,
          quantityLoaded: 0,
        },
      ],
      fleetNames: [],
      // LoadIn full; LoadOut driver only → stays upcoming
      crew: [
        { email: "don@test.test", phase: "LoadIn", role: "Lead" },
        { email: "jerome@test.test", phase: "LoadIn", role: "Driver" },
        { email: "tom@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "paul@test.test", phase: "LoadOut", role: "Driver" },
      ],
    },
    {
      name: "Red Bull Brooklyn Mirage",
      clientCompany: "Red Bull",
      status: "ready",
      pocName: "Dom",
      pocPhone: "917-555-0144",
      leadEmail: "mike@test.test",
      notes: "Fully staged — auto-ready happy. Load-in Saturday AM.",
      timing: {
        jobStartDays: 3,
        jobEndDays: 4,
        loadInStartDays: 2,
        loadInEndDays: 3,
        loadOutStartDays: 4,
        loadOutEndDays: 5,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        {
          label: "Venue",
          address: "140 Stewart Ave, Brooklyn, NY 11237",
        },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "RB-BAR-01",
          quantityAssigned: 3,
          quantityLoaded: 3,
        },
        {
          itemType: "client",
          sku: "RB-HIGHBOY",
          quantityAssigned: 8,
          quantityLoaded: 8,
        },
        {
          itemType: "client",
          sku: "RB-LED-CUBE",
          quantityAssigned: 12,
          quantityLoaded: 12,
        },
        {
          itemType: "client",
          sku: "RB-LOUNGE-SOFA",
          quantityAssigned: 4,
          quantityLoaded: 4,
        },
        {
          itemType: "org",
          sku: "DOLLY-01",
          quantityAssigned: 10,
          quantityLoaded: 10,
        },
        {
          itemType: "org",
          sku: "RAMP-ALUM-01",
          quantityAssigned: 2,
          quantityLoaded: 2,
        },
        {
          itemType: "org",
          sku: "BLANKET-MOVE",
          quantityAssigned: 16,
          quantityLoaded: 16,
        },
      ],
      fleetNames: ["Box Truck 12", "Sprinter 7"],
      // Mike leads LoadIn; Don leads LoadOut — full warehouse + both drivers
      crew: [
        { email: "mike@test.test", phase: "LoadIn", role: "Lead" },
        { email: "paul@test.test", phase: "LoadIn", role: "Driver" },
        { email: "tom@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "don@test.test", phase: "LoadOut", role: "Lead" },
        { email: "jerome@test.test", phase: "LoadOut", role: "Driver" },
        { email: "tom@test.test", phase: "LoadOut", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadOut", role: "Laborer" },
      ],
    },
    {
      name: "Gotham Glow Fashion Week",
      clientCompany: "Gotham Glow",
      status: "ready",
      pocName: "Maya Ruiz",
      pocPhone: "718-555-0177",
      leadEmail: "don@test.test",
      notes: "Runway + vanity carts locked. Client visible accept logged.",
      timing: {
        jobStartDays: 5,
        jobEndDays: 6,
        loadInStartDays: 4,
        loadInEndDays: 5,
        loadOutStartDays: 6,
        loadOutEndDays: 7,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        {
          label: "Venue",
          address: "Skylight Clarkson Sq, 550 Washington St, New York, NY",
        },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "GG-RUNWAY-RISER",
          quantityAssigned: 8,
          quantityLoaded: 8,
        },
        {
          itemType: "client",
          sku: "GG-MIRROR-PANEL",
          quantityAssigned: 6,
          quantityLoaded: 6,
        },
        {
          itemType: "client",
          sku: "GG-VANITY-CART",
          quantityAssigned: 3,
          quantityLoaded: 3,
        },
        {
          itemType: "client",
          sku: "GG-LOUNGE-CHAIR",
          quantityAssigned: 10,
          quantityLoaded: 10,
        },
        {
          itemType: "org",
          sku: "TABLE-FOLD-6",
          quantityAssigned: 6,
          quantityLoaded: 6,
        },
        {
          itemType: "org",
          sku: "CABLE-RAMP-3",
          quantityAssigned: 10,
          quantityLoaded: 10,
        },
        {
          itemType: "org",
          sku: "CART-UTILITY",
          quantityAssigned: 4,
          quantityLoaded: 4,
        },
      ],
      fleetNames: ["Box Truck 18"],
      // Don both phases; Jerome drives LI, Paul drives LO; Tom+Rob both phases
      crew: [
        { email: "don@test.test", phase: "LoadIn", role: "Lead" },
        { email: "jerome@test.test", phase: "LoadIn", role: "Driver" },
        { email: "tom@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "don@test.test", phase: "LoadOut", role: "Lead" },
        { email: "paul@test.test", phase: "LoadOut", role: "Driver" },
        { email: "tom@test.test", phase: "LoadOut", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadOut", role: "Laborer" },
      ],
    },
    {
      name: "Red Bull Pier 17 Wrap",
      clientCompany: "Red Bull",
      status: "completed",
      pocName: "Michaela",
      pocPhone: "212-555-0101",
      leadEmail: "mike@test.test",
      notes: "Wrapped last week. Locks released (load_out_end in past).",
      timing: {
        jobStartDays: -14,
        jobEndDays: -12,
        loadInStartDays: -15,
        loadInEndDays: -14,
        loadOutStartDays: -12,
        loadOutEndDays: -11,
      },
      locations: [
        { label: "Warehouse", address: NYDAC_WAREHOUSE },
        { label: "Venue", address: "89 South St, New York, NY 10038" },
      ],
      inventory: [
        {
          itemType: "client",
          sku: "RB-BAR-01",
          quantityAssigned: 2,
          quantityLoaded: 2,
        },
        {
          itemType: "client",
          sku: "RB-CASE-SLEEVE",
          quantityAssigned: 20,
          quantityLoaded: 20,
        },
        {
          itemType: "org",
          sku: "DOLLY-01",
          quantityAssigned: 4,
          quantityLoaded: 4,
        },
        {
          itemType: "org",
          sku: "HANDTRUCK-01",
          quantityAssigned: 2,
          quantityLoaded: 2,
        },
      ],
      fleetNames: ["Box Truck 12"],
      // Mike LI lead; Don LO lead; both drivers + both warehouse on both phases
      crew: [
        { email: "mike@test.test", phase: "LoadIn", role: "Lead" },
        { email: "paul@test.test", phase: "LoadIn", role: "Driver" },
        { email: "tom@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadIn", role: "Laborer" },
        { email: "don@test.test", phase: "LoadOut", role: "Lead" },
        { email: "jerome@test.test", phase: "LoadOut", role: "Driver" },
        { email: "tom@test.test", phase: "LoadOut", role: "Laborer" },
        { email: "rob@test.test", phase: "LoadOut", role: "Laborer" },
      ],
    },
  ];

  for (const job of jobs) {
    await ensureJobShell(sql, job);
    await ensureJobLocations(sql, job.name, job.locations);
    await ensureJobInventory(sql, job.name, job.inventory);
    await ensureJobFleet(sql, job.name, job.fleetNames);
    await ensureJobCrew(sql, job.name, job.crew);
  }

  // Activity logs (accept / crew / ready flavor)
  await ensureActivity(
    sql,
    "Gotham Glow Fashion Week",
    "ed@test.test",
    'Accepted job request "Gotham Glow Fashion Week"',
    "job",
    true
  );
  await ensureActivity(
    sql,
    "Gotham Glow Fashion Week",
    "don@test.test",
    "Assigned crew (LoadIn / Lead)",
    "job_assignment"
  );
  await ensureActivity(
    sql,
    "Gotham Glow Fashion Week",
    "don@test.test",
    "Auto-promoted job to ready",
    "job"
  );
  await ensureActivity(
    sql,
    "Red Bull Brooklyn Mirage",
    "mike@test.test",
    "Assigned crew (LoadIn / Lead)",
    "job_assignment"
  );
  await ensureActivity(
    sql,
    "Red Bull Brooklyn Mirage",
    "mike@test.test",
    "Auto-promoted job to ready",
    "job"
  );
  await ensureActivity(
    sql,
    "Monster Times Square Takeover",
    "ed@test.test",
    'Accepted job request "Monster Times Square Takeover"',
    "job",
    true
  );
  await ensureActivity(
    sql,
    "Red Bull Pier 17 Wrap",
    "mike@test.test",
    "Marked job completed",
    "job"
  );

  // —— Sample pending inventory requests (Red Bull / Michaela) ——
  await sql`
    INSERT INTO client_inventory_requests (
      org_id, client_company_id, requested_by_user_id, type,
      client_inventory_item_id, proposed_sku, proposed_name,
      proposed_quantity, reason, status
    )
    SELECT o.id, c.id, u.id, 'qty_change'::inventory_request_type,
      i.id, i.sku, i.name, 60, 'Need more coolers for summer activations',
      'pending'::inventory_request_status
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    JOIN users u ON u.email = 'michaela@redbull.test'
    JOIN client_inventory_items i
      ON i.org_id = o.id AND i.client_company_id = c.id AND i.sku = 'RB-COOLER-24'
    WHERE o.slug = 'nydac'
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_requests r
        WHERE r.org_id = o.id
          AND r.client_company_id = c.id
          AND r.type = 'qty_change'
          AND r.status = 'pending'
          AND r.client_inventory_item_id = i.id
      )
  `;

  await sql`
    INSERT INTO client_inventory_requests (
      org_id, client_company_id, requested_by_user_id, type,
      proposed_sku, proposed_name, proposed_description, proposed_quantity,
      reason, status
    )
    SELECT o.id, c.id, u.id, 'add'::inventory_request_type,
      'RB-UMBRELLA-01', 'Branded Patio Umbrella', '8ft market umbrella with wings',
      6, 'New patio set for outdoor pop-ups',
      'pending'::inventory_request_status
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    JOIN users u ON u.email = 'michaela@redbull.test'
    WHERE o.slug = 'nydac'
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_requests r
        WHERE r.org_id = o.id
          AND r.client_company_id = c.id
          AND r.type = 'add'
          AND r.status = 'pending'
          AND r.proposed_sku = 'RB-UMBRELLA-01'
      )
  `;

  // —— Sample unread client note (Red Bull / Michaela) ——
  await sql`
    INSERT INTO client_notes (
      org_id, client_company_id, sent_by_user_id, subject, body
    )
    SELECT o.id, c.id, u.id,
      'Loading dock access Friday',
      'Hi team — we may need after-hours dock access this Friday for a Red Bull drop. Can someone confirm the window?'
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Red Bull'
    JOIN users u ON u.email = 'michaela@redbull.test'
    WHERE o.slug = 'nydac'
      AND NOT EXISTS (
        SELECT 1 FROM client_notes n
        WHERE n.org_id = o.id
          AND n.client_company_id = c.id
          AND n.subject = 'Loading dock access Friday'
          AND n.read_at IS NULL
      )
  `;

  console.log("  nydac rich: clients + inventory + fleet + 6 jobs seeded");
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

  await seedNydacRich(sql, passwordHash);

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
    sara@monster.nydac.test   Client / POC (Monster Energy)
    lee@monster.nydac.test    Client (Monster Energy)
    maya@gothamglow.test      Client / POC (Gotham Glow)
    nick@gothamglow.test      Client (Gotham Glow)
    logo: /seed/nydac-logo.svg
    jobs: Holiday Window (draft) · Monster Rooftop Soft Ask (denied) · Summer Pop-Up (upcoming) · Monster Times Square (upcoming)
          · Brooklyn Mirage (ready) · Gotham Fashion Week (ready) · Pier 17 Wrap (completed)

  test — Acme Event Logistics (http://test.localhost:3000)
    boss@playground.test      OrgAdmin (Alex Boss)
    riley@playground.test     Manager (Riley Lane)
    chris@playground.test     Staff / warehouse
    pat@playground.test       Staff / warehouse
    jamie@playground.test     Staff / driver
    nina@monster.test         Client / POC (Monster)
    kai@monster.test          Client (Monster)
    logo: /seed/test-tenant-logo.svg (orange TEST badge)

  axis — Axis Global Staging (http://axis.localhost:3000)
    jordan@axis.test          OrgAdmin (Jordan Hale)
    avery@axis.test           Manager (Avery Quinn)
    casey@axis.test           Staff / warehouse
    drew@axis.test            Staff / warehouse
    blake@axis.test           Staff / driver
    taylor@volt.test          Client / POC (Volt Energy)
    reese@volt.test           Client (Volt Energy)
    logo: /seed/axis-logo.svg (teal)
`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
