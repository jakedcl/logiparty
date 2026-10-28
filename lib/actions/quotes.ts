"use server";

import { randomUUID } from "crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { activityLogInsert } from "@/lib/activity/log";
import {
  canManageCommercial,
  canRespondToQuotes,
} from "@/lib/auth/permissions";
import {
  computeCommercialTotals,
  formatCents,
  lineTotalFromQtyPrice,
  parseDollarsToCents,
} from "@/lib/commercial/money";
import { formatDocumentNumber } from "@/lib/commercial/numbering";
import { clientOnlyActor, db, withOrgQueries, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  jobs,
  organizations,
  quoteClientResponses,
  quoteLines,
  quotes,
  quoteVersions,
  rateCardLines,
  type Quote,
  type QuoteLine,
} from "@/lib/db/schema";
import {
  emailQuoteResponded,
  emailQuoteSent,
} from "@/lib/commercial/email-events";
import {
  getCommercialDownloadUrl,
  isStorageConfigured,
  putCommercialPdf,
} from "@/lib/storage/commercial";
import { buildCommercialPdf, type PdfLine } from "@/lib/pdf/commercial-pdf";
import {
  getSessionClientCompany,
  requireSession,
} from "@/lib/org/context";

export type QuoteListRow = Quote & { clientName: string | null };

export type QuoteDetail = {
  quote: Quote;
  lines: QuoteLine[];
  clientName: string;
  response: {
    signerName: string;
    decision: string;
    respondedAt: Date;
  } | null;
};

async function requireCommercialManager() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

