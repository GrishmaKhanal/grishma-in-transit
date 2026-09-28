import { createHash, timingSafeEqual } from "node:crypto";

// Hash first so both sides are the same length; timingSafeEqual then compares
// in constant time without leaking the expected length.
const digest = (s: string) => createHash("sha256").update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/**
 * True only when both ADMIN_USERNAME and ADMIN_PASSWORD are configured and match.
 * Both comparisons always run, so timing doesn't reveal which field was wrong.
 */
export function checkCredentials(
  username: string,
  password: string,
  env: Record<string, string | undefined> = process.env,
): boolean {
  const u = env.ADMIN_USERNAME?.trim();
  const p = env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  const userOk = same(username.trim().toLowerCase(), u.toLowerCase());
  const passOk = same(password, p);
  return userOk && passOk;
}
