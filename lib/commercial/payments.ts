import type { InvoiceStatus } from "@/lib/db/schema";

/** Statuses an invoice can receive a payment in. Drafts and voids cannot. */
export const PAYABLE_STATUSES: readonly InvoiceStatus[] = [
  "sent",
  "partially_paid",
  "overdue",
];

export type PaymentCheck =
  | { ok: true; newPaidCents: number; newStatus: "paid" | "partially_paid" }
  | { ok: false; error: string };

/**
 * Pure rules for recording a payment against an invoice. The database write in
 * `applyInvoicePayment` enforces the same rules atomically; this produces the
 * result and readable errors.
 */
export function checkPayment(args: {
  status: InvoiceStatus;
  totalCents: number;
  amountPaidCents: number;
  amountCents: number;
}): PaymentCheck {
  const { status, totalCents, amountPaidCents, amountCents } = args;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Payment amount must be greater than zero" };
  }
  if (!PAYABLE_STATUSES.includes(status)) {
    return {
      ok: false,
      error: `Cannot record a payment on a ${status.replace("_", " ")} invoice`,
    };
  }
  const due = totalCents - amountPaidCents;
  if (amountCents > due) {
    return {
      ok: false,
      error: `Payment exceeds the balance due (${due} cents remaining)`,
    };
  }
  const newPaidCents = amountPaidCents + amountCents;
  return {
    ok: true,
    newPaidCents,
    newStatus: newPaidCents >= totalCents ? "paid" : "partially_paid",
  };
}
