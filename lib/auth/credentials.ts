import bcrypt from "bcryptjs";

/**
 * Hash of a random throwaway string (cost 10, same as real password hashes).
 * Compared against when an account does not exist so that "unknown account"
 * and "wrong password" both pay for one bcrypt comparison and cannot be told
 * apart by response time.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$10$Zcb2IqflLDcckSQy1.cIluLzkVt.1XgUDp0Lr2EUXyZmAd3PBA5T2";

type Compare = (password: string, hash: string) => Promise<boolean>;

/**
 * Always performs exactly one bcrypt comparison. Returns false when there is
 * no stored hash, without short-circuiting before the comparison.
 */
export async function verifyPassword(
  storedHash: string | null | undefined,
  password: string,
  compare: Compare = bcrypt.compare
): Promise<boolean> {
  const matches = await compare(password, storedHash || DUMMY_PASSWORD_HASH);
  return Boolean(storedHash) && matches;
}
