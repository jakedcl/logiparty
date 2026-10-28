/** Human labels and badge classes for quote / invoice statuses (mirrors job status-display). */

const QUOTE_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  approved: "Approved",
  declined: "Declined",
  expired: "Expired",
  void: "Void",
};

const INVOICE_LABELS: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partially paid",
  paid: "Paid",
  void: "Void",
  overdue: "Overdue",
};

export function quoteStatusLabel(status: string): string {
  return QUOTE_LABELS[status.toLowerCase()] ?? status;
}

export function invoiceStatusLabel(status: string): string {
  return INVOICE_LABELS[status.toLowerCase()] ?? status.replaceAll("_", " ");
}

/** Maps commercial status to existing lp-status-* tokens. */
export function quoteStatusBadgeClass(status: string): string {
  const key = status.toLowerCase();
  switch (key) {
    case "draft":
      return "lp-status-draft";
    case "sent":
      return "lp-status-upcoming";
    case "approved":
      return "lp-status-approved";
    case "declined":
    case "void":
      return "lp-status-denied";
    case "expired":
      return "lp-status-completed";
    default:
      return "lp-status-completed";
  }
}

export function invoiceStatusBadgeClass(status: string): string {
  const key = status.toLowerCase();
  switch (key) {
    case "draft":
      return "lp-status-draft";
    case "sent":
    case "partially_paid":
      return "lp-status-upcoming";
    case "paid":
      return "lp-status-approved";
    case "overdue":
    case "void":
      return "lp-status-denied";
    default:
      return "lp-status-completed";
  }
}
