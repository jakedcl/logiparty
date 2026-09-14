/**
 * Public product-tour data for /demo (no auth, no DB).
 * Keep names generic — show the product, not a niche brand story.
 */

export const DEMO_ORG = {
  name: "Northline Logistics",
  shortName: "Northline",
  primary: "#1e3a5f",
  warehouse: "1200 Dock Rd, Brooklyn, NY",
} as const;

export type DemoJobStatus =
  | "draft"
  | "upcoming"
  | "ready"
  | "completed"
  | "denied";

export type DemoJob = {
  id: string;
  name: string;
  client: string;
  status: DemoJobStatus;
  when: string;
  poc: string;
};

export const DEMO_JOBS: readonly DemoJob[] = [
  {
    id: "j-draft",
    name: "Outdoor Patio Activation",
    client: "Summit Brands",
    status: "draft",
    when: "Sat, Oct 4, 2026",
    poc: "Alex Chen",
  },
  {
    id: "j-upcoming",
    name: "Campus Pop-Up",
    client: "Summit Brands",
    status: "upcoming",
    when: "Wed, Sep 24, 2026",
    poc: "Alex Chen",
  },
  {
    id: "j-ready",
    name: "Waterfront Festival",
    client: "Summit Brands",
    status: "ready",
    when: "Fri, Sep 19, 2026",
    poc: "Jordan Lee",
  },
  {
    id: "j-fashion",
    name: "Showroom Load-In",
    client: "Harbor Co.",
    status: "ready",
    when: "Sun, Sep 21, 2026",
    poc: "Sam Rivera",
  },
  {
    id: "j-done",
    name: "Trade Show Wrap",
    client: "Summit Brands",
    status: "completed",
    when: "Mon, Sep 1, 2026",
    poc: "Alex Chen",
  },
] as const;

export const DEMO_NEEDS = [
  {
    kind: "Job request",
    title: "Outdoor Patio Activation",
    detail: "Summit Brands · pending accept",
  },
  {
    kind: "Inventory",
    title: "Cooler qty change",
    detail: "Summit Brands · +24 units",
  },
  {
    kind: "Note",
    title: "Load-in map update",
    detail: "From Alex Chen",
  },
] as const;

export const DEMO_INVENTORY_CLIENT = [
  { sku: "SB-BAR-01", name: "Branded Bar", qty: 10 },
  { sku: "SB-COOLER-24", name: "Rolling Cooler", qty: 36 },
  { sku: "SB-HIGHBOY", name: "Highboy Table", qty: 20 },
  { sku: "SB-BANNER", name: "Backdrop Banner", qty: 12 },
  { sku: "SB-LOUNGE", name: "Lounge Sofa", qty: 8 },
] as const;

export const DEMO_INVENTORY_ORG = [
  { sku: "DOLLY-01", name: "Dolly", qty: 40 },
  { sku: "RAMP-01", name: "Load Ramp", qty: 8 },
  { sku: "CART-01", name: "Utility Cart", qty: 12 },
  { sku: "STRAP-01", name: "Ratchet Strap Pack", qty: 50 },
] as const;

export const DEMO_FLEET = [
  { name: "Box Truck 12", plate: "NL-012", note: "26ft box" },
  { name: "Box Truck 18", plate: "NL-018", note: "Liftgate" },
  { name: "Cargo Van 4", plate: "NL-004", note: "High roof" },
  { name: "Sprinter 7", plate: "NL-007", note: "Crew van" },
] as const;

export const DEMO_JOB_LINES = [
  {
    source: "Client",
    name: "Branded Bar",
    assigned: 3,
    loaded: 3,
  },
  {
    source: "Client",
    name: "Highboy Table",
    assigned: 8,
    loaded: 8,
  },
  {
    source: "Client",
    name: "Lounge Sofa",
    assigned: 4,
    loaded: 4,
  },
  {
    source: "Ours",
    name: "Dolly",
    assigned: 10,
    loaded: 10,
  },
  {
    source: "Ours",
    name: "Load Ramp",
    assigned: 2,
    loaded: 2,
  },
] as const;

export const DEMO_CREW = [
  { name: "Morgan Hale", phase: "Load-in", role: "Lead" },
  { name: "Chris Park", phase: "Load-in", role: "Driver" },
  { name: "Pat Ortiz", phase: "Load-in", role: "Laborer" },
  { name: "Dana Kim", phase: "Load-out", role: "Lead" },
  { name: "Jamie Reed", phase: "Load-out", role: "Driver" },
  { name: "Pat Ortiz", phase: "Load-out", role: "Laborer" },
] as const;

export const DEMO_TEAM = [
  { name: "Riley Boss", role: "Org admin", tags: "—" },
  { name: "Morgan Hale", role: "Manager", tags: "lead" },
  { name: "Dana Kim", role: "Manager", tags: "lead" },
  { name: "Chris Park", role: "Staff", tags: "driver" },
  { name: "Pat Ortiz", role: "Staff", tags: "warehouse" },
  { name: "Jamie Reed", role: "Staff", tags: "driver" },
] as const;

export const DEMO_CLIENTS = [
  {
    company: "Summit Brands",
    contacts: [
      { name: "Alex Chen", title: "POC" },
      { name: "Jordan Lee", title: "Rep" },
    ],
  },
  {
    company: "Harbor Co.",
    contacts: [{ name: "Sam Rivera", title: "POC" }],
  },
] as const;

export const DEMO_PORTAL_JOBS = DEMO_JOBS.filter(
  (j) => j.client === "Summit Brands" && j.status !== "denied"
);

export const DEMO_MY_JOBS = [
  DEMO_JOBS.find((j) => j.id === "j-ready")!,
  DEMO_JOBS.find((j) => j.id === "j-upcoming")!,
] as const;
