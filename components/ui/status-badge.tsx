import { cn } from "@/lib/utils";

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

type Kind = "job" | "request" | "generic";

export function statusBadgeClass(status: string, kind: Kind = "generic"): string {
  const key = status.toLowerCase();
  if (kind === "job") return JOB_STATUS[key] ?? "lp-status-completed";
  if (kind === "request")
    return REQUEST_STATUS[key] ?? "lp-status-completed";
  return (
    JOB_STATUS[key] ?? REQUEST_STATUS[key] ?? "lp-status-completed"
  );
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

/** Quiet status chip — intent color, not rounded-full pill soup. */
export function StatusBadge({
  status,
  kind = "generic",
  className,
  children,
}: Props) {
  return (
    <span className={cn("lp-status", classesFor(status, kind), className)}>
      {children ?? status}
    </span>
  );
}
