import Image from "next/image";

export const MARKETING_FEATURES = [
  {
    id: "job-detail",
    title: "One job. Every moving part.",
    body: "Loaded quantities, fleet assignments, and crew phases stay on the job — not in a side spreadsheet.",
    image: "/marketing/job-detail.png",
    alt: "Job detail with inventory, fleet, and crew assignments",
  },
  {
    id: "inventory",
    title: "Know which gear is committed.",
    body: "Client gear, your equipment, and fleet live in separate catalogs. Live jobs reserve client assets until load-out ends.",
    image: "/marketing/inventory.png",
    alt: "Client inventory catalog with quantities",
  },
  {
    id: "portal",
    title: "Your clients. Your brand.",
    body: "Clients request jobs, browse stored inventory, and upload docs on your subdomain with your logo.",
    image: "/marketing/portal.png",
    alt: "Client portal jobs list under Northline Logistics branding",
  },
] as const;

export function FeatureShowcase() {
  return (
    <div className="space-y-10">
      {MARKETING_FEATURES.map((feature, i) => (
        <article
          key={feature.id}
          id={feature.id === "job-detail" ? "features" : undefined}
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
