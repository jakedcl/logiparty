"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import { canManageCommercial } from "@/lib/auth/permissions";
import {
  computeCommercialTotals,
  formatCents,
  lineTotalFromQtyPrice,
  parseDollarsToCents,
} from "@/lib/commercial/money";
import { formatDocumentNumber } from "@/lib/commercial/numbering";
import { clientOnlyActor, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  invoiceLines,
  invoicePayments,
  invoices,
  jobs,
  organizations,
  quoteLines,
  type Invoice,
  type InvoiceLine,
} from "@/lib/db/schema";
import { buildCommercialPdf, type PdfLine } from "@/lib/pdf/commercial-pdf";
import {
  getCommercialDownloadUrl,
  isStorageConfigured,
  putCommercialPdf,
} from "@/lib/storage/commercial";
import { getSessionClientCompany, requireSession } from "@/lib/org/context";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

async function requireCommercial() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) throw new Error("Forbidden");
  return session;
}

export type InvoiceListRow = Invoice & { clientName: string | null };

export async function listInvoices(orgId: string): Promise<InvoiceListRow[]> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<InvoiceListRow[]>(orgId, (database) =>
    database
      .select({
        id: invoices.id,
        orgId: invoices.orgId,
        clientCompanyId: invoices.clientCompanyId,
        jobId: invoices.jobId,
        quoteId: invoices.quoteId,
        invoiceNumber: invoices.invoiceNumber,
        status: invoices.status,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        currency: invoices.currency,
        subtotalCents: invoices.subtotalCents,
        taxCents: invoices.taxCents,
        totalCents: invoices.totalCents,
        amountPaidCents: invoices.amountPaidCents,
        notesClient: invoices.notesClient,
        notesInternal: invoices.notesInternal,
        sentAt: invoices.sentAt,
        paidAt: invoices.paidAt,
        stripePaymentLinkId: invoices.stripePaymentLinkId,
        stripePaymentLinkUrl: invoices.stripePaymentLinkUrl,
        pdfStorageKey: invoices.pdfStorageKey,
        createdBy: invoices.createdBy,
        createdAt: invoices.createdAt,
        updatedAt: invoices.updatedAt,
        clientName: clientCompanies.name,
      })
      .from(invoices)
      .leftJoin(
        clientCompanies,
        eq(invoices.clientCompanyId, clientCompanies.id)
      )
      .where(eq(invoices.orgId, orgId))
      .orderBy(desc(invoices.updatedAt))
  );
}

export async function createInvoiceFromJob(orgId: string, jobId: string) {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [job] = await withOrgQuery<(typeof jobs.$inferSelect)[]>(orgId, (database) =>
    database
      .select()
      .from(jobs)
      .where(and(eq(jobs.orgId, orgId), eq(jobs.id, jobId)))
      .limit(1)
  );
  if (!job) throw new Error("Job not found");

  const orgRows = await withOrgQuery<(typeof organizations.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
  );
  const org = orgRows[0];
  if (!org) throw new Error("Org not found");

  const invoiceNumber = formatDocumentNumber(
    org.invoicePrefix,
    org.nextInvoiceNumber
  );
  const due = new Date();
  due.setDate(due.getDate() + org.paymentTermsDays);

  let quoteLinesRows: (typeof quoteLines.$inferSelect)[] = [];
  if (job.quoteId) {
    quoteLinesRows = await withOrgQuery<(typeof quoteLines.$inferSelect)[]>(
      orgId,
      (database) =>
        database
          .select()
          .from(quoteLines)
          .where(eq(quoteLines.quoteId, job.quoteId!))
    );
  }

  const invoiceId = crypto.randomUUID();
  const lineValues = quoteLinesRows.map((l, i) => ({
    id: crypto.randomUUID(),
    orgId,
    invoiceId,
    sortOrder: i,
    kind: l.kind,
    description: l.description,
    quantity: l.quantity,
    unit: l.unit,
    unitPriceCents: l.unitPriceCents,
    lineTotalCents: l.lineTotalCents,
    taxable: l.taxable,
  }));

  const totals = computeCommercialTotals({
    lines: lineValues.map((l) => ({
      lineTotalCents: l.lineTotalCents,
      taxable: l.taxable,
      kind: l.kind,
    })),
    defaultTaxRateBps: org.defaultTaxRateBps,
  });

  await withOrgQuery(orgId, (database) =>
    database
      .update(organizations)
      .set({
        nextInvoiceNumber: sql`${organizations.nextInvoiceNumber} + 1`,
      })
      .where(eq(organizations.id, orgId))
  );
  await withOrgQuery(orgId, (database) =>
    database.insert(invoices).values({
      id: invoiceId,
      orgId,
      clientCompanyId: job.clientCompanyId,
      jobId,
      quoteId: job.quoteId,
      invoiceNumber,
      status: "draft",
      dueDate: due.toISOString().slice(0, 10),
      subtotalCents: totals.subtotalCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      createdBy: session.user.id,
    })
  );
  if (lineValues.length > 0) {
    await withOrgQuery(orgId, (database) =>
      database.insert(invoiceLines).values(lineValues)
    );
  }

  redirect(`/dashboard/invoices/${invoiceId}`);
}