async function requireClientResponder() {
  const session = await requireSession();
  if (!canRespondToQuotes(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  const company = await getSessionClientCompany(session);
  if (!company) throw new Error("No client company linked");
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
  if (!actor) throw new Error("Forbidden");
  return { session, company, actor };
}

function parseQty(raw: FormDataEntryValue | null): number {
  const n = Number(String(raw ?? "1").trim());
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid quantity");
  return n;
}

async function loadOrgCommercial(orgId: string) {
  const rows = await withOrgQuery<(typeof organizations.$inferSelect)[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
  );
  const org = rows[0];
  if (!org) throw new Error("Organization not found");
  return org;
}

async function recalculateQuote(orgId: string, quoteId: string) {
  const org = await loadOrgCommercial(orgId);
  const lines = await withOrgQuery<QuoteLine[]>(orgId, (database) =>
    database
      .select()
      .from(quoteLines)
      .where(eq(quoteLines.quoteId, quoteId))
      .orderBy(asc(quoteLines.sortOrder))
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
      .update(quotes)
      .set({
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
  );
}

export async function listQuotes(orgId: string): Promise<QuoteListRow[]> {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return withOrgQuery<QuoteListRow[]>(orgId, (database) =>
    database
      .select({
        id: quotes.id,
        orgId: quotes.orgId,
        clientCompanyId: quotes.clientCompanyId,
        quoteNumber: quotes.quoteNumber,
        status: quotes.status,
        version: quotes.version,
        title: quotes.title,
        eventStart: quotes.eventStart,
        eventEnd: quotes.eventEnd,
        validUntil: quotes.validUntil,
        currency: quotes.currency,
        subtotalCents: quotes.subtotalCents,
        taxCents: quotes.taxCents,
        totalCents: quotes.totalCents,
        depositCents: quotes.depositCents,
        notesInternal: quotes.notesInternal,
        notesClient: quotes.notesClient,
        sentAt: quotes.sentAt,
        sentByUserId: quotes.sentByUserId,
        jobId: quotes.jobId,
        pdfStorageKey: quotes.pdfStorageKey,
        createdBy: quotes.createdBy,
        createdAt: quotes.createdAt,
        updatedAt: quotes.updatedAt,
        clientName: clientCompanies.name,
      })
      .from(quotes)
      .leftJoin(
        clientCompanies,
        eq(quotes.clientCompanyId, clientCompanies.id)
      )
      .where(eq(quotes.orgId, orgId))
      .orderBy(desc(quotes.updatedAt))
  );
}

export async function listPortalQuotes(orgId: string): Promise<QuoteListRow[]> {
  const { session, company, actor } = await requireClientResponder();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  return withOrgQuery<QuoteListRow[]>(
    orgId,
    (database) =>
      database
        .select({
          id: quotes.id,
          orgId: quotes.orgId,
          clientCompanyId: quotes.clientCompanyId,
          quoteNumber: quotes.quoteNumber,
          status: quotes.status,
          version: quotes.version,
          title: quotes.title,
          eventStart: quotes.eventStart,
          eventEnd: quotes.eventEnd,
          validUntil: quotes.validUntil,
          currency: quotes.currency,
          subtotalCents: quotes.subtotalCents,
          taxCents: quotes.taxCents,
          totalCents: quotes.totalCents,
          depositCents: quotes.depositCents,
          notesInternal: quotes.notesInternal,
          notesClient: quotes.notesClient,
          sentAt: quotes.sentAt,
          sentByUserId: quotes.sentByUserId,
          jobId: quotes.jobId,
          pdfStorageKey: quotes.pdfStorageKey,
          createdBy: quotes.createdBy,
          createdAt: quotes.createdAt,
          updatedAt: quotes.updatedAt,
          clientName: clientCompanies.name,
        })
        .from(quotes)
        .leftJoin(
          clientCompanies,
          eq(quotes.clientCompanyId, clientCompanies.id)
        )
        .where(
          and(
            eq(quotes.orgId, orgId),
            eq(quotes.clientCompanyId, company.id)
          )
        )
        .orderBy(desc(quotes.sentAt), desc(quotes.createdAt)),
    actor
  );
}

export async function getQuoteDetail(
  orgId: string,
  quoteId: string,
  asClient = false
): Promise<QuoteDetail | null> {
  let actor;
  if (asClient) {
    const ctx = await requireClientResponder();
    if (ctx.session.user.orgId !== orgId) throw new Error("Forbidden");
    actor = ctx.actor;
  } else {
    const session = await requireCommercialManager();
    if (session.user.orgId !== orgId) throw new Error("Forbidden");
  }

  const [quote] = await withOrgQuery<Quote[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(quotes)
        .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
        .limit(1),
    actor
  );
  if (!quote) return null;

  const [company] = await withOrgQuery<{ name: string }[]>(
    orgId,
    (database) =>
      database
        .select({ name: clientCompanies.name })
        .from(clientCompanies)
        .where(eq(clientCompanies.id, quote.clientCompanyId))
        .limit(1),
    actor
  );

  const lines = await withOrgQuery<QuoteLine[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(quoteLines)
        .where(eq(quoteLines.quoteId, quoteId))
        .orderBy(asc(quoteLines.sortOrder)),
    actor
  );

  const [response] = await withOrgQuery<
    {
      signerName: string;
      decision: string;
      respondedAt: Date;
    }[]
  >(
    orgId,
    (database) =>
      database
        .select({
          signerName: quoteClientResponses.signerName,
          decision: quoteClientResponses.decision,
          respondedAt: quoteClientResponses.respondedAt,
        })
        .from(quoteClientResponses)
        .where(
          and(
            eq(quoteClientResponses.quoteId, quoteId),
            eq(quoteClientResponses.quoteVersion, quote.version)
          )
        )
        .limit(1),
    actor
  );

  return {
    quote,
    lines,
    clientName: company?.name ?? "Client",
    response: response ?? null,
  };
}

export async function createQuote(orgId: string, formData: FormData) {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const title = String(formData.get("title") ?? "").trim();
  const clientCompanyId = String(formData.get("clientCompanyId") ?? "").trim();
  if (!title) throw new Error("Title is required");
  if (!clientCompanyId) throw new Error("Client is required");

  const org = await loadOrgCommercial(orgId);
  const quoteNumber = formatDocumentNumber(
    org.quotePrefix,
    org.nextQuoteNumber
  );

  const results = await withOrgQueries(orgId, (database) => [
    database
      .update(organizations)
      .set({ nextQuoteNumber: sql`${organizations.nextQuoteNumber} + 1` })
      .where(eq(organizations.id, orgId)),
    database
      .insert(quotes)
      .values({
        orgId,
        clientCompanyId,
        quoteNumber,
        title,
        status: "draft",
        createdBy: session.user.id,
      })
      .returning(),
  ]);
  const created = (results[1] as Quote[])[0];

  redirect(`/dashboard/quotes/${created.id}`);
}

async function buildQuotePdfPayload(
  orgId: string,
  quoteId: string
): Promise<{ bytes: Uint8Array; snapshot: Record<string, unknown> }> {
  const detail = await getQuoteDetail(orgId, quoteId, false);
  if (!detail) throw new Error("Quote not found");
  const org = await loadOrgCommercial(orgId);
  const { quote, lines, clientName } = detail;

  const pdfLines: PdfLine[] = lines
    .filter((l) => l.kind !== "tax")
    .map((l) => ({
      description: l.description,
      quantity: String(l.quantity),
      unit: l.unit,
      unitPrice: formatCents(l.unitPriceCents),
      lineTotal: formatCents(l.lineTotalCents),
    }));

  const bytes = await buildCommercialPdf({
    orgName: org.name,
    orgPrimaryColor: org.primaryColor ?? undefined,
    documentLabel: "Quote",
    documentNumber: quote.quoteNumber,
    clientName,
    issueDate: new Date().toLocaleDateString("en-US"),
    validUntil: quote.validUntil
      ? new Date(quote.validUntil).toLocaleDateString("en-US")
      : undefined,
    lines: pdfLines,
    subtotal: formatCents(quote.subtotalCents),
    taxLabel: org.taxLabel,
    taxAmount: formatCents(quote.taxCents),
    total: formatCents(quote.totalCents),
    deposit: quote.depositCents
      ? formatCents(quote.depositCents)
      : undefined,
    notesClient: quote.notesClient ?? undefined,
    footer: org.invoiceFooterText ?? undefined,
  });

  return {
    bytes,
    snapshot: {
      quote,
      lines,
      clientName,
      totals: {
        subtotalCents: quote.subtotalCents,
        taxCents: quote.taxCents,
        totalCents: quote.totalCents,
      },
    },
  };
}

export async function sendQuote(orgId: string, quoteId: string) {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [quote] = await withOrgQuery<Quote[]>(orgId, (database) =>
    database
      .select()
      .from(quotes)
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
      .limit(1)
  );
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "draft" && quote.status !== "declined") {
    throw new Error("Only draft or declined quotes can be sent");
  }

  await recalculateQuote(orgId, quoteId);
  const org = await loadOrgCommercial(orgId);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + org.quoteValidDays);

  const nextVersion =
    quote.status === "draft" ? quote.version : quote.version + 1;
  const { bytes, snapshot } = await buildQuotePdfPayload(orgId, quoteId);

  let pdfKey: string | null = null;
  if (isStorageConfigured()) {
    pdfKey = await putCommercialPdf({
      orgId,
      docType: "quotes",
      docId: quoteId,
      version: nextVersion,
      bytes,
    });
  }

  await withOrgQueries(orgId, (database) => [
    database.insert(quoteVersions).values({
      orgId,
      quoteId,
      version: nextVersion,
      snapshotJson: snapshot,
      pdfStorageKey: pdfKey,
    }),
    database
      .update(quotes)
      .set({
        status: "sent",
        version: nextVersion,
        sentAt: new Date(),
        sentByUserId: session.user.id,
        validUntil,
        pdfStorageKey: pdfKey,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId)),
    activityLogInsert(database, {
      orgId,
      userId: session.user.id,
      action: `Sent quote ${quote.quoteNumber}`,
      entityType: "quote",
      entityId: quoteId,
      isClientVisible: true,
    }),
  ]);

  await emailQuoteSent({
    orgId,
    orgName: org.name,
    orgSlug: session.user.orgSlug ?? "",
    clientCompanyId: quote.clientCompanyId,
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    quoteId,
  });

  revalidatePath("/dashboard/quotes");
  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/portal/quotes");
  revalidatePath("/dashboard/notifications");
}

export async function respondToQuote(
  orgId: string,
  quoteId: string,
  formData: FormData
) {
  const { session, actor } = await requireClientResponder();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const decision = String(formData.get("decision") ?? "").trim();
  if (decision !== "approved" && decision !== "declined") {
    throw new Error("Invalid decision");
  }
  const signerName = String(formData.get("signerName") ?? "").trim();
  if (!signerName) throw new Error("Your name is required");
  const declineReason =
    String(formData.get("declineReason") ?? "").trim() || null;

  const [quote] = await withOrgQuery<Quote[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(quotes)
        .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
        .limit(1),
    actor
  );
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "sent") {
    throw new Error("This quote is not awaiting review");
  }

  await withOrgQueries(
    orgId,
    (database) => [
      database.insert(quoteClientResponses).values({
        orgId,
        quoteId,
        quoteVersion: quote.version,
        decision,
        signerName,
        respondedByUserId: session.user.id,
        declineReason,
      }),
      database
        .update(quotes)
        .set({
          status: decision === "approved" ? "approved" : "declined",
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId)),
      activityLogInsert(database, {
        orgId,
        userId: session.user.id,
        action:
          decision === "approved"
            ? `Approved quote ${quote.quoteNumber}`
            : `Declined quote ${quote.quoteNumber}`,
        entityType: "quote",
        entityId: quoteId,
        metadata: { signerName },
        isClientVisible: true,
      }),
    ],
    actor
  );

  const org = await loadOrgCommercial(orgId);
  await emailQuoteResponded({
    orgId,
    orgName: org.name,
    orgSlug: session.user.orgSlug ?? "",
    quoteNumber: quote.quoteNumber,
    title: quote.title,
    quoteId,
    approved: decision === "approved",
    signerName,
  });

  revalidatePath("/portal/quotes");
  revalidatePath(`/portal/quotes/${quoteId}`);
  revalidatePath("/dashboard/quotes");
  revalidatePath("/dashboard/notifications");
}

/** Pull a sent/declined/expired quote back to draft and bump version for a clean re-edit. */
export async function reviseQuote(orgId: string, quoteId: string) {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [quote] = await withOrgQuery<Quote[]>(orgId, (database) =>
    database
      .select()
      .from(quotes)
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
      .limit(1)
  );
  if (!quote) throw new Error("Quote not found");
  if (quote.jobId) throw new Error("Cannot revise a quote already linked to a job");
  if (!["sent", "declined", "expired"].includes(quote.status)) {
    throw new Error("Only sent, declined, or expired quotes can be revised");
  }

  await withOrgQuery(orgId, (database) =>
    database
      .update(quotes)
      .set({
        status: "draft",
        version: quote.version + 1,
        sentAt: null,
        sentByUserId: null,
        validUntil: null,
        pdfStorageKey: null,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId))
  );

  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath("/dashboard/quotes");
}

export async function convertQuoteToJob(orgId: string, quoteId: string) {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [quote] = await withOrgQuery<Quote[]>(orgId, (database) =>
    database
      .select()
      .from(quotes)
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
      .limit(1)
  );
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "approved") throw new Error("Quote must be approved");
  if (quote.jobId) redirect(`/dashboard/jobs/${quote.jobId}`);

  const jobId = randomUUID();
  await withOrgQueries(orgId, (database) => [
    database.insert(jobs).values({
      id: jobId,
      orgId,
      clientCompanyId: quote.clientCompanyId,
      name: quote.title,
      status: "draft",
      jobStart: quote.eventStart,
      jobEnd: quote.eventEnd,
      loadInStart: quote.eventStart,
      loadOutEnd: quote.eventEnd,
      quoteId: quote.id,
      quoteVersion: quote.version,
      createdBy: session.user.id,
      notes: quote.notesInternal,
    }),
    database
      .update(quotes)
      .set({ jobId, updatedAt: new Date() })
      .where(eq(quotes.id, quoteId)),
    activityLogInsert(database, {
      orgId,
      userId: session.user.id,
      action: `Converted quote ${quote.quoteNumber} to job`,
      entityType: "quote",
      entityId: quoteId,
      jobId,
    }),
  ]);

  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${jobId}`);
}

export async function upsertQuoteLine(
  orgId: string,
  quoteId: string,
  formData: FormData
) {
  const session = await requireCommercialManager();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [quote] = await withOrgQuery<Quote[]>(orgId, (database) =>
    database
      .select()
      .from(quotes)
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
      .limit(1)
  );
  if (!quote) throw new Error("Quote not found");
  if (quote.status !== "draft" && quote.status !== "declined") {
    throw new Error("Edit lines only while draft or declined");
  }

  const lineId = String(formData.get("lineId") ?? "").trim();
  const rateLineId = String(formData.get("rateCardLineId") ?? "").trim();
  let description = String(formData.get("description") ?? "").trim();
  let kind = String(formData.get("kind") ?? "custom").trim() as QuoteLine["kind"];
  let unit = String(formData.get("unit") ?? "each").trim() as QuoteLine["unit"];
  let unitPriceCents = parseDollarsToCents(
    String(formData.get("unitPrice") ?? "0")
  );
  let inventoryItemId: string | null = null;
  let fleetVehicleId: string | null = null;

  if (rateLineId) {
    const [rate] = await withOrgQuery<(typeof rateCardLines.$inferSelect)[]>(
      orgId,
      (database) =>
        database
          .select()
          .from(rateCardLines)
          .where(
            and(eq(rateCardLines.orgId, orgId), eq(rateCardLines.id, rateLineId))
          )
          .limit(1)
    );
    if (!rate) throw new Error("Rate line not found");
    description = rate.description;
    kind = rate.kind === "fee" ? "fee" : (rate.kind as QuoteLine["kind"]);
    unit = rate.unit;
    unitPriceCents = rate.unitPriceCents;
    inventoryItemId = rate.inventoryItemId;
    fleetVehicleId = rate.fleetVehicleId;
  }

  if (!description) throw new Error("Description is required");
  const quantity = parseQty(formData.get("quantity"));
  const lineTotalCents = lineTotalFromQtyPrice(quantity, unitPriceCents);
  const taxable = formData.get("taxable") !== "off";

  if (lineId) {
    await withOrgQuery(orgId, (database) =>
      database
        .update(quoteLines)
        .set({
          description,
          kind,
          unit,
          unitPriceCents,
          quantity: String(quantity),
          lineTotalCents,
          taxable,
          inventoryItemId,
          fleetVehicleId,
        })
        .where(and(eq(quoteLines.id, lineId), eq(quoteLines.quoteId, quoteId)))
    );
  } else {
    const sort = await withOrgQuery<{ n: number }[]>(orgId, (database) =>
      database
        .select({
          n: sql<number>`coalesce(max(${quoteLines.sortOrder}), -1) + 1`,
        })
        .from(quoteLines)
        .where(eq(quoteLines.quoteId, quoteId))
    );
    await withOrgQuery(orgId, (database) =>
      database.insert(quoteLines).values({
        orgId,
        quoteId,
        sortOrder: sort[0]?.n ?? 0,
        description,
        kind,
        unit,
        unitPriceCents,
        quantity: String(quantity),
        lineTotalCents,
        taxable,
        inventoryItemId,
        fleetVehicleId,
        sourceRateCardLineId: rateLineId || null,
      })
    );
  }

  await recalculateQuote(orgId, quoteId);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function deleteQuoteLine(
  orgId: string,
  quoteId: string,
  lineId: string
) {
  await requireCommercialManager();
  await withOrgQuery(orgId, (database) =>
    database
      .delete(quoteLines)
      .where(and(eq(quoteLines.id, lineId), eq(quoteLines.quoteId, quoteId)))
  );
  await recalculateQuote(orgId, quoteId);
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function updateQuoteMeta(
  orgId: string,
  quoteId: string,
  formData: FormData
) {
  await requireCommercialManager();
  const depositRaw = String(formData.get("deposit") ?? "").trim();
  const depositCents = depositRaw ? parseDollarsToCents(depositRaw) : null;

  await withOrgQuery(orgId, (database) =>
    database
      .update(quotes)
      .set({
        title: String(formData.get("title") ?? "").trim(),
        notesClient: String(formData.get("notesClient") ?? "").trim() || null,
        notesInternal:
          String(formData.get("notesInternal") ?? "").trim() || null,
        depositCents,
        eventStart: formData.get("eventStart")
          ? new Date(String(formData.get("eventStart")))
          : null,
        eventEnd: formData.get("eventEnd")
          ? new Date(String(formData.get("eventEnd")))
          : null,
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
  );
  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function getQuotePdfUrl(orgId: string, quoteId: string) {
  const session = await requireSession();
  const isManager = canManageCommercial(session.user);
  let actor;
  if (session.user.isClient && !isManager) {
    const ctx = await requireClientResponder();
    if (ctx.session.user.orgId !== orgId) throw new Error("Forbidden");
    actor = ctx.actor;
  } else if (isManager) {
    if (session.user.orgId !== orgId) throw new Error("Forbidden");
  } else {
    throw new Error("Forbidden");
  }

  const [quote] = await withOrgQuery<Quote[]>(
    orgId,
    (database) =>
      database
        .select()
        .from(quotes)
        .where(and(eq(quotes.orgId, orgId), eq(quotes.id, quoteId)))
        .limit(1),
    actor
  );
  if (!quote) throw new Error("Quote not found");
  if (session.user.isClient && quote.status === "draft") {
    throw new Error("Forbidden");
  }

  if (quote.pdfStorageKey && isStorageConfigured()) {
    return getCommercialDownloadUrl(quote.pdfStorageKey);
  }

  const { bytes } = await buildQuotePdfPayload(orgId, quoteId);
  return `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
}

export async function assertCommercialAccessForSession() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) throw new Error("Forbidden");
}
