import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it } from "node:test";
import { ModuleKind, transpileModule } from "typescript";
import { drizzle } from "drizzle-orm/pg-proxy";
import * as permissions from "../auth/permissions";
import * as schema from "../db/schema";
import * as money from "../commercial/money";

const orgA = "00000000-0000-4000-8000-000000000001";
const orgB = "00000000-0000-4000-8000-000000000002";
const membershipId = "00000000-0000-4000-8000-000000000003";
const queryReached = new Error("Authorized request reached the database");
const nativeRequire = createRequire(import.meta.url);

type Actor = permissions.SessionMembership & { orgId: string; id: string };
type Action = (...args: unknown[]) => Promise<unknown>;

function actor(role: "admin" | "manager" | "staff" | "client"): Actor {
  return {
    id: "test-user",
    orgId: orgA,
    isOrgAdmin: role === "admin",
    isManager: role === "manager",
    isStaff: role === "staff",
    isClient: role === "client",
  };
}

/** Execute the real action bodies with isolated auth/DB boundaries, without
 * booting Next or connecting to a database. Transpilation keeps this compatible
 * with the project's Node 20 baseline (no experimental module-mocking APIs).
 */
function loadActions(
  file: string,
  user: Actor | null,
  database: unknown = new Proxy({}, { get() { throw queryReached; } }),
  tags: string[] = []
): Record<string, Action> {
  const filename = path.join(process.cwd(), "lib/actions", `${file}.ts`);
  const { outputText } = transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS },
    fileName: filename,
  });
  const dependencies: Record<string, unknown> = {
    "@/lib/auth/permissions": permissions,
    "@/lib/db/schema": schema,
    "@/lib/commercial/money": money,
    "@/lib/org/context": {
      requireSession: async () => {
        if (!user) throw new Error("Unauthorized");
        return { user };
      },
      getSessionStaffTags: async () => tags,
      getSessionClientCompany: async () => { throw queryReached; },
    },
    "@/lib/db": {
      db: database,
      withOrgQuery: async () => { throw queryReached; },
      withOrgQueries: async () => { throw queryReached; },
    },
    "next/cache": { revalidatePath: () => undefined },
    "next/navigation": { redirect: () => { throw new Error("Redirect"); } },
  };
  const loaded = { exports: {} as Record<string, Action> };
  const requireDependency = (name: string) => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    // Unrelated side effects (mail/storage/etc.) are unavailable in this suite.
    if (name.startsWith("@/")) return {};
    return nativeRequire(name);
  };
  new Function("require", "module", "exports", outputText)(
    requireDependency, loaded, loaded.exports
  );
  return loaded.exports;
}

const form = new FormData();
form.set("description", "Transport");
form.set("quantity", "1");
form.set("unitPrice", "10");
form.set("amount", "10");
form.set("title", "Event job");

const boundaries: {
  file: string;
  name: string;
  rest?: unknown[];
  client?: boolean;
  clientAllowed?: boolean;
}[] = [
  { file: "team", name: "listTeamMembers" },
  { file: "clients", name: "listClientCompaniesWithContacts" },
  { file: "inventory", name: "listOrgInventoryItems" },
  { file: "jobs", name: "listJobLeadCandidates" },
  { file: "job-crew", name: "listCrewCandidates" },
  { file: "job-inventory", name: "listAssignableClientInventory", rest: ["company"] },
  { file: "job-inventory", name: "listAssignableOrgInventory" },
  { file: "job-fleet", name: "listAssignableFleetVehicles", rest: ["job"] },
  { file: "quotes", name: "deleteQuoteLine", rest: ["quote", "line"] },
  { file: "quotes", name: "updateQuoteMeta", rest: ["quote", form] },
  { file: "invoices", name: "addInvoiceLine", rest: ["invoice", form] },
  { file: "invoices", name: "sendInvoice", rest: ["invoice"] },
  { file: "invoices", name: "getInvoiceDetail", rest: ["invoice"] },
  { file: "invoices", name: "recordManualPayment", rest: ["invoice", form] },
  { file: "invoices", name: "getInvoicePdfUrl", rest: ["invoice"], clientAllowed: true },
  { file: "invoices", name: "listPortalInvoices", client: true },
];