export async function addInvoiceLine(
  orgId: string,
  invoiceId: string,
  formData: FormData
) {
  await requireCommercial();
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Description is required");
  const kind = String(formData.get("kind") ?? "custom").trim();
  const quantity = Number(String(formData.get("quantity") ?? "1"));
  const unitPriceCents = parseDollarsToCents(
    String(formData.get("unitPrice") ?? "0")
  );
  const lineTotalCents = lineTotalFromQtyPrice(quantity, unitPriceCents);

  await withOrgQuery(orgId, (database) =>
    database.insert(invoiceLines).values({
      orgId,
      invoiceId,
      description,
      kind: kind as InvoiceLine["kind"],
      quantity: String(quantity),
      lineTotalCents,
      unitPriceCents,
    })
  );
  await recalcInvoice(orgId, invoiceId);
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
}

async function recalcInvoice(orgId: string, invoiceId: string) {
  const orgRows = await withOrgQuery<(typeof organizations.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
  );
  const org = orgRows[0]!;
  const lines = await withOrgQuery<(typeof invoiceLines.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, invoiceId))
  );
  const totals = computeCommercialTotals({
    lines: lines.map((l) => ({
      lineTotalCents: l.lineTotalCents,
      taxable: l.taxable,
      kind: l.kind,
    })),
    defaultTaxRateBps: org.defaultTaxRateBps,
  });
  await withOrgQuery(orgId, (database) =>
    database
      .update(invoices)
      .set({
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
  );
}

export async function sendInvoice(orgId: string, invoiceId: string) {
  const session = await requireCommercial();
  await recalcInvoice(orgId, invoiceId);

  const invoiceRows = await withOrgQuery<(typeof invoices.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.id, invoiceId)))
        .limit(1)
  );
  const invoice = invoiceRows[0];
  if (!invoice) throw new Error("Invoice not found");

  const orgRows = await withOrgQuery<(typeof organizations.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
  );
  const org = orgRows[0]!;

  const companyRows = await withOrgQuery<{ name: string }[]>(orgId, (database) =>
    database
      .select({ name: clientCompanies.name })
      .from(clientCompanies)
      .where(eq(clientCompanies.id, invoice.clientCompanyId))
      .limit(1)
  );

  const lines = await withOrgQuery<(typeof invoiceLines.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, invoiceId))
  );

  const pdfLines: PdfLine[] = lines.map((l) => ({
    description: l.description,
    quantity: String(l.quantity),
    unit: l.unit,
    unitPrice: formatCents(l.unitPriceCents),
    lineTotal: formatCents(l.lineTotalCents),
  }));

  const bytes = await buildCommercialPdf({
    orgName: org.name,
    orgPrimaryColor: org.primaryColor ?? undefined,
    documentLabel: "Invoice",
    documentNumber: invoice.invoiceNumber,
    clientName: companyRows[0]?.name ?? "Client",
    issueDate: String(invoice.issueDate),
    dueDate: String(invoice.dueDate),
    lines: pdfLines,
    subtotal: formatCents(invoice.subtotalCents),
    taxLabel: org.taxLabel,
    taxAmount: formatCents(invoice.taxCents),
    total: formatCents(invoice.totalCents),
    notesClient: invoice.notesClient ?? undefined,
    footer: org.invoiceFooterText ?? undefined,
  });

  let pdfKey: string | null = null;
  if (isStorageConfigured()) {
    pdfKey = await putCommercialPdf({
      orgId,
      docType: "invoices",
      docId: invoiceId,
      version: 1,
      bytes,
    });
  }

  let paymentLinkUrl: string | null = null;
  let paymentLinkId: string | null = null;
  if (isStripeConfigured()) {
    const stripe = getStripe()!;
    const amountDue = invoice.totalCents - invoice.amountPaidCents;
    if (amountDue > 0) {
      const link = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amountDue,
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          orgId,
          invoiceId,
        },
      });
      paymentLinkUrl = link.url;
      paymentLinkId = link.id;
    }
  }

  await withOrgQueries(orgId, (database) => [
    database
      .update(invoices)
      .set({
        status: "sent",
        sentAt: new Date(),
        pdfStorageKey: pdfKey,
        stripePaymentLinkId: paymentLinkId,
        stripePaymentLinkUrl: paymentLinkUrl,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId)),
    activityLogInsert(database, {
      orgId,
      userId: session.user.id,
      action: `Sent invoice ${invoice.invoiceNumber}`,
      entityType: "invoice",
      entityId: invoiceId,
      jobId: invoice.jobId,
      isClientVisible: true,
    }),
  ]);

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
  revalidatePath("/portal/invoices");
}

