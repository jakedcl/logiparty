/**
 * Dev seed for M0 — run: npm run db:seed (requires DATABASE_URL)
 */
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

async function seed() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL required");
  }
  const sql = neon(url);

  const passwordHash = await bcrypt.hash("password123", 10);

  await sql`
    INSERT INTO organizations (slug, name, primary_color, email_from_name)
    VALUES
      ('acme', 'Acme Logistics', '#2563eb', 'Acme Logistics'),
      ('demo', 'Demo Warehouse Co', '#059669', 'Demo Warehouse')
    ON CONFLICT (slug) DO NOTHING
  `;

  await sql`
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES ('admin@acme.test', ${passwordHash}, 'Alex', 'Admin')
    ON CONFLICT (email) DO NOTHING
  `;

  await sql`
    INSERT INTO org_memberships (org_id, user_id, is_org_admin, is_manager, is_staff, is_client)
    SELECT o.id, u.id, true, true, false, false
    FROM organizations o, users u
    WHERE o.slug = 'acme' AND u.email = 'admin@acme.test'
    ON CONFLICT (org_id, user_id) DO NOTHING
  `;

  console.log("Seed complete: acme org + admin@acme.test / password123");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
