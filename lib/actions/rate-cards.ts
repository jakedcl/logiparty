"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { canManageCommercial } from "@/lib/auth/permissions";
import { parseDollarsToCents } from "@/lib/commercial/money";
import { db, withOrgQuery } from "@/lib/db";
import {
  fleetVehicles,
  inventoryItems,
  rateCardLines,
  rateCards,
  type RateCardLine,
} from "@/lib/db/schema";
import { requireSession } from "@/lib/org/context";

async function requireCommercial() {
  const session = await requireSession();
  if (!canManageCommercial(session.user)) throw new Error("Forbidden");
  if (!db) throw new Error("Database not configured");
  return session;
}

export async function ensureDefaultRateCard(orgId: string): Promise<string> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const existing = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .select({ id: rateCards.id })
      .from(rateCards)
      .where(and(eq(rateCards.orgId, orgId), eq(rateCards.isDefault, true)))
      .limit(1)
  );
  if (existing[0]) return existing[0].id;

  const [created] = await withOrgQuery<{ id: string }[]>(orgId, (database) =>
    database
      .insert(rateCards)
      .values({ orgId, name: "Default", isDefault: true })
      .returning({ id: rateCards.id })
  );
  return created.id;
}

export async function listRateCardLines(orgId: string): Promise<RateCardLine[]> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  const cardId = await ensureDefaultRateCard(orgId);
  return withOrgQuery<RateCardLine[]>(orgId, (database) =>
    database
      .select()
      .from(rateCardLines)
      .where(
        and(eq(rateCardLines.orgId, orgId), eq(rateCardLines.rateCardId, cardId))
      )
      .orderBy(asc(rateCardLines.description))
  );
}

export async function createRateCardLine(
  orgId: string,
  formData: FormData
): Promise<void> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const kind = String(formData.get("kind") ?? "").trim();
  if (!["equipment", "labor", "fleet", "fee"].includes(kind)) {
    throw new Error("Invalid kind");
  }
  const description = String(formData.get("description") ?? "").trim();
  if (!description) throw new Error("Description is required");

  const unit = String(formData.get("unit") ?? "each").trim();
  const unitPriceCents = parseDollarsToCents(
    String(formData.get("unitPrice") ?? "0")
  );
  const inventoryItemId =
    String(formData.get("inventoryItemId") ?? "").trim() || null;
  const fleetVehicleId =
    String(formData.get("fleetVehicleId") ?? "").trim() || null;
  const laborRole = String(formData.get("laborRole") ?? "").trim() || null;

  const cardId = await ensureDefaultRateCard(orgId);

  await withOrgQuery(orgId, (database) =>
    database.insert(rateCardLines).values({
      orgId,
      rateCardId: cardId,
      kind,
      description,
      unit: unit as "each" | "day" | "hour" | "flat" | "percent",
      unitPriceCents,
      inventoryItemId,
      fleetVehicleId,
      laborRole,
    })
  );

  revalidatePath("/dashboard/settings/commercial");
}

export async function deleteRateCardLine(
  orgId: string,
  lineId: string
): Promise<void> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  await withOrgQuery(orgId, (database) =>
    database
      .delete(rateCardLines)
      .where(and(eq(rateCardLines.orgId, orgId), eq(rateCardLines.id, lineId)))
  );
  revalidatePath("/dashboard/settings/commercial");
}

export async function listRateCardCatalogOptions(orgId: string): Promise<{
  equipment: { id: string; sku: string; name: string }[];
  fleet: { id: string; name: string }[];
}> {
  const session = await requireCommercial();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const [equipment, fleet] = await Promise.all([
    withOrgQuery<{ id: string; sku: string; name: string }[]>(orgId, (database) =>
      database
        .select({
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          name: inventoryItems.name,
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.orgId, orgId))
        .orderBy(asc(inventoryItems.name))
    ),
    withOrgQuery<{ id: string; name: string }[]>(orgId, (database) =>
      database
        .select({
          id: fleetVehicles.id,
          name: fleetVehicles.name,
        })
        .from(fleetVehicles)
        .where(eq(fleetVehicles.orgId, orgId))
        .orderBy(asc(fleetVehicles.name))
    ),
  ]);

  return { equipment, fleet };
}
