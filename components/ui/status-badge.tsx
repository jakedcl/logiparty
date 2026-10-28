import { cn } from "@/lib/utils";
import {
  invoiceStatusBadgeClass,
  invoiceStatusLabel,
  quoteStatusBadgeClass,
  quoteStatusLabel,
} from "@/lib/commercial/status-display";
import { jobStatusLabel } from "@/lib/jobs/status-display";

const JOB_STATUS: Record<string, string> = {
  draft: "lp-status-draft",
  upcoming: "lp-status-upcoming",
  ready: "lp-status-ready",
  completed: "lp-status-completed",
  denied: "lp-status-denied",
};

const REQUEST_STATUS: Record<string, string> = {
  pending: "lp-status-pending",
  approved: "lp-status-approved",
  denied: "lp-status-denied",
  rejected: "lp-status-denied",
};

type Kind = "job" | "request" | "quote" | "invoice" | "generic";

export function statusBadgeClass(status: string, kind: Kind = "generic"): string {
  const key = status.toLowerCase();
  if (kind === "job") return JOB_STATUS[key] ?? "lp-status-completed";
  if (kind === "request")
    return REQUEST_STATUS[key] ?? "lp-status-completed";
  if (kind === "quote") return quoteStatusBadgeClass(status);
  if (kind === "invoice") return invoiceStatusBadgeClass(status);
  return (
    JOB_STATUS[key] ?? REQUEST_STATUS[key] ?? "lp-status-completed"
  );
}

function labelFor(status: string, kind: Kind): string {
  if (kind === "job") return jobStatusLabel(status);
  if (kind === "quote") return quoteStatusLabel(status);
  if (kind === "invoice") return invoiceStatusLabel(status);
  return status;
}

function classesFor(status: string, kind: Kind): string {
  return statusBadgeClass(status, kind);
}

type Props = {
  status: string;
  kind?: Kind;
  className?: string;
  children?: React.ReactNode;
};

/** Glossy status capsule. Color stays tied to the status, not the org brand. */
export function StatusBadge({
  status,
  kind = "generic",
  className,
  children,
}: Props) {
  return (
    <span className={cn("lp-status", classesFor(status, kind), className)}>
      {children ?? labelFor(status, kind)}
    </span>
  );
}