describe("server action tenant boundaries", () => {
  for (const boundary of boundaries) {
    const { file, name, rest = [], client = false, clientAllowed = false } = boundary;
    it(`${name} rejects anonymous requests before querying`, async () => {
      const actions = loadActions(file, null);
      await assert.rejects(actions[name](orgA, ...rest), /Unauthorized/);
    });

    it(`${name} rejects another tenant before querying`, async () => {
      const roles = client ? ["client"] as const
        : clientAllowed ? ["admin", "manager", "client"] as const
        : ["admin", "manager"] as const;
      for (const role of roles) {
        const actions = loadActions(file, actor(role));
        await assert.rejects(actions[name](orgB, ...rest), /Forbidden/);
      }
    });

    it(`${name} rejects roles without access`, async () => {
      const roles = client ? ["staff", "manager"] as const
        : clientAllowed ? ["staff"] as const
        : ["staff", "client"] as const;
      for (const role of roles) {
        const actions = loadActions(file, actor(role));
        await assert.rejects(actions[name](orgA, ...rest), /Forbidden/);
      }
    });

    it(`${name} allows the expected same-tenant role to reach data access`, async () => {
      const actions = loadActions(file, actor(client ? "client" : "manager"));
      await assert.rejects(actions[name](orgA, ...rest), (error) => error === queryReached);
    });
  }

  it("warehouse staff can still read their own equipment catalog", async () => {
    const actions = loadActions("inventory", actor("staff"), undefined, ["warehouse"]);
    await assert.rejects(actions.listOrgInventoryItems(orgA), (error) => error === queryReached);
    await assert.rejects(actions.listOrgInventoryItems(orgB), /Forbidden/);
  });
});

describe("team data and capability tags", () => {
  it("never selects password hashes and scopes tag reads to the organization", async () => {
    const queries: { sql: string; params: unknown[] }[] = [];
    const database = drizzle(async (sql, params) => {
      queries.push({ sql, params });
      return { rows: [] };
    });
    const actions = loadActions("team", actor("manager"), database);
    assert.deepEqual(await actions.listTeamMembers(orgA), []);
    assert.equal(queries.length, 2);
    assert.doesNotMatch(queries[0].sql, /password_hash/);
    assert.match(queries[0].sql, /"users"\."email"/);
    for (const query of queries) {
      assert.match(query.sql, /where "org_memberships"\."org_id" =/);
      assert.deepEqual(query.params, [orgA]);
    }
  });

  it("rejects a foreign or missing membership without changing tags", async () => {
    const queries: { sql: string; params: unknown[] }[] = [];
    const database = drizzle(async (sql, params) => {
      queries.push({ sql, params });
      return { rows: [] };
    });
    const actions = loadActions("team", actor("manager"), database);
    const input = new FormData();
    input.set("membershipId", membershipId);
    input.set("tag-warehouse", "on");
    await assert.rejects(actions.updateStaffTags(input), /Forbidden/);
    assert.equal(queries.length, 1);
    assert.match(queries[0].sql, /^select /);
    assert.match(queries[0].sql, /"org_memberships"\."org_id" =/);
    assert.ok(queries[0].params.includes(orgA));
    assert.ok(queries[0].params.includes(membershipId));
  });

  it("rejects anonymous and non-manager capability changes", async () => {
    const input = new FormData();
    input.set("membershipId", membershipId);
    await assert.rejects(loadActions("team", null).updateStaffTags(input), /Unauthorized/);
    for (const role of ["staff", "client"] as const) {
      await assert.rejects(loadActions("team", actor(role)).updateStaffTags(input), /Forbidden/);
    }
  });

  it("replaces an owned membership's tags in one batch and can clear them", async () => {
    const queries: string[] = [];
    const batches: { sql: string; params: unknown[] }[][] = [];
    const database = Object.assign(drizzle(async (sql) => {
      queries.push(sql);
      return { rows: sql.startsWith("select ") ? [[membershipId]] : [] };
    }), {
      batch: async (statements: { toSQL(): { sql: string; params: unknown[] } }[]) => {
        batches.push(statements.map((statement) => statement.toSQL()));
        return [];
      },
    });
    const actions = loadActions("team", actor("manager"), database);
    const input = new FormData();
    input.set("membershipId", membershipId);
    input.set("tag-warehouse", "on");
    input.set("tag-driver", "on");
    input.set("tag-unknown", "on");
    await actions.updateStaffTags(input);
    assert.equal(queries.length, 1, "Only the ownership check runs outside the batch");
    assert.equal(batches.length, 1);
    assert.equal(batches[0].length, 2);
    assert.match(batches[0][0].sql, /^delete from "staff_capability_tags"/);
    assert.deepEqual(batches[0][0].params, [membershipId]);
    assert.match(batches[0][1].sql, /^insert into "staff_capability_tags"/);
    assert.deepEqual(batches[0][1].params, [membershipId, "driver", membershipId, "warehouse"]);

    input.delete("tag-warehouse");
    input.delete("tag-driver");
    await actions.updateStaffTags(input);
    assert.equal(batches.length, 1, "Clearing tags needs no insert");
    assert.equal(queries.length, 3);
    assert.match(queries[2], /^delete from "staff_capability_tags"/);
  });
});
