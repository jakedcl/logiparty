import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  date,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "upcoming",
  "ready",
  "completed",
  "denied",
]);

export const jobInventoryItemTypeEnum = pgEnum("job_inventory_item_type", [
  "client",
  "org",
]);

export const assignmentPhaseEnum = pgEnum("assignment_phase", [
  "LoadIn",
  "LoadOut",
]);

export const assignmentRoleEnum = pgEnum("assignment_role", [
  "Driver",
  "Laborer",
  "Lead",
]);

export const availabilityStatusEnum = pgEnum("availability_status", [
  "Pending",
  "Approved",
  "Denied",
]);

export const uploaderRoleEnum = pgEnum("uploader_role", ["manager", "client"]);

export const inventoryRequestTypeEnum = pgEnum("inventory_request_type", [
  "add",
  "qty_change",
  "remove",
]);

export const inventoryRequestStatusEnum = pgEnum("inventory_request_status", [
  "pending",
  "approved",
  "denied",
]);

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "sent",
  "approved",
  "declined",
  "expired",
  "void",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "void",
  "overdue",
]);

export const commercialLineKindEnum = pgEnum("commercial_line_kind", [
  "equipment",
  "labor",
  "fleet",
  "fee",
  "discount",
  "tax",
  "deposit",
  "custom",
  "damage_loss",
  "adjustment",
]);

