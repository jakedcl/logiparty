import { sql } from "drizzle-orm";
import { withOrgQuery } from "@/lib/db";
import { invoices } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { checkPayment } from "@/lib/commercial/payments";

export type AppliedPayment = {
  status: "paid" | "partially_paid";
  amountPaidCents: number;
};

/**
 * Record a payment and update the invoice in ONE statement. The UPDATE only
 * matches a payable invoice whose balance covers the amount, so concurrent
 * payments cannot overpay or both flip the status, and the payment row is
 * only inserted if the invoice update happened.
 */
export async function applyInvoicePayment(args: {
  orgId: string;
  invoiceId: string;
  amountCents: number;
  method: string;
  recordedByUserId?: string | null;
  stripePaymentIntentId?: string | null;
}): Promise<AppliedPayment> {
  const { orgId, invoiceId, amountCents, method } = args;
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  const result = await withOrgQuery<{ rows: Record<string, unknown>[] }>(
    orgId,
    (database) =>
      database.execute(sql`
        WITH upd AS (
          UPDATE invoices SET
            amount_paid_cents = amount_paid_cents + ${amountCents}::int,
            status = CASE WHEN amount_paid_cents + ${amountCents}::int >= total_cents
                          THEN 'paid'::invoice_status
                          ELSE 'partially_paid'::invoice_status END,
            paid_at = CASE WHEN amount_paid_cents + ${amountCents}::int >= total_cents
                           THEN now() ELSE paid_at END,
            updated_at = now()
          WHERE id = ${invoiceId}::uuid
            AND org_id = ${orgId}::uuid
            AND status IN ('sent', 'partially_paid', 'overdue')
            AND amount_paid_cents + ${amountCents}::int <= total_cents
          RETURNING id, status, amount_paid_cents
        ), ins AS (
          INSERT INTO invoice_payments
            (invoice_id, org_id, amount_cents, method, recorded_by_user_id, stripe_payment_intent_id)
          SELECT id, ${orgId}::uuid, ${amountCents}::int, ${method},
                 ${args.recordedByUserId ?? null}::uuid, ${args.stripePaymentIntentId ?? null}
          FROM upd
          RETURNING id
        )
        SELECT status::text AS status, amount_paid_cents FROM upd
      `)
  );

  const row = result.rows[0];
  if (row) {
    return {
      status: row.status as AppliedPayment["status"],
      amountPaidCents: Number(row.amount_paid_cents),
    };
  }

  // Nothing matched: work out why, for a useful message.
  const found = await withOrgQuery<
    { status: typeof invoices.$inferSelect.status; totalCents: number; amountPaidCents: number }[]
  >(orgId, (database) =>
    database
      .select({
        status: invoices.status,
        totalCents: invoices.totalCents,
        amountPaidCents: invoices.amountPaidCents,
      })
      .from(invoices)
      .where(and(eq(invoices.id, invoiceId), eq(invoices.orgId, orgId)))
      .limit(1)
  );
  if (!found[0]) throw new Error("Invoice not found");
  const check = checkPayment({ ...found[0], amountCents });
  throw new Error(
    check.ok ? "Payment could not be applied, please retry" : check.error
  );
}
