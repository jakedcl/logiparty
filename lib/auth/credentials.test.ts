import assert from "node:assert/strict";
import { describe, it } from "node:test";
import bcrypt from "bcryptjs";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./credentials";

describe("verifyPassword", () => {
  it("accepts the right password and rejects a wrong one", async () => {
    const hash = await bcrypt.hash("correct horse", 4);
    assert.equal(await verifyPassword(hash, "correct horse"), true);
    assert.equal(await verifyPassword(hash, "wrong"), false);
  });

  it("still runs a comparison when the account has no hash", async () => {
    const calls: string[] = [];
    const ok = await verifyPassword(null, "anything", async (_pw, hash) => {
      calls.push(hash);
      return true; // even a "match" against the dummy must not authenticate
    });
    assert.equal(ok, false);
    assert.deepEqual(calls, [DUMMY_PASSWORD_HASH]);
  });

  it("uses the stored hash when there is one", async () => {
    const calls: string[] = [];
    await verifyPassword("stored-hash", "pw", async (_pw, hash) => {
      calls.push(hash);
      return false;
    });
    assert.deepEqual(calls, ["stored-hash"]);
  });

  it("dummy hash is a valid bcrypt hash and never matches normal input", async () => {
    assert.match(DUMMY_PASSWORD_HASH, /^\$2[aby]\$10\$/);
    assert.equal(await bcrypt.compare("password123", DUMMY_PASSWORD_HASH), false);
  });
});
