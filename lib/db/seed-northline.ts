/**
 * Rich seed for the public-demo narrative org: Northline Logistics.
 * Generic clients (Summit Brands, Harbor Co.) — matches /demo scenario.
 *
 * Called after base seedOrg(NORTHLINE). Safe to re-run.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sql = any;

const SLUG = "northline";
const WAREHOUSE = "1200 Dock Rd, Brooklyn, NY";

function daysFromNow(days: number, hour = 9): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d;
}

export async function seedNorthlineRich(sql: Sql, passwordHash: string) {
  await sql`
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES ('sam@harbor.test', ${passwordHash}, 'Sam', 'Rivera')
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name
  `;

  await sql`
    INSERT INTO client_companies (org_id, name)
    SELECT o.id, 'Harbor Co.'
    FROM organizations o
    WHERE o.slug = ${SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM client_companies c
        WHERE c.org_id = o.id AND c.name = 'Harbor Co.'
      )
  `;

  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, false, false, false, true
    FROM organizations o, users u
    WHERE o.slug = ${SLUG} AND u.email = 'sam@harbor.test'
    ON CONFLICT (org_id, user_id) DO UPDATE SET is_client = true
  `;

  await sql`
    INSERT INTO client_users (org_id, user_id, client_company_id, title)
    SELECT o.id, u.id, c.id, 'POC'
    FROM organizations o
    JOIN users u ON u.email = 'sam@harbor.test'
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Harbor Co.'
    WHERE o.slug = ${SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM client_users cu
        WHERE cu.org_id = o.id AND cu.user_id = u.id
      )
  `;

  const summitItems = [
    ["SB-BAR-01", "Branded Bar", 10, "Activation bar unit"],
    ["SB-COOLER-24", "Rolling Cooler", 36, "24-can rolling cooler"],
    ["SB-HIGHBOY", "Highboy Table", 20, "Cocktail highboy"],
    ["SB-BANNER", "Backdrop Banner", 12, "10ft tension backdrop"],
    ["SB-LOUNGE", "Lounge Sofa", 8, "Modular lounge"],
  ] as const;

  for (const [sku, name, qty, description] of summitItems) {
    await sql`
      INSERT INTO client_inventory_items (
        org_id, client_company_id, sku, name, description, total_quantity
      )
      SELECT o.id, c.id, ${sku}, ${name}, ${description}, ${qty}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = 'Summit Brands'
      WHERE o.slug = ${SLUG}
        AND NOT EXISTS (
          SELECT 1 FROM client_inventory_items i
          WHERE i.org_id = o.id AND i.client_company_id = c.id AND i.sku = ${sku}
        )
    `;
    await sql`
      UPDATE client_inventory_items i
      SET name = ${name}, description = ${description}, total_quantity = ${qty}
      FROM organizations o, client_companies c
      WHERE i.org_id = o.id
        AND o.slug = ${SLUG}
        AND c.id = i.client_company_id
        AND c.name = 'Summit Brands'
        AND i.sku = ${sku}
    `;
  }

  const harborItems = [
    ["HC-RISER", "Riser Section", 12, "4ft deck section"],
    ["HC-MIRROR", "Mirror Panel", 16, "4x8 mirror panel"],
    ["HC-CHAIR", "Lounge Chair", 18, "Venue lounge chair"],
  ] as const;

  for (const [sku, name, qty, description] of harborItems) {
    await sql`
      INSERT INTO client_inventory_items (
        org_id, client_company_id, sku, name, description, total_quantity
      )
      SELECT o.id, c.id, ${sku}, ${name}, ${description}, ${qty}
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = 'Harbor Co.'
      WHERE o.slug = ${SLUG}
        AND NOT EXISTS (
          SELECT 1 FROM client_inventory_items i
          WHERE i.org_id = o.id AND i.client_company_id = c.id AND i.sku = ${sku}
        )
    `;
  }

  const orgItems = [
    ["DOLLY-01", "Dolly", 40, "Warehouse dolly"],
    ["RAMP-01", "Load Ramp", 8, "Aluminum ramp"],
    ["CART-01", "Utility Cart", 12, "3-shelf cart"],
    ["STRAP-01", "Ratchet Strap Pack", 50, "Pack of 4"],
    ["HANDTRUCK-01", "Hand Truck", 18, "Two-wheel"],
  ] as const;

  for (const [sku, name, qty, description] of orgItems) {
    await sql`
      INSERT INTO inventory_items (org_id, sku, name, description, total_quantity)
      SELECT o.id, ${sku}, ${name}, ${description}, ${qty}
      FROM organizations o
      WHERE o.slug = ${SLUG}
        AND NOT EXISTS (
          SELECT 1 FROM inventory_items i
          WHERE i.org_id = o.id AND i.sku = ${sku}
        )
    `;
    await sql`
      UPDATE inventory_items i
      SET name = ${name}, description = ${description}, total_quantity = ${qty}
      FROM organizations o
      WHERE i.org_id = o.id AND o.slug = ${SLUG} AND i.sku = ${sku}
    `;
  }

  const fleet = [
    ["Box Truck 12", "NL-012", "26ft box"],
    ["Box Truck 18", "NL-018", "Liftgate"],
    ["Cargo Van 4", "NL-004", "High roof"],
    ["Sprinter 7", "NL-007", "Crew van"],
  ] as const;

  for (const [name, plate, description] of fleet) {
    await sql`
      INSERT INTO fleet_vehicles (org_id, name, plate, description, is_active)
      SELECT o.id, ${name}, ${plate}, ${description}, true
      FROM organizations o
      WHERE o.slug = ${SLUG}
        AND NOT EXISTS (
          SELECT 1 FROM fleet_vehicles f
          WHERE f.org_id = o.id AND f.name = ${name}
        )
    `;
  }

  type JobDef = {
    name: string;
    client: string;
    status: string;
    poc: string;
    start: number;
    end: number;
    liS: number;
    liE: number;
    loS: number;
    loE: number;
    venue: string;
    notes: string;
  };

  const jobs: JobDef[] = [
    {
      name: "Outdoor Patio Activation",
      client: "Summit Brands",
      status: "draft",
      poc: "Alex Chen",
      start: 28,
      end: 29,
      liS: 27,
      liE: 28,
      loS: 29,
      loE: 30,
      venue: "440 Lafayette St, New York, NY",
      notes: "Client request — awaiting accept.",
    },
    {
      name: "Campus Pop-Up",
      client: "Summit Brands",
      status: "upcoming",
      poc: "Alex Chen",
      start: 14,
      end: 15,
      liS: 13,
      liE: 14,
      loS: 15,
      loE: 16,
      venue: "1 University Pl, New York, NY",
      notes: "Partial load — coolers still pending.",
    },
    {
      name: "Waterfront Festival",
      client: "Summit Brands",
      status: "ready",
      poc: "Jordan Lee",
      start: 5,
      end: 6,
      liS: 4,
      liE: 5,
      loS: 6,
      loE: 7,
      venue: "Pier 76, New York, NY",
      notes: "Fully staged — auto-ready.",
    },
    {
      name: "Showroom Load-In",
      client: "Harbor Co.",
      status: "ready",
      poc: "Sam Rivera",
      start: 8,
      end: 9,
      liS: 7,
      liE: 8,
      loS: 9,
      loE: 10,
      venue: "550 Washington St, New York, NY",
      notes: "Harbor showroom — risers locked.",
    },
    {
      name: "Trade Show Wrap",
      client: "Summit Brands",
      status: "completed",
      poc: "Alex Chen",
      start: -14,
      end: -12,
      liS: -15,
      liE: -14,
      loS: -12,
      loE: -11,
      venue: "Javits Center, New York, NY",
      notes: "Wrapped. Locks released.",
    },
  ];

  for (const job of jobs) {
    const jobStart = daysFromNow(job.start, 10);
    const jobEnd = daysFromNow(job.end, 22);
    const liStart = daysFromNow(job.liS, 7);
    const liEnd = daysFromNow(job.liE, 11);
    const loStart = daysFromNow(job.loS, 18);
    const loEnd = daysFromNow(job.loE, 22);

    await sql`
      INSERT INTO jobs (
        org_id, client_company_id, name, status,
        job_start, job_end, load_in_start, load_in_end,
        load_out_start, load_out_end, client_poc_name, notes, created_by
      )
      SELECT
        o.id, c.id, ${job.name}, ${job.status}::job_status,
        ${jobStart}, ${jobEnd}, ${liStart}, ${liEnd},
        ${loStart}, ${loEnd}, ${job.poc}, ${job.notes}, u.id
      FROM organizations o
      JOIN client_companies c ON c.org_id = o.id AND c.name = ${job.client}
      JOIN users u ON u.email = 'morgan@northline.test'
      WHERE o.slug = ${SLUG}
        AND NOT EXISTS (
          SELECT 1 FROM jobs j WHERE j.org_id = o.id AND j.name = ${job.name}
        )
    `;

    await sql`
      UPDATE jobs j
      SET
        status = ${job.status}::job_status,
        job_start = ${jobStart},
        job_end = ${jobEnd},
        load_in_start = ${liStart},
        load_in_end = ${liEnd},
        load_out_start = ${loStart},
        load_out_end = ${loEnd},
        client_poc_name = ${job.poc},
        notes = ${job.notes}
      FROM organizations o
      WHERE j.org_id = o.id AND o.slug = ${SLUG} AND j.name = ${job.name}
    `;

    await sql`
      INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
      SELECT j.id, j.org_id, 'Warehouse', ${WAREHOUSE}, 0
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      WHERE o.slug = ${SLUG} AND j.name = ${job.name}
        AND NOT EXISTS (
          SELECT 1 FROM job_locations l
          WHERE l.job_id = j.id AND l.label = 'Warehouse'
        )
    `;

    await sql`
      INSERT INTO job_locations (job_id, org_id, label, address, sort_order)
      SELECT j.id, j.org_id, 'Venue', ${job.venue}, 1
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      WHERE o.slug = ${SLUG} AND j.name = ${job.name}
        AND NOT EXISTS (
          SELECT 1 FROM job_locations l
          WHERE l.job_id = j.id AND l.label = 'Venue'
        )
    `;
  }

  const readyLines: {
    sku: string;
    type: "client" | "org";
    a: number;
    l: number;
  }[] = [
    { sku: "SB-BAR-01", type: "client", a: 3, l: 3 },
    { sku: "SB-HIGHBOY", type: "client", a: 8, l: 8 },
    { sku: "SB-LOUNGE", type: "client", a: 4, l: 4 },
    { sku: "DOLLY-01", type: "org", a: 10, l: 10 },
    { sku: "RAMP-01", type: "org", a: 2, l: 2 },
  ];

  for (const line of readyLines) {
    if (line.type === "client") {
      await sql`
        INSERT INTO job_inventory_lines (
          job_id, org_id, item_type, client_item_id, org_item_id,
          quantity_assigned, quantity_loaded
        )
        SELECT j.id, j.org_id, 'client', i.id, NULL, ${line.a}, ${line.l}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN client_inventory_items i ON i.org_id = o.id AND i.sku = ${line.sku}
        WHERE o.slug = ${SLUG} AND j.name = 'Waterfront Festival'
          AND NOT EXISTS (
            SELECT 1 FROM job_inventory_lines l
            WHERE l.job_id = j.id AND l.client_item_id = i.id
          )
      `;
      await sql`
        UPDATE job_inventory_lines l
        SET quantity_assigned = ${line.a}, quantity_loaded = ${line.l}
        FROM jobs j, organizations o, client_inventory_items i
        WHERE l.job_id = j.id
          AND j.org_id = o.id
          AND o.slug = ${SLUG}
          AND j.name = 'Waterfront Festival'
          AND l.client_item_id = i.id
          AND i.sku = ${line.sku}
      `;
    } else {
      await sql`
        INSERT INTO job_inventory_lines (
          job_id, org_id, item_type, client_item_id, org_item_id,
          quantity_assigned, quantity_loaded
        )
        SELECT j.id, j.org_id, 'org', NULL, i.id, ${line.a}, ${line.l}
        FROM jobs j
        JOIN organizations o ON o.id = j.org_id
        JOIN inventory_items i ON i.org_id = o.id AND i.sku = ${line.sku}
        WHERE o.slug = ${SLUG} AND j.name = 'Waterfront Festival'
          AND NOT EXISTS (
            SELECT 1 FROM job_inventory_lines l
            WHERE l.job_id = j.id AND l.org_item_id = i.id
          )
      `;
      await sql`
        UPDATE job_inventory_lines l
        SET quantity_assigned = ${line.a}, quantity_loaded = ${line.l}
        FROM jobs j, organizations o, inventory_items i
        WHERE l.job_id = j.id
          AND j.org_id = o.id
          AND o.slug = ${SLUG}
          AND j.name = 'Waterfront Festival'
          AND l.org_item_id = i.id
          AND i.sku = ${line.sku}
      `;
    }
  }

  for (const truck of ["Box Truck 12", "Sprinter 7"]) {
    await sql`
      INSERT INTO job_fleet_assignments (job_id, fleet_vehicle_id, org_id)
      SELECT j.id, f.id, j.org_id
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      JOIN fleet_vehicles f ON f.org_id = o.id AND f.name = ${truck}
      WHERE o.slug = ${SLUG} AND j.name = 'Waterfront Festival'
      ON CONFLICT DO NOTHING
    `;
  }

  const crew: { email: string; phase: string; role: string }[] = [
    { email: "morgan@northline.test", phase: "LoadIn", role: "Lead" },
    { email: "chris@northline.test", phase: "LoadIn", role: "Driver" },
    { email: "pat@northline.test", phase: "LoadIn", role: "Laborer" },
    { email: "dana@northline.test", phase: "LoadOut", role: "Lead" },
    { email: "jamie@northline.test", phase: "LoadOut", role: "Driver" },
    { email: "pat@northline.test", phase: "LoadOut", role: "Laborer" },
  ];

  await sql`
    DELETE FROM job_assignments ja
    USING jobs j, organizations o
    WHERE ja.job_id = j.id AND j.org_id = o.id
      AND o.slug = ${SLUG} AND j.name = 'Waterfront Festival'
  `;

  for (const c of crew) {
    await sql`
      INSERT INTO job_assignments (job_id, org_id, user_id, phase, assigned_role)
      SELECT j.id, j.org_id, u.id, ${c.phase}, ${c.role}
      FROM jobs j
      JOIN organizations o ON o.id = j.org_id
      JOIN users u ON u.email = ${c.email}
      WHERE o.slug = ${SLUG} AND j.name = 'Waterfront Festival'
      ON CONFLICT (job_id, user_id, phase) DO UPDATE SET
        assigned_role = EXCLUDED.assigned_role
    `;
  }

  // Dual role: managers who appear on crew also need is_staff for My Jobs / picker realism
  await sql`
    UPDATE org_memberships m
    SET is_staff = true, is_manager = true
    FROM organizations o, users u
    WHERE m.org_id = o.id
      AND m.user_id = u.id
      AND o.slug = ${SLUG}
      AND u.email IN ('morgan@northline.test', 'dana@northline.test')
  `;

  await sql`
    INSERT INTO client_inventory_requests (
      org_id, client_company_id, requested_by_user_id, type,
      client_inventory_item_id, proposed_sku, proposed_name,
      proposed_quantity, reason, status
    )
    SELECT o.id, c.id, u.id, 'qty_change'::inventory_request_type,
      i.id, i.sku, i.name, 60, 'Need more coolers for fall activations',
      'pending'::inventory_request_status
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Summit Brands'
    JOIN users u ON u.email = 'alex@summit.test'
    JOIN client_inventory_items i
      ON i.org_id = o.id AND i.client_company_id = c.id AND i.sku = 'SB-COOLER-24'
    WHERE o.slug = ${SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM client_inventory_requests r
        WHERE r.org_id = o.id AND r.status = 'pending'
          AND r.client_inventory_item_id = i.id
      )
  `;

  await sql`
    INSERT INTO client_notes (
      org_id, client_company_id, sent_by_user_id, subject, body
    )
    SELECT o.id, c.id, u.id,
      'Load-in map update',
      'Updated load-in map on Waterfront Festival — please confirm dock door.'
    FROM organizations o
    JOIN client_companies c ON c.org_id = o.id AND c.name = 'Summit Brands'
    JOIN users u ON u.email = 'alex@summit.test'
    WHERE o.slug = ${SLUG}
      AND NOT EXISTS (
        SELECT 1 FROM client_notes n
        WHERE n.org_id = o.id
          AND n.client_company_id = c.id
          AND n.subject = 'Load-in map update'
          AND n.read_at IS NULL
      )
  `;

  console.log("  northline rich: Summit + Harbor, catalogs, 5 jobs, inbox seeded");
}
