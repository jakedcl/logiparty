import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { formatDocumentNumber } from "@/lib/commercial/numbering";

/**
 * Atomically take the next quote or invoice number for an org. The counter is
 * incremented and read back in one UPDATE ... RETURNING, so concurrent callers
 * always get distinct numbers (a failure after this point can leave a gap, but
 * never a duplicate). Uses the plain client because the restricted app role has
 * no access to `organizations` (see lib/org/organization.ts).
 */
export async function allocateDocumentNumber(
  orgId: string,
  kind: "quote" | "invoice"
): Promise<string> {
  if (!db) throw new Error("DATABASE_URL is not configured");
  const rows =
    kind === "quote"
      ? await db
          .update(organizations)
          .set({ nextQuoteNumber: sql`${organizations.nextQuoteNumber} + 1` })
          .where(eq(organizations.id, orgId))
          .returning({
            prefix: organizations.quotePrefix,
            next: organizations.nextQuoteNumber,
          })
      : await db
          .update(organizations)
          .set({
            nextInvoiceNumber: sql`${organizations.nextInvoiceNumber} + 1`,
          })
          .where(eq(organizations.id, orgId))
          .returning({
            prefix: organizations.invoicePrefix,
            next: organizations.nextInvoiceNumber,
          });
  const row = rows[0];
  if (!row) throw new Error("Organization not found");
  // RETURNING gives the incremented counter; the number we own is one less.
  return formatDocumentNumber(row.prefix, row.next - 1);
}
