/**
 * Integration check for applyInvoicePayment against a real database.
 * Run: DATABASE_URL=<throwaway branch> npx tsx scripts/payment-check.ts
 * Creates and removes its own invoices in the `test` org. Never run it
 * against production.
 */
import { eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { applyInvoicePayment } = await import("../lib/commercial/apply-payment");
  if (!db) throw new Error("DATABASE_URL required");

  const [org] = await db.select().from(schema.organizations)
    .where(eq(schema.organizations.slug, "test")).limit(1);
  if (!org) throw new Error("org `test` not found");
  const [company] = await db.select().from(schema.clientCompanies)
    .where(eq(schema.clientCompanies.orgId, org.id)).limit(1);
  if (!company) throw new Error("no client company in org `test`");

  const stamp = Date.now();
  const ids: string[] = [];
  const makeInvoice = async (n: string, status: "draft" | "sent" | "void") => {
    const [inv] = await db!.insert(schema.invoices).values({
      orgId: org.id,
      clientCompanyId: company.id,
      invoiceNumber: `ZZ-${stamp}-${n}`,
      status,
      dueDate: "2030-01-01",
      totalCents: 100000,
    }).returning();
    ids.push(inv.id);
    return inv;
  };
  const read = async (id: string) =>
    (await db!.select().from(schema.invoices).where(eq(schema.invoices.id, id)))[0];
  const payments = async (id: string) =>
    (await db!.select().from(schema.invoicePayments).where(eq(schema.invoicePayments.invoiceId, id))).length;
  const results: string[] = [];
  const expect = (ok: boolean, label: string) => results.push((ok ? "PASS " : "FAIL ") + label);
  const rejects = async (p: Promise<unknown>, re: RegExp) => {
    try { await p; return false; } catch (e) { return re.test(e instanceof Error ? e.message : String(e)); }
  };

  try {
    const inv = await makeInvoice("a", "sent");
    const r1 = await applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: 25000, method: "other" });
    expect(r1.status === "partially_paid" && r1.amountPaidCents === 25000, "partial payment -> partially_paid");
    expect((await read(inv.id)).paidAt === null, "paid_at stays null while partially paid");

    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: 80000, method: "other" }), /exceeds the balance/), "overpayment rejected");
    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: 0, method: "other" }), /greater than zero/), "zero rejected");
    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: -5, method: "other" }), /greater than zero/), "negative rejected");

    const r2 = await applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: 75000, method: "other" });
    const after = await read(inv.id);
    expect(r2.status === "paid" && after.status === "paid" && after.paidAt !== null && after.amountPaidCents === 100000, "balance payment -> paid, paid_at set");
    expect(await payments(inv.id) === 2, "exactly the 2 accepted payments were recorded");
    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: inv.id, amountCents: 1, method: "other" }), /paid invoice/), "no payment on a paid invoice");

    const draft = await makeInvoice("b", "draft");
    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: draft.id, amountCents: 100, method: "other" }), /draft invoice/), "no payment on a draft");
    expect(await payments(draft.id) === 0, "rejected payment wrote no payment row");

    expect(await rejects(applyInvoicePayment({ orgId: org.id, invoiceId: "00000000-0000-4000-8000-0000000000aa", amountCents: 100, method: "other" }), /not found/), "unknown invoice rejected");

    const race = await makeInvoice("c", "sent");
    const settled = await Promise.allSettled([
      applyInvoicePayment({ orgId: org.id, invoiceId: race.id, amountCents: 60000, method: "other" }),
      applyInvoicePayment({ orgId: org.id, invoiceId: race.id, amountCents: 60000, method: "other" }),
    ]);
    const won = settled.filter((s) => s.status === "fulfilled").length;
    const raced = await read(race.id);
    expect(won === 1 && raced.amountPaidCents === 60000 && (await payments(race.id)) === 1,
      `two concurrent 60% payments: exactly one wins (won=${won}, paid=${raced.amountPaidCents})`);
  } finally {
    for (const id of ids) {
      await db.delete(schema.invoicePayments).where(eq(schema.invoicePayments.invoiceId, id));
      await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
    }
  }
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
