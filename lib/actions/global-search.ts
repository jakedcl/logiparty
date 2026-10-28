"use server";

import { and, asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  canManageCommercial,
  canManageJobs,
  canViewFleet,
  canViewMyJobs,
} from "@/lib/auth/permissions";
import { db, withOrgQuery } from "@/lib/db";
import {
  clientCompanies,
  fleetVehicles,
  inventoryItems,
  jobAssignments,
  jobs,
  invoices,
  quotes,
  orgMemberships,
  users,
} from "@/lib/db/schema";
import { jobStatusLabel } from "@/lib/jobs/status-display";
import {
  invoiceStatusLabel,
  quoteStatusLabel,
} from "@/lib/commercial/status-display";
import { getSessionStaffTags, requireSession } from "@/lib/org/context";

export type SearchResultGroup = {
  label: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    href: string;
  }[];
};

const LIMIT = 6;

function normalizeQuery(raw: string): string {
  return raw.trim().slice(0, 80);
}

export async function globalSearch(
  orgId: string,
  rawQuery: string
): Promise<SearchResultGroup[]> {
  const session = await requireSession();
  if (session.user.orgId !== orgId) throw new Error("Forbidden");
  if (!db) return [];

  const q = normalizeQuery(rawQuery);
  if (q.length < 2) return [];

  const pattern = `%${q}%`;
  const isManager = canManageJobs(session.user);
  const canCommercial = canManageCommercial(session.user);
  const isStaff = canViewMyJobs(session.user);
  const tags = await getSessionStaffTags(session);
  const canFleet = canViewFleet(session.user);

  const groups: SearchResultGroup[] = [];

  if (isManager) {
    const jobRows = await withOrgQuery<
      { id: string; name: string; status: string; clientName: string | null }[]
    >(orgId, (database) =>
      database
        .select({
          id: jobs.id,
          name: jobs.name,
          status: jobs.status,
          clientName: clientCompanies.name,
        })
        .from(jobs)
        .leftJoin(clientCompanies, eq(jobs.clientCompanyId, clientCompanies.id))
        .where(
          and(eq(jobs.orgId, orgId), ilike(jobs.name, pattern))
        )
        .orderBy(desc(jobs.updatedAt))
        .limit(LIMIT)
    );
    if (jobRows.length) {
      groups.push({
        label: "Jobs",
        items: jobRows.map((r) => ({
          id: r.id,
          title: r.name,
          subtitle: `${r.clientName ?? "Client"} · ${jobStatusLabel(r.status)}`,
          href: `/dashboard/jobs/${r.id}`,
        })),
      });
    }

    const clients = await withOrgQuery<
      { id: string; name: string }[]
    >(orgId, (database) =>
      database
        .select({ id: clientCompanies.id, name: clientCompanies.name })
        .from(clientCompanies)
        .where(
          and(eq(clientCompanies.orgId, orgId), ilike(clientCompanies.name, pattern))
        )
        .orderBy(asc(clientCompanies.name))
        .limit(LIMIT)
    );
    if (clients.length) {
      groups.push({
        label: "Clients",
        items: clients.map((c) => ({
          id: c.id,
          title: c.name,
          subtitle: "Client company",
          href: `/dashboard/clients`,
        })),
      });
    }
  }

  if (canCommercial) {
    const quoteRows = await withOrgQuery<
      { id: string; quoteNumber: string; title: string; status: string }[]
    >(orgId, (database) =>
      database
        .select({
          id: quotes.id,
          quoteNumber: quotes.quoteNumber,
          title: quotes.title,
          status: quotes.status,
        })
        .from(quotes)
        .where(
          and(
            eq(quotes.orgId, orgId),
            or(
              ilike(quotes.quoteNumber, pattern),
              ilike(quotes.title, pattern)
            )
          )
        )
        .limit(LIMIT)
    );
    if (quoteRows.length) {
      groups.push({
        label: "Quotes",
        items: quoteRows.map((r) => ({
          id: r.id,
          title: r.quoteNumber,
          subtitle: `${r.title} · ${quoteStatusLabel(r.status)}`,
          href: `/dashboard/quotes/${r.id}`,
        })),
      });
    }

    const invoiceRows = await withOrgQuery<
      { id: string; invoiceNumber: string; status: string }[]
    >(orgId, (database) =>
      database
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.orgId, orgId),
            ilike(invoices.invoiceNumber, pattern)
          )
        )
        .limit(LIMIT)
    );
    if (invoiceRows.length) {
      groups.push({
        label: "Invoices",
        items: invoiceRows.map((r) => ({
          id: r.id,
          title: r.invoiceNumber,
          subtitle: invoiceStatusLabel(r.status),
          href: `/dashboard/invoices/${r.id}`,
        })),
      });
    }
  } else if (isStaff) {
    const assigned = await withOrgQuery<{ jobId: string }[]>(
      orgId,
      (database) =>
        database
          .select({ jobId: jobAssignments.jobId })
          .from(jobAssignments)
          .where(
            and(
              eq(jobAssignments.orgId, orgId),
              eq(jobAssignments.userId, session.user.id)
            )
          )
    );
    const jobIds = [...new Set(assigned.map((a) => a.jobId))];
    if (jobIds.length) {
      const jobRows = await withOrgQuery<
        { id: string; name: string; status: string }[]
      >(orgId, (database) =>
        database
          .select({
            id: jobs.id,
            name: jobs.name,
            status: jobs.status,
          })
          .from(jobs)
          .where(
            and(
              eq(jobs.orgId, orgId),
              inArray(jobs.id, jobIds),
              ilike(jobs.name, pattern)
            )
          )
          .limit(LIMIT)
      );
      if (jobRows.length) {
        groups.push({
          label: "My jobs",
          items: jobRows.map((r) => ({
            id: r.id,
            title: r.name,
            subtitle: jobStatusLabel(r.status),
            href: `/dashboard/my-jobs/${r.id}`,
          })),
        });
      }
    }
  }

  if (isManager || tags.includes("warehouse")) {
    const skus = await withOrgQuery<
      { id: string; sku: string; name: string }[]
    >(orgId, (database) =>
      database
        .select({
          id: inventoryItems.id,
          sku: inventoryItems.sku,
          name: inventoryItems.name,
        })
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.orgId, orgId),
            or(
              ilike(inventoryItems.sku, pattern),
              ilike(inventoryItems.name, pattern)
            )
          )
        )
        .limit(LIMIT)
    );
    if (skus.length) {
      groups.push({
        label: "Inventory",
        items: skus.map((r) => ({
          id: r.id,
          title: r.sku,
          subtitle: r.name,
          href: `/dashboard/inventory?tab=equipment`,
        })),
      });
    }
  }

  if (isManager) {
    const crew = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(orgMemberships)
      .innerJoin(users, eq(orgMemberships.userId, users.id))
      .where(
        and(
          eq(orgMemberships.orgId, orgId),
          eq(orgMemberships.isStaff, true),
          or(
            ilike(users.email, pattern),
            ilike(users.firstName, pattern),
            ilike(users.lastName, pattern)
          )
        )
      )
      .limit(LIMIT);

    if (crew.length) {
      groups.push({
        label: "Crew",
        items: crew.map((r) => {
          const name =
            [r.firstName, r.lastName].filter(Boolean).join(" ").trim() ||
            r.email;
          return {
            id: r.userId,
            title: name,
            subtitle: r.email,
            href: `/dashboard/team`,
          };
        }),
      });
    }
  }

  if (canFleet) {
    const vehicles = await withOrgQuery<
      { id: string; name: string; plate: string | null }[]
    >(orgId, (database) =>
      database
        .select({
          id: fleetVehicles.id,
          name: fleetVehicles.name,
          plate: fleetVehicles.plate,
        })
        .from(fleetVehicles)
        .where(
          and(
            eq(fleetVehicles.orgId, orgId),
            or(
              ilike(fleetVehicles.name, pattern),
              ilike(fleetVehicles.plate, pattern)
            )
          )
        )
        .limit(LIMIT)
    );
    if (vehicles.length) {
      groups.push({
        label: "Vehicles",
        items: vehicles.map((v) => ({
          id: v.id,
          title: v.name,
          subtitle: v.plate ?? "Vehicle",
          href: `/dashboard/inventory?tab=fleet`,
        })),
      });
    }
  }

  return groups;
}

