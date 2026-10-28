"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  canManageCommercialSettings,
} from "@/lib/auth/permissions";
import { withOrgQuery } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireOrgAdmin(orgId: string) {
  const session = await requireSession();
  if (!canManageCommercialSettings(session.user)) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  return session;
}

export type OrgCommercialSettings = {
  quotePrefix: string;
  invoicePrefix: string;
  defaultTaxRateBps: number;
  taxLabel: string;
  taxId: string | null;
  paymentTermsDays: number;
  quoteValidDays: number;
  invoiceFooterText: string | null;
};

export async function getOrgCommercialSettings(
  orgId: string
): Promise<OrgCommercialSettings | null> {
  await requireOrgAdmin(orgId);
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
  if (!org) return null;
  return {
    quotePrefix: org.quotePrefix,
    invoicePrefix: org.invoicePrefix,
    defaultTaxRateBps: org.defaultTaxRateBps,
    taxLabel: org.taxLabel,
    taxId: org.taxId,
    paymentTermsDays: org.paymentTermsDays,
    quoteValidDays: org.quoteValidDays,
    invoiceFooterText: org.invoiceFooterText,
  };
}

export async function updateOrgCommercialSettings(
  orgId: string,
  formData: FormData
) {
  await requireOrgAdmin(orgId);

  const quotePrefix =
    String(formData.get("quotePrefix") ?? "Q").trim().slice(0, 8) || "Q";
  const invoicePrefix =
    String(formData.get("invoicePrefix") ?? "INV").trim().slice(0, 8) || "INV";
  const taxLabel = String(formData.get("taxLabel") ?? "Sales tax").trim();
  const taxId = String(formData.get("taxId") ?? "").trim() || null;
  const taxPercent = Number(String(formData.get("taxRatePercent") ?? "0"));
  const defaultTaxRateBps = Number.isFinite(taxPercent)
    ? Math.round(taxPercent * 100)
    : 0;
  const paymentTermsDays = Math.max(
    1,
    Math.min(365, Number(String(formData.get("paymentTermsDays") ?? "30")))
  );
  const quoteValidDays = Math.max(
    1,
    Math.min(90, Number(String(formData.get("quoteValidDays") ?? "14")))
  );
  const invoiceFooterText =
    String(formData.get("invoiceFooterText") ?? "").trim() || null;

  await withOrgQuery(orgId, (database) =>
    database
      .update(organizations)
      .set({
        quotePrefix,
        invoicePrefix,
        defaultTaxRateBps,
        taxLabel,
        taxId,
        paymentTermsDays,
        quoteValidDays,
        invoiceFooterText,
      })
      .where(eq(organizations.id, orgId))
  );

  revalidatePath("/dashboard/settings/commercial");
}
