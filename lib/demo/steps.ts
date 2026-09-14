export type DemoScreenId =
  | "dashboard"
  | "jobs"
  | "job"
  | "inventory"
  | "notifications"
  | "team"
  | "portal-jobs"
  | "portal-inventory"
  | "my-jobs";

export type DemoPopupPlacement = "bottom" | "top" | "right" | "left";

export type DemoStep = {
  id: string;
  screen: DemoScreenId;
  title: string;
  body: string;
  /** Matches data-demo-hl on the target inside the app chrome */
  highlight: string;
  placement?: DemoPopupPlacement;
};

export const DEMO_STEPS: readonly DemoStep[] = [
  {
    id: "welcome",
    screen: "dashboard",
    title: "Your ops workspace",
    body: "Each 3PL gets a branded subdomain. Staff see your name — not ours.",
    highlight: "brand",
    placement: "right",
  },
  {
    id: "dashboard",
    screen: "dashboard",
    title: "What needs you today",
    body: "Job requests, inventory asks, and client notes land here next to upcoming work.",
    highlight: "needs",
    placement: "right",
  },
  {
    id: "jobs",
    screen: "jobs",
    title: "Jobs with real statuses",
    body: "Draft → upcoming → ready → completed. One list for the whole warehouse.",
    highlight: "statuses",
    placement: "bottom",
  },
  {
    id: "job-summary",
    screen: "job",
    title: "One job, one place",
    body: "Windows, locations, inventory, trucks, and crew live on the job — not in a chat thread.",
    highlight: "tabs",
    placement: "bottom",
  },
  {
    id: "job-loaded",
    screen: "job",
    title: "Loaded quantities",
    body: "Warehouse marks what’s on the truck. Assigned vs loaded stays on the run sheet.",
    highlight: "loaded",
    placement: "bottom",
  },
  {
    id: "job-crew",
    screen: "job",
    title: "Fleet and crew",
    body: "Load-in and load-out get their own drivers and labor. Ready when trucks, crew, and loads line up.",
    highlight: "crew",
    placement: "top",
  },
  {
    id: "inventory",
    screen: "inventory",
    title: "Three catalogs",
    body: "Client gear, your equipment, and fleet — separate so locks stay clear.",
    highlight: "tabs-inv",
    placement: "bottom",
  },
  {
    id: "notifications",
    screen: "notifications",
    title: "Inbox for ops",
    body: "Accept a draft, approve an inventory change, or mark a client note read.",
    highlight: "inbox",
    placement: "bottom",
  },
  {
    id: "team",
    screen: "team",
    title: "Team and clients",
    body: "Roles and tags for staff. Client companies with multiple contacts.",
    highlight: "people",
    placement: "bottom",
  },
  {
    id: "portal",
    screen: "portal-jobs",
    title: "Client portal",
    body: "Clients request jobs and upload docs on your brand. They only see their company.",
    highlight: "portal-brand",
    placement: "bottom",
  },
  {
    id: "portal-inv",
    screen: "portal-inventory",
    title: "Their inventory",
    body: "Clients browse stored gear and request adds or quantity changes — you approve.",
    highlight: "portal-inv",
    placement: "bottom",
  },
  {
    id: "staff",
    screen: "my-jobs",
    title: "Assigned jobs only",
    body: "Drivers and warehouse see My Jobs — nothing else. Works on a phone at the dock.",
    highlight: "my-jobs",
    placement: "bottom",
  },
] as const;
