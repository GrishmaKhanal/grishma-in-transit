import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN = "/makemeaadmin";

async function authed(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  const s = process.env.SESSION_SECRET;
  if (!token || !s) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(s));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // The admin root renders the login form; everything below it needs a session.
  if (pathname !== ADMIN && !(await authed(req))) {
    return NextResponse.redirect(new URL(ADMIN, req.url));
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/makemeaadmin", "/makemeaadmin/:path*"] };
