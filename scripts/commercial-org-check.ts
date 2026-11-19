/**
 * Integration check for the commercial org-table access fix, against a real
 * database. Run: DATABASE_URL=<throwaway branch> npx tsx scripts/commercial-org-check.ts
 * Temporarily changes counters/settings on the `test` org and restores them.
 * Never run it against production.
 */
import { and, eq } from "drizzle-orm";

async function main() {
  const { db, withOrgQuery, withOrgQueries } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { findOrganization, loadOrganization, updateOrganization } = await import("../lib/org/organization");
  const { allocateDocumentNumber } = await import("../lib/commercial/allocate-number");
  if (!db) throw new Error("DATABASE_URL required");

  const [org] = await db.select().from(schema.organizations)
    .where(eq(schema.organizations.slug, "test")).limit(1);
  if (!org) throw new Error("org `test` not found");
  const [company] = await db.select().from(schema.clientCompanies)
    .where(eq(schema.clientCompanies.orgId, org.id)).limit(1);
  if (!company) throw new Error("no client company in org `test`");

  const results: string[] = [];
  const expect = (ok: boolean, label: string) => results.push((ok ? "PASS " : "FAIL ") + label);
  const createdInvoices: string[] = [];
  const createdQuotes: string[] = [];

  try {
    // Premise: the restricted role cannot touch organizations at all.
    let denied = "";
    try {
      await withOrgQuery(org.id, (database) =>
        database.select().from(schema.organizations).where(eq(schema.organizations.id, org.id)).limit(1));
    } catch (e) {
      denied = e instanceof Error ? e.message : String(e);
    }
    expect(/permission denied/.test(denied), "premise: restricted role is denied on organizations (the old code path)");

    const loaded = await loadOrganization(org.id);
    expect(loaded.id === org.id && (await findOrganization(org.id))?.slug === "test", "loadOrganization/findOrganization read the org");
    expect((await findOrganization("00000000-0000-4000-8000-0000000000aa")) === undefined, "findOrganization returns undefined for an unknown org");

    await updateOrganization(org.id, { taxLabel: "ZZ check label", paymentTermsDays: 45 });
    const after = await loadOrganization(org.id);
    expect(after.taxLabel === "ZZ check label" && after.paymentTermsDays === 45, "updateOrganization writes settings");

    for (const kind of ["quote", "invoice"] as const) {
      const start = kind === "quote" ? org.nextQuoteNumber : org.nextInvoiceNumber;
      const prefix = kind === "quote" ? org.quotePrefix : org.invoicePrefix;
      const nums = await Promise.all(Array.from({ length: 10 }, () => allocateDocumentNumber(org.id, kind)));
      const seqs = nums.map((n) => Number(n.split("-").pop())).sort((a, b) => a - b);
      const now = await loadOrganization(org.id);
      const counter = kind === "quote" ? now.nextQuoteNumber : now.nextInvoiceNumber;
      expect(new Set(nums).size === 10, `${kind}: 10 concurrent allocations are all distinct`);
      expect(seqs[0] === start && seqs[9] === start + 9 && counter === start + 10, `${kind}: numbers ${start}..${start + 9}, counter now ${counter}`);
      expect(nums.every((n) => n.startsWith(`${prefix}-`)), `${kind}: numbers use the org prefix (${prefix})`);
    }

    // The same batch shapes the actions now use (insert via the restricted role).
    const quoteNumber = await allocateDocumentNumber(org.id, "quote");
    const [q] = (await withOrgQueries(org.id, (database) => [
      database.insert(schema.quotes).values({ orgId: org.id, clientCompanyId: company.id, quoteNumber, title: "ZZ check", status: "draft" }).returning(),
    ]))[0] as { id: string }[];
    createdQuotes.push(q.id);
    expect(!!q?.id, "createQuote shape: allocate + restricted-role insert works");

    const invoiceNumber = await allocateDocumentNumber(org.id, "invoice");
    const invoiceId = crypto.randomUUID();
    createdInvoices.push(invoiceId);
    await withOrgQueries(org.id, (database) => [
      database.insert(schema.invoices).values({ id: invoiceId, orgId: org.id, clientCompanyId: company.id, invoiceNumber, status: "draft", dueDate: "2030-01-01", totalCents: 5000 }),
      database.insert(schema.invoiceLines).values([{ orgId: org.id, invoiceId, description: "ZZ line", unitPriceCents: 5000, lineTotalCents: 5000 }]),
    ]);
    const lines = await db.select().from(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, invoiceId));
    expect(lines.length === 1, "createInvoice shape: invoice + lines written in one transaction");

    // All-or-nothing: a bad line must roll the invoice back too.
    const badId = crypto.randomUUID();
    let rolledBack = false;
    try {
      await withOrgQueries(org.id, (database) => [
        database.insert(schema.invoices).values({ id: badId, orgId: org.id, clientCompanyId: company.id, invoiceNumber: invoiceNumber + "-X", status: "draft", dueDate: "2030-01-01", totalCents: 1 }),
        database.insert(schema.invoiceLines).values([{ orgId: org.id, invoiceId: "00000000-0000-4000-8000-0000000000bb", description: "bad", unitPriceCents: 1, lineTotalCents: 1 }]),
      ]);
    } catch { rolledBack = true; }
    const leftover = await db.select().from(schema.invoices).where(eq(schema.invoices.id, badId));
    expect(rolledBack && leftover.length === 0, "a failing line rolls the whole invoice back (no invoice without lines)");
  } finally {
    for (const id of createdInvoices) {
      await db.delete(schema.invoiceLines).where(eq(schema.invoiceLines.invoiceId, id));
      await db.delete(schema.invoices).where(eq(schema.invoices.id, id));
    }
    for (const id of createdQuotes) {
      await db.delete(schema.quotes).where(and(eq(schema.quotes.id, id), eq(schema.quotes.orgId, org.id)));
    }
    await db.update(schema.organizations).set({
      nextQuoteNumber: org.nextQuoteNumber, nextInvoiceNumber: org.nextInvoiceNumber,
      taxLabel: org.taxLabel, paymentTermsDays: org.paymentTermsDays,
    }).where(eq(schema.organizations.id, org.id));
  }
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
