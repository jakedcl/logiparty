/**
 * Integration check for assertJobCanHoldLocks against a real database.
 * Run: DATABASE_URL=<throwaway branch> npx tsx scripts/activation-check.ts
 * Creates and removes its own fixtures inside the `test` org. Never run it
 * against production.
 */
import { and, eq } from "drizzle-orm";

async function main() {
  const { db } = await import("../lib/db");
  const schema = await import("../lib/db/schema");
  const { assertJobCanHoldLocks } = await import("../lib/jobs/activation");
  if (!db) throw new Error("DATABASE_URL required");

  const [org] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, "test"))
    .limit(1);
  if (!org) throw new Error("org `test` not found");
  const [company] = await db
    .select()
    .from(schema.clientCompanies)
    .where(eq(schema.clientCompanies.orgId, org.id))
    .limit(1);
  if (!company) throw new Error("no client company in org `test`");

  const sku = `ZZ-ACT-${Date.now()}`;
  const [item] = await db
    .insert(schema.clientInventoryItems)
    .values({
      orgId: org.id,
      clientCompanyId: company.id,
      sku,
      name: "Activation check item",
      totalQuantity: 10,
    })
    .returning();

  const makeJob = async (name: string) => {
    const [job] = await db!
      .insert(schema.jobs)
      .values({
        orgId: org.id,
        clientCompanyId: company.id,
        name,
        status: "draft",
      })
      .returning();
    await db!.insert(schema.jobInventoryLines).values({
      orgId: org.id,
      jobId: job.id,
      itemType: "client",
      clientItemId: item.id,
      orgItemId: null,
      quantityAssigned: 10,
      quantityLoaded: 0,
    });
    return job;
  };

  const jobA = await makeJob("Activation check A");
  const jobB = await makeJob("Activation check B");
  const results: string[] = [];
  try {
    await assertJobCanHoldLocks({ orgId: org.id, jobId: jobA.id });
    results.push("PASS A fits while nothing else is locked");

    await db
      .update(schema.jobs)
      .set({ status: "upcoming" })
      .where(eq(schema.jobs.id, jobA.id));

    try {
      await assertJobCanHoldLocks({ orgId: org.id, jobId: jobB.id });
      results.push("FAIL B should have been rejected (double booking)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/10 needed but only 0 available/.test(msg)) {
        results.push("PASS B rejected: " + msg.slice(0, 90) + "...");
      } else {
        results.push("FAIL B rejected with unexpected message: " + msg);
      }
    }

    // A re-checking itself must exclude its own lines.
    await assertJobCanHoldLocks({ orgId: org.id, jobId: jobA.id });
    results.push("PASS A still fits when re-checked against itself");

    // Locks release when A completes.
    await db
      .update(schema.jobs)
      .set({ status: "completed" })
      .where(eq(schema.jobs.id, jobA.id));
    await assertJobCanHoldLocks({ orgId: org.id, jobId: jobB.id });
    results.push("PASS B fits once A is completed");
  } finally {
    for (const j of [jobA, jobB]) {
      await db
        .delete(schema.jobInventoryLines)
        .where(eq(schema.jobInventoryLines.jobId, j.id));
      await db.delete(schema.jobs).where(eq(schema.jobs.id, j.id));
    }
    await db
      .delete(schema.clientInventoryItems)
      .where(
        and(
          eq(schema.clientInventoryItems.id, item.id),
          eq(schema.clientInventoryItems.orgId, org.id)
        )
      );
  }
  console.log(results.join("\n"));
  if (results.some((r) => r.startsWith("FAIL"))) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
