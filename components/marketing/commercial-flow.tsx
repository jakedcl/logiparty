const STEPS = [
  {
    id: "request",
    label: "Request",
    title: "Portal or staff request",
    body: "Clients request jobs in your branded portal. Managers accept drafts or create jobs in the dashboard.",
  },
  {
    id: "job",
    label: "Job",
    title: "Stage the run sheet",
    body: "Assign inventory, fleet, and crew. Load-in and load-out windows live on one job — locks engage when it goes live.",
  },
  {
    id: "loadout",
    label: "Load-out",
    title: "Execute and load",
    body: "Warehouse marks loaded quantities. Drivers and crew see assigned work only. Documents attach to the job.",
  },
  {
    id: "invoice",
    label: "Invoice",
    title: "Quote to invoice",
    body: "Build quotes from rate cards, tie approved quotes to jobs, and send invoices when the job completes.",
  },
] as const;

/** Linear onboarding-style flow — no glossy stepper. */
export function CommercialFlow() {
  return (
    <ol className="m-flow">
      {STEPS.map((step, i) => (
        <li key={step.id} className="m-flow-step">
          <FlowIndex index={i} />
          <p className="m-flow-kicker">{step.label}</p>
          <h3 className="m-flow-title">{step.title}</h3>
          <p className="m-flow-body">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}

function FlowIndex({ index }: { index: number }) {
  return (
    <span className="m-flow-index" aria-hidden>
      <span className="m-flow-num">{String(index + 1).padStart(2, "0")}</span>
    </span>
  );
}
