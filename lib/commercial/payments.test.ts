import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkPayment } from "./payments";

const base = { status: "sent" as const, totalCents: 100000, amountPaidCents: 0 };

describe("checkPayment", () => {
  it("a partial payment leaves the invoice partially paid", () => {
    const r = checkPayment({ ...base, amountCents: 25000 });
    assert.deepEqual(r, { ok: true, newPaidCents: 25000, newStatus: "partially_paid" });
  });

  it("paying the exact balance marks it paid", () => {
    const r = checkPayment({ ...base, amountCents: 100000 });
    assert.deepEqual(r, { ok: true, newPaidCents: 100000, newStatus: "paid" });
  });

  it("finishing a partially paid invoice marks it paid", () => {
    const r = checkPayment({
      status: "partially_paid",
      totalCents: 100000,
      amountPaidCents: 60000,
      amountCents: 40000,
    });
    assert.deepEqual(r, { ok: true, newPaidCents: 100000, newStatus: "paid" });
  });

  it("allows paying an overdue invoice", () => {
    assert.equal(checkPayment({ ...base, status: "overdue", amountCents: 1 }).ok, true);
  });

  it("rejects zero, negative and fractional amounts", () => {
    for (const amountCents of [0, -500, 10.5, Number.NaN]) {
      const r = checkPayment({ ...base, amountCents });
      assert.equal(r.ok, false, String(amountCents));
    }
  });

  it("rejects payments on draft, void and already paid invoices", () => {
    for (const status of ["draft", "void", "paid"] as const) {
      const r = checkPayment({ ...base, status, amountCents: 100 });
      assert.equal(r.ok, false, status);
    }
  });

  it("rejects overpayment", () => {
    const r = checkPayment({ ...base, amountCents: 100001 });
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.error, /exceeds the balance due/);
  });
});
