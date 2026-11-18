import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  describeConflicts,
  findInventoryConflicts,
  isLockingStatus,
  startsHoldingLocks,
  type DemandLine,
} from "./activation";

const m = (entries: [string, number][]) => new Map(entries);

describe("startsHoldingLocks", () => {
  it("is true when a non-locking job becomes upcoming or ready", () => {
    assert.equal(startsHoldingLocks("draft", "upcoming"), true);
    assert.equal(startsHoldingLocks("draft", "ready"), true);
    assert.equal(startsHoldingLocks("denied", "upcoming"), true);
    assert.equal(startsHoldingLocks("completed", "upcoming"), true);
  });

  it("is false when it already holds locks or will not", () => {
    assert.equal(startsHoldingLocks("upcoming", "ready"), false);
    assert.equal(startsHoldingLocks("ready", "upcoming"), false);
    assert.equal(startsHoldingLocks("draft", "draft"), false);
    assert.equal(startsHoldingLocks("upcoming", "completed"), false);
  });

  it("matches the lock model statuses", () => {
    assert.equal(isLockingStatus("upcoming"), true);
    assert.equal(isLockingStatus("ready"), true);
    assert.equal(isLockingStatus("draft"), false);
  });
});

describe("findInventoryConflicts", () => {
  const line = (itemId: string, quantity: number): DemandLine => ({
    itemType: "client",
    itemId,
    quantity,
  });

  it("returns nothing when demand fits", () => {
    const out = findInventoryConflicts({
      lines: [line("a", 4)],
      totals: m([["client:a", 10]]),
      lockedElsewhere: m([["client:a", 6]]),
    });
    assert.deepEqual(out, []);
  });

  it("flags demand over what other jobs leave free (the double-booking case)", () => {
    const out = findInventoryConflicts({
      lines: [line("a", 10)],
      totals: m([["client:a", 10]]),
      lockedElsewhere: m([["client:a", 10]]),
    });
    assert.equal(out.length, 1);
    assert.deepEqual(
      { needed: out[0].needed, available: out[0].available },
      { needed: 10, available: 0 }
    );
  });

  it("sums several lines for the same item before comparing", () => {
    const out = findInventoryConflicts({
      lines: [line("a", 6), line("a", 6)],
      totals: m([["client:a", 10]]),
      lockedElsewhere: m([]),
    });
    assert.equal(out.length, 1);
    assert.equal(out[0].needed, 12);
  });

  it("keeps client and org items with the same id separate", () => {
    const out = findInventoryConflicts({
      lines: [
        { itemType: "client", itemId: "x", quantity: 5 },
        { itemType: "org", itemId: "x", quantity: 5 },
      ],
      totals: m([
        ["client:x", 5],
        ["org:x", 5],
      ]),
      lockedElsewhere: m([]),
    });
    assert.deepEqual(out, []);
  });

  it("treats a missing catalog row as zero available", () => {
    const out = findInventoryConflicts({
      lines: [line("gone", 1)],
      totals: m([]),
      lockedElsewhere: m([]),
    });
    assert.equal(out.length, 1);
  });
});

describe("describeConflicts", () => {
  it("names inventory and vehicle problems", () => {
    const text = describeConflicts(
      [
        {
          itemType: "client",
          itemId: "a",
          needed: 8,
          total: 10,
          lockedElsewhere: 5,
          available: 5,
        },
      ],
      ["van-1"]
    );
    assert.match(text, /8 needed but only 5 available/);
    assert.match(text, /vehicle van-1 is locked/);
  });
});
