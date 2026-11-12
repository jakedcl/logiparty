import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatPasswordResetUrl,
  isPasswordResetTokenActive,
  passwordResetExpiresAt,
  PASSWORD_RESET_TTL_MS,
} from "./password-reset-url";

describe("formatPasswordResetUrl", () => {
  it("builds production tenant URL", () => {
    assert.equal(
      formatPasswordResetUrl("abc123", "test", { dev: false }),
      "https://test.logiparty.com/reset-password/abc123"
    );
  });

  it("builds local tenant URL in development", () => {
    assert.equal(
      formatPasswordResetUrl("abc123", "test", { dev: true }),
      "http://test.localhost:3000/reset-password/abc123"
    );
  });
});

describe("passwordResetExpiresAt", () => {
  it("expires one hour after the given time", () => {
    const now = Date.UTC(2026, 10, 12, 12, 0, 0);
    const exp = passwordResetExpiresAt(now);
    assert.equal(exp.getTime() - now, PASSWORD_RESET_TTL_MS);
  });
});

describe("isPasswordResetTokenActive", () => {
  it("rejects used tokens", () => {
    assert.equal(
      isPasswordResetTokenActive({
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      }),
      false
    );
  });

  it("rejects expired tokens", () => {
    assert.equal(
      isPasswordResetTokenActive({
        expiresAt: new Date(Date.now() - 1),
        usedAt: null,
      }),
      false
    );
  });

  it("accepts fresh unused tokens", () => {
    assert.equal(
      isPasswordResetTokenActive({
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      }),
      true
    );
  });
});