export async function portalGlobalSearch(
  orgId: string,
  rawQuery: string
): Promise<SearchResultGroup[]> {
  const session = await requireSession();
  if (!session.user.isClient) throw new Error("Forbidden");
  if (session.user.orgId !== orgId) throw new Error("Forbidden");

  const q = normalizeQuery(rawQuery);
  if (q.length < 2) return [];

  const { getSessionClientCompany } = await import("@/lib/org/context");
  const company = await getSessionClientCompany(session);
  if (!company) return [];

  const pattern = `%${q}%`;
  const { clientOnlyActor } = await import("@/lib/db");

  const jobRows = await withOrgQuery<
    { id: string; name: string; status: string }[]
  >(
    orgId,
    (database) =>
      database
        .select({
          id: jobs.id,
          name: jobs.name,
          status: jobs.status,
        })
        .from(jobs)
        .where(
          and(
            eq(jobs.orgId, orgId),
            eq(jobs.clientCompanyId, company.id),
            ilike(jobs.name, pattern)
          )
        )
        .limit(LIMIT),
    clientOnlyActor(session.user, company.id)
  );

  if (!jobRows.length) return [];
  return [
    {
      label: "Your jobs",
      items: jobRows.map((r) => ({
        id: r.id,
        title: r.name,
        subtitle: jobStatusLabel(r.status),
        href: `/portal/jobs/${r.id}`,
      })),
    },
  ];
}
