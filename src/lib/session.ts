// The admin session token, shared by src/proxy.ts and src/lib/auth.ts so both sign
// and verify it the same way. No "server-only" import: the proxy loads this too.
// Web Crypto only, so it runs in any runtime the proxy is deployed to.
import { SignJWT, jwtVerify } from "jose";

const SECURE = process.env.NODE_ENV === "production";
// __Host- makes the browser refuse the cookie unless it's Secure, path=/ and has no
// Domain, so a sibling subdomain can't set or overwrite it. Needs HTTPS, so not in dev.
export const SESSION_COOKIE = SECURE ? "__Host-admin_session" : "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days, in seconds
export const SESSION_COOKIE_OPTIONS = { httpOnly: true, secure: SECURE, sameSite: "lax", path: "/", maxAge: SESSION_MAX_AGE } as const;

const ALG = "HS256";
const ISSUER = "site";
const AUDIENCE = "admin";

/**
 * Signing key: SESSION_SECRET mixed with ADMIN_PASSWORD, so changing the password
 * logs every existing session out. null when SESSION_SECRET is missing or short.
 */
async function sessionKey(env: Record<string, string | undefined> = process.env): Promise<Uint8Array | null> {
  const secret = env.SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  const material = new TextEncoder().encode(`${secret}\0${env.ADMIN_PASSWORD ?? ""}`);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", material));
}

export async function signSession(env?: Record<string, string | undefined>): Promise<string> {
  const key = await sessionKey(env);
  if (!key) throw new Error("SESSION_SECRET must be set (32+ chars).");
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: ALG })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key);
}

/** True only for an unexpired admin token signed with the current key. */
export async function verifySession(token: string | undefined, env?: Record<string, string | undefined>): Promise<boolean> {
  if (!token) return false;
  const key = await sessionKey(env);
  if (!key) return false;
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
      requiredClaims: ["iat", "exp"],
      maxTokenAge: SESSION_MAX_AGE,
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}