export async function listPortalInvoices(orgId: string): Promise<Invoice[]> {
  const session = await requireSession();
  if (!session.user.isClient) throw new Error("Forbidden");
  const company = await getSessionClientCompany(session);
  if (!company) throw new Error("No client company");
  const actor = clientOnlyActor(
    {
      id: session.user.id,
      isOrgAdmin: session.user.isOrgAdmin,
      isManager: session.user.isManager,
      isStaff: session.user.isStaff,
      isClient: session.user.isClient,
    },
    company.id
  );
  return withOrgQuery<Invoice[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, orgId),
            eq(invoices.clientCompanyId, company.id)
          )
        )
        .orderBy(desc(invoices.sentAt)),
    actor
  );
}

export async function getInvoiceDetail(
  orgId: string,
  invoiceId: string
): Promise<{
  invoice: typeof invoices.$inferSelect | undefined;
  lines: (typeof invoiceLines.$inferSelect)[];
}> {
  await requireCommercial();
  const invoiceRows = await withOrgQuery<(typeof invoices.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.id, invoiceId)))
        .limit(1)
  );
  const lines = await withOrgQuery<(typeof invoiceLines.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, invoiceId))
  );
  return { invoice: invoiceRows[0], lines };
}

export async function recordManualPayment(
  orgId: string,
  invoiceId: string,
  formData: FormData
) {
  const session = await requireCommercial();
  const amountCents = parseDollarsToCents(String(formData.get("amount") ?? "0"));
  await withOrgQueries(orgId, (database) => [
    database.insert(invoicePayments).values({
      orgId,
      invoiceId,
      amountCents,
      method: "other",
      recordedByUserId: session.user.id,
    }),
    database
      .update(invoices)
      .set({
        amountPaidCents: sql`${invoices.amountPaidCents} + ${amountCents}`,
        status: "paid",
        paidAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId)),
  ]);
  revalidatePath(`/dashboard/invoices/${invoiceId}`);
}

export async function getInvoicePdfUrl(orgId: string, invoiceId: string) {
  const session = await requireSession();
  const isManager = canManageCommercial(session.user);
  let actor;
  if (session.user.isClient && !isManager) {
    const company = await getSessionClientCompany(session);
    if (!company) throw new Error("Forbidden");
    actor = clientOnlyActor(
      {
        id: session.user.id,
        isOrgAdmin: session.user.isOrgAdmin,
        isManager: session.user.isManager,
        isStaff: session.user.isStaff,
        isClient: session.user.isClient,
      },
      company.id
    );
  } else if (!isManager) {
    throw new Error("Forbidden");
  }

  const invoiceRows = await withOrgQuery<(typeof invoices.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(invoices)
        .where(and(eq(invoices.orgId, orgId), eq(invoices.id, invoiceId)))
        .limit(1),
    actor
  );
  const invoice = invoiceRows[0];
  if (!invoice?.pdfStorageKey || !isStorageConfigured()) {
    throw new Error("PDF not available yet — send the invoice first");
  }
  return getCommercialDownloadUrl(invoice.pdfStorageKey);
}
