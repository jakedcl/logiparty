import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  emailFromName: text("email_from_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    isOrgAdmin: boolean("is_org_admin").notNull().default(false),
    isManager: boolean("is_manager").notNull().default(false),
    isStaff: boolean("is_staff").notNull().default(false),
    isClient: boolean("is_client").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.userId)]
);

export const staffCapabilityTags = pgTable(
  "staff_capability_tags",
  {
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => orgMemberships.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (t) => [unique().on(t.membershipId, t.tag)]
);

export const clientCompanies = pgTable("client_companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clientUsers = pgTable(
  "client_users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientCompanyId: uuid("client_company_id")
      .notNull()
      .references(() => clientCompanies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.clientCompanyId, t.userId)]
);

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  isOrgAdmin: boolean("is_org_admin").notNull().default(false),
  isManager: boolean("is_manager").notNull().default(false),
  isStaff: boolean("is_staff").notNull().default(false),
  isClient: boolean("is_client").notNull().default(false),
  clientCompanyId: uuid("client_company_id").references(
    () => clientCompanies.id,
    { onDelete: "set null" }
  ),
  invitedBy: uuid("invited_by").references(() => users.id, {
    onDelete: "set null",
  }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Client-owned assets stored in the 3PL warehouse */
export const clientInventoryItems = pgTable("client_inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientCompanyId: uuid("client_company_id")
    .notNull()
    .references(() => clientCompanies.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  totalQuantity: integer("total_quantity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Org-owned inventory (dollies, gear) — not fleet, not tools */
export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  totalQuantity: integer("total_quantity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const fleetVehicles = pgTable("fleet_vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  plate: text("plate"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Tool catalog — separate from fleet and org inventory */
export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sku: text("sku"),
  name: text("name").notNull(),
  totalQuantity: integer("total_quantity").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type OrgMembership = typeof orgMemberships.$inferSelect;
export type ClientCompany = typeof clientCompanies.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type ClientInventoryItem = typeof clientInventoryItems.$inferSelect;
export type FleetVehicle = typeof fleetVehicles.$inferSelect;
export type Tool = typeof tools.$inferSelect;

export const STAFF_TAGS = [
  "driver",
  "warehouse",
  "forklift",
  "lead",
  "rigger",
  "staging",
] as const;

export type StaffTag = (typeof STAFF_TAGS)[number];
