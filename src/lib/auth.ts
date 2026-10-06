import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_COOKIE_OPTIONS, signSession, verifySession } from "./session";

export { checkCredentials } from "./credentials";

export async function createSession() {
  const token = await signSession();
  (await cookies()).set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function destroySession() {
  (await cookies()).delete({ name: SESSION_COOKIE, path: "/", secure: SESSION_COOKIE_OPTIONS.secure });
}

export async function isAdmin(): Promise<boolean> {
  return verifySession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every admin Server Action / page. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
}
