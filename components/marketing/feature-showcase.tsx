import Image from "next/image";

export const MARKETING_FEATURES = [
  {
    id: "jobs",
    title: "Jobs with real windows",
    body: "Draft → upcoming → ready → completed. Run sheets with locations, loads, trucks, and crew on one record.",
    image: "/marketing/jobs-list.png",
    alt: "Jobs list filtered by status with load-in and load-out windows",
  },
  {
    id: "job-detail",
    title: "Run sheet detail",
    body: "Loaded quantities, fleet assignments, and crew phases stay on the job — not in a side spreadsheet.",
    image: "/marketing/job-detail.png",
    alt: "Job detail with inventory, fleet, and crew assignments",
  },
  {
    id: "inventory",
    title: "Inventory that locks",
    body: "Client gear, your equipment, and fleet live in separate catalogs. Live jobs reserve client assets until load-out ends.",
    image: "/marketing/inventory.png",
    alt: "Client inventory catalog with quantities",
  },
  {
    id: "reports",
    title: "Reports and exports",
    body: "Filter by client, status, and date range. Export CSV when finance needs a slice of the operation.",
    image: "/marketing/reports.png",
    alt: "Operations reports with date filters and export",
  },
  {
    id: "search",
    title: "Cmd-K search",
    body: "Jump to jobs, clients, inventory, and fleet from anywhere in the staff app.",
    image: "/marketing/search.png",
    alt: "Command palette search across jobs and inventory",
  },
  {
    id: "portal",
    title: "White-label portal",
    body: "Clients request jobs, browse stored inventory, and upload docs on your subdomain with your logo.",
    image: "/marketing/portal.png",
    alt: "Client portal jobs list under Northline Logistics branding",
  },
  {
    id: "quotes",
    title: "Quotes and invoices",
    body: "Rate cards, line items, approved quotes tied to jobs, and sent invoices when the job wraps — see Invoices for the same Northline sample tenant.",
    image: "/marketing/quotes.png",
    alt: "Quote detail with line items for a festival job",
  },
] as const;

export function FeatureShowcase() {
  return (
    <div className="space-y-10">
      {MARKETING_FEATURES.map((feature, i) => (
        <article
          key={feature.id}
          id={feature.id === "jobs" ? "features" : undefined}
          className={`m-feature-row${i % 2 === 1 ? " m-feature-row-reverse" : ""}`}
        >
          <div className="m-feature-copy">
            <h3 className="m-feature-title">{feature.title}</h3>
            <p className="m-feature-body">{feature.body}</p>
          </div>
          <div className="m-feature-shot overflow-hidden rounded-lg border border-[var(--m-line)] bg-[var(--surface)] shadow-sm">
            <Image
              src={feature.image}
              alt={feature.alt}
              width={1440}
              height={900}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </article>
      ))}
    </div>
  );
}