export const rateUnitEnum = pgEnum("rate_unit", [
  "each",
  "day",
  "hour",
  "flat",
  "percent",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#0b5cab"),
  emailFromName: text("email_from_name"),
  /** Stripe customer for this org (optional billing). */
  stripeCustomerId: text("stripe_customer_id"),
  /** Active/latest Stripe subscription id. */
  stripeSubscriptionId: text("stripe_subscription_id"),
  /** Soft status: none | active | past_due | canceled — no hard lockout in pilot. */
  billingStatus: text("billing_status"),
  quotePrefix: text("quote_prefix").notNull().default("Q"),
  invoicePrefix: text("invoice_prefix").notNull().default("INV"),
  nextQuoteNumber: integer("next_quote_number").notNull().default(1),
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  defaultTaxRateBps: integer("default_tax_rate_bps").notNull().default(0),
  taxLabel: text("tax_label").notNull().default("Sales tax"),
  taxId: text("tax_id"),
  paymentTermsDays: integer("payment_terms_days").notNull().default(30),
  quoteValidDays: integer("quote_valid_days").notNull().default(14),
  invoiceFooterText: text("invoice_footer_text"),
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
    notifyEmail: boolean("notify_email").notNull().default(true),
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

/** Client → 3PL general notes (one-way; not job/SKU scoped) */
export const clientNotes = pgTable("client_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientCompanyId: uuid("client_company_id")
    .notNull()
    .references(() => clientCompanies.id, { onDelete: "cascade" }),
  sentByUserId: uuid("sent_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject"),
  body: text("body").notNull(),
  readAt: timestamp("read_at", { withTimezone: true }),
  readByUserId: uuid("read_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Client portal change requests — managers approve/deny before catalog mutates */
export const clientInventoryRequests = pgTable("client_inventory_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientCompanyId: uuid("client_company_id")
    .notNull()
    .references(() => clientCompanies.id, { onDelete: "cascade" }),
  requestedByUserId: uuid("requested_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: inventoryRequestTypeEnum("type").notNull(),
  clientInventoryItemId: uuid("client_inventory_item_id").references(
    () => clientInventoryItems.id,
    { onDelete: "set null" }
  ),
  proposedSku: text("proposed_sku"),
  proposedName: text("proposed_name"),
  proposedDescription: text("proposed_description"),
  proposedQuantity: integer("proposed_quantity"),
  reason: text("reason").notNull(),
  status: inventoryRequestStatusEnum("status").notNull().default("pending"),
  reviewerUserId: uuid("reviewer_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** 3PL-owned inventory (dollies, gear, hand tools) — not fleet */
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

/** @deprecated Table retained for migration safety; use inventory_items instead */
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

export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  jobId: uuid("job_id"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  isClientVisible: boolean("is_client_visible").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientCompanyId: uuid("client_company_id")
    .notNull()
    .references(() => clientCompanies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  status: jobStatusEnum("status").notNull().default("upcoming"),
  jobStart: timestamp("job_start", { withTimezone: true }),
  jobEnd: timestamp("job_end", { withTimezone: true }),
  loadInStart: timestamp("load_in_start", { withTimezone: true }),
  loadInEnd: timestamp("load_in_end", { withTimezone: true }),
  loadOutStart: timestamp("load_out_start", { withTimezone: true }),
  loadOutEnd: timestamp("load_out_end", { withTimezone: true }),
  clientPocName: text("client_poc_name"),
  clientPocPhone: text("client_poc_phone"),
  jobLeadUserId: uuid("job_lead_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  quoteId: uuid("quote_id"),
  quoteVersion: integer("quote_version"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rateCards = pgTable("rate_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull().default("Default"),
  isDefault: boolean("is_default").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const rateCardLines = pgTable("rate_card_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  rateCardId: uuid("rate_card_id")
    .notNull()
    .references(() => rateCards.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, {
    onDelete: "set null",
  }),
  fleetVehicleId: uuid("fleet_vehicle_id").references(() => fleetVehicles.id, {
    onDelete: "set null",
  }),
  laborRole: text("labor_role"),
  description: text("description").notNull(),
  unit: rateUnitEnum("unit").notNull().default("each"),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  minQty: integer("min_qty").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  clientCompanyId: uuid("client_company_id").references(
    () => clientCompanies.id,
    { onDelete: "cascade" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientCompanyId: uuid("client_company_id")
      .notNull()
      .references(() => clientCompanies.id, { onDelete: "restrict" }),
    quoteNumber: text("quote_number").notNull(),
    status: quoteStatusEnum("status").notNull().default("draft"),
    version: integer("version").notNull().default(1),
    title: text("title").notNull(),
    eventStart: timestamp("event_start", { withTimezone: true }),
    eventEnd: timestamp("event_end", { withTimezone: true }),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    currency: text("currency").notNull().default("USD"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    depositCents: integer("deposit_cents"),
    notesInternal: text("notes_internal"),
    notesClient: text("notes_client"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    sentByUserId: uuid("sent_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    pdfStorageKey: text("pdf_storage_key"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.quoteNumber)]
);

export const quoteLines = pgTable("quote_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  quoteId: uuid("quote_id")
    .notNull()
    .references(() => quotes.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  kind: commercialLineKindEnum("kind").notNull().default("custom"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull().default("1"),
  unit: rateUnitEnum("unit").notNull().default("each"),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  lineTotalCents: integer("line_total_cents").notNull().default(0),
  taxable: boolean("taxable").notNull().default(true),
  sourceRateCardLineId: uuid("source_rate_card_line_id").references(
    () => rateCardLines.id,
    { onDelete: "set null" }
  ),
  inventoryItemId: uuid("inventory_item_id").references(() => inventoryItems.id, {
    onDelete: "set null",
  }),
  fleetVehicleId: uuid("fleet_vehicle_id").references(() => fleetVehicles.id, {
    onDelete: "set null",
  }),
});

export const quoteVersions = pgTable(
  "quote_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    snapshotJson: jsonb("snapshot_json").notNull(),
    pdfStorageKey: text("pdf_storage_key"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.quoteId, t.version)]
);

export const quoteClientResponses = pgTable(
  "quote_client_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteId: uuid("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    quoteVersion: integer("quote_version").notNull(),
    decision: text("decision").notNull(),
    signerName: text("signer_name").notNull(),
    respondedByUserId: uuid("responded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    respondedAt: timestamp("responded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    declineReason: text("decline_reason"),
  },
  (t) => [unique().on(t.quoteId, t.quoteVersion)]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientCompanyId: uuid("client_company_id")
      .notNull()
      .references(() => clientCompanies.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    quoteId: uuid("quote_id").references(() => quotes.id, { onDelete: "set null" }),
    invoiceNumber: text("invoice_number").notNull(),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    issueDate: date("issue_date").notNull().defaultNow(),
    dueDate: date("due_date").notNull(),
    currency: text("currency").notNull().default("USD"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    notesClient: text("notes_client"),
    notesInternal: text("notes_internal"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    stripePaymentLinkId: text("stripe_payment_link_id"),
    stripePaymentLinkUrl: text("stripe_payment_link_url"),
    pdfStorageKey: text("pdf_storage_key"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.orgId, t.invoiceNumber)]
);

export const invoiceLines = pgTable("invoice_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  kind: commercialLineKindEnum("kind").notNull().default("custom"),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull().default("1"),
  unit: rateUnitEnum("unit").notNull().default("each"),
  unitPriceCents: integer("unit_price_cents").notNull().default(0),
  lineTotalCents: integer("line_total_cents").notNull().default(0),
  taxable: boolean("taxable").notNull().default(true),
  jobInventoryLineId: uuid("job_inventory_line_id").references(
    () => jobInventoryLines.id,
    { onDelete: "set null" }
  ),
});

export const invoicePayments = pgTable("invoice_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  method: text("method").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  recordedByUserId: uuid("recorded_by_user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobLocations = pgTable(
  "job_locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    address: text("address").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.jobId, t.sortOrder)]
);

export const jobInventoryLines = pgTable("job_inventory_lines", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  itemType: jobInventoryItemTypeEnum("item_type").notNull(),
  clientItemId: uuid("client_item_id").references(() => clientInventoryItems.id, {
    onDelete: "restrict",
  }),
  orgItemId: uuid("org_item_id").references(() => inventoryItems.id, {
    onDelete: "restrict",
  }),
  quantityAssigned: integer("quantity_assigned").notNull().default(0),
  quantityLoaded: integer("quantity_loaded").notNull().default(0),
});

export const jobFleetAssignments = pgTable(
  "job_fleet_assignments",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    fleetVehicleId: uuid("fleet_vehicle_id")
      .notNull()
      .references(() => fleetVehicles.id, { onDelete: "restrict" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.jobId, t.fleetVehicleId] })]
);

export const jobAssignments = pgTable(
  "job_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phase: assignmentPhaseEnum("phase").notNull(),
    assignedRole: assignmentRoleEnum("assigned_role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [unique().on(t.jobId, t.userId, t.phase)]
);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  uploaderRole: uploaderRoleEnum("uploader_role").notNull(),
  fileName: text("file_name").notNull(),
  storageKey: text("storage_key").notNull(),
  fileSizeBytes: integer("file_size_bytes").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const availabilityRequests = pgTable("availability_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  reason: text("reason"),
  status: availabilityStatusEnum("status").notNull().default("Pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Platform-level waitlist / access requests (not org-scoped; no RLS). */
export const marketingLeads = pgTable("marketing_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message"),
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
export type ClientInventoryRequest =
  typeof clientInventoryRequests.$inferSelect;
export type ClientNote = typeof clientNotes.$inferSelect;
export type FleetVehicle = typeof fleetVehicles.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type JobLocation = typeof jobLocations.$inferSelect;
export type JobInventoryLine = typeof jobInventoryLines.$inferSelect;
export type JobFleetAssignment = typeof jobFleetAssignments.$inferSelect;
export type JobAssignment = typeof jobAssignments.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type AvailabilityRequest = typeof availabilityRequests.$inferSelect;
export type MarketingLead = typeof marketingLeads.$inferSelect;
export type RateCard = typeof rateCards.$inferSelect;
export type RateCardLine = typeof rateCardLines.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type QuoteLine = typeof quoteLines.$inferSelect;
export type QuoteVersion = typeof quoteVersions.$inferSelect;
export type QuoteClientResponse = typeof quoteClientResponses.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type InvoiceLine = typeof invoiceLines.$inferSelect;
export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type QuoteStatus = (typeof quoteStatusEnum.enumValues)[number];
export type InvoiceStatus = (typeof invoiceStatusEnum.enumValues)[number];
export type CommercialLineKind = (typeof commercialLineKindEnum.enumValues)[number];
export type RateUnit = (typeof rateUnitEnum.enumValues)[number];
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type JobInventoryItemType =
  (typeof jobInventoryItemTypeEnum.enumValues)[number];
export type AssignmentPhase = (typeof assignmentPhaseEnum.enumValues)[number];
export type AssignmentRole = (typeof assignmentRoleEnum.enumValues)[number];
export type AvailabilityStatus =
  (typeof availabilityStatusEnum.enumValues)[number];
export type UploaderRole = (typeof uploaderRoleEnum.enumValues)[number];
export type InventoryRequestType =
  (typeof inventoryRequestTypeEnum.enumValues)[number];
export type InventoryRequestStatus =
  (typeof inventoryRequestStatusEnum.enumValues)[number];

export const JOB_STATUSES = jobStatusEnum.enumValues;
export const JOB_INVENTORY_ITEM_TYPES = jobInventoryItemTypeEnum.enumValues;
export const ASSIGNMENT_PHASES = assignmentPhaseEnum.enumValues;
export const ASSIGNMENT_ROLES = assignmentRoleEnum.enumValues;
export const UPLOADER_ROLES = uploaderRoleEnum.enumValues;
export const AVAILABILITY_STATUSES = availabilityStatusEnum.enumValues;

export const STAFF_TAGS = [
  "driver",
  "warehouse",
  "forklift",
  "lead",
  "rigger",
  "staging",
] as const;

export type StaffTag = (typeof STAFF_TAGS)[number];
