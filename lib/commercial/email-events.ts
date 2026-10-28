import {
  notifyClientCompanyUsers,
  notifyManagers,
  tenantAbsoluteUrl,
} from "@/lib/email/notify";

export async function emailQuoteSent(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  clientCompanyId: string;
  quoteNumber: string;
  title: string;
  quoteId: string;
}) {
  await notifyClientCompanyUsers({
    orgId: params.orgId,
    orgName: params.orgName,
    orgSlug: params.orgSlug,
    clientCompanyId: params.clientCompanyId,
    subject: `Quote ${params.quoteNumber} — ${params.title}`,
    headline: "New quote to review",
    body: `${params.orgName} sent quote ${params.quoteNumber} for “${params.title}”. Review the line items and approve or decline in your portal.`,
    path: `/portal/quotes/${params.quoteId}`,
  });
}

export async function emailQuoteResponded(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  quoteNumber: string;
  title: string;
  quoteId: string;
  approved: boolean;
  signerName: string;
}) {
  await notifyManagers({
    orgId: params.orgId,
    orgName: params.orgName,
    orgSlug: params.orgSlug,
    subject: params.approved
      ? `Quote ${params.quoteNumber} approved`
      : `Quote ${params.quoteNumber} declined`,
    headline: params.approved ? "Client approved quote" : "Client declined quote",
    body: params.approved
      ? `${params.signerName} approved quote ${params.quoteNumber} (“${params.title}”). You can convert it to a job when ready.`
      : `${params.signerName} declined quote ${params.quoteNumber} (“${params.title}”). Revise and send a new version if needed.`,
    path: `/dashboard/quotes/${params.quoteId}`,
  });
}

export async function emailInvoiceSent(params: {
  orgId: string;
  orgName: string;
  orgSlug: string;
  clientCompanyId: string;
  invoiceNumber: string;
  quoteId?: string | null;
  invoiceId: string;
}) {
  await notifyClientCompanyUsers({
    orgId: params.orgId,
    orgName: params.orgName,
    orgSlug: params.orgSlug,
    clientCompanyId: params.clientCompanyId,
    subject: `Invoice ${params.invoiceNumber}`,
    headline: "Invoice ready",
    body: `${params.orgName} sent invoice ${params.invoiceNumber}. View details and pay online if a payment link is included.`,
    path: `/portal/invoices`,
  });
}

export { tenantAbsoluteUrl };
