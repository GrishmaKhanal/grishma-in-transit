// Remote Postgres connections verify the server's certificate unless the URL says
// otherwise. node-postgres already treats prefer/require/verify-ca as verify-full
// (and logs a deprecation warning for them), so this spells out what happens anyway
// and covers URLs with no sslmode at all. Local hosts and an explicit
// sslmode=disable or no-verify are left alone.
const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const UPGRADE = new Set([undefined, "prefer", "require", "verify-ca"]);

export function withVerifiedSsl(url: string): string {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (!u.hostname || LOCAL.has(u.hostname)) return url;
  const mode = u.searchParams.get("sslmode") ?? undefined;
  if (!UPGRADE.has(mode)) return url;
  u.searchParams.set("sslmode", "verify-full");
  return u.toString();
}
