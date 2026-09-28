import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_INTERNAL, ADMIN_PUBLIC } from "@/lib/admin-path";

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

const under = (path: string, base: string) => path === base || path.startsWith(`${base}/`);

// Render the site's normal 404 so the internal path looks like any unknown URL.
const notFound = (req: NextRequest) => NextResponse.rewrite(new URL("/__not-found", req.url));

export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (ADMIN_PUBLIC && under(pathname, ADMIN_PUBLIC)) {
    // The admin root renders the login form; everything below it needs a session.
    if (pathname !== ADMIN_PUBLIC && !(await authed(req))) {
      return NextResponse.redirect(new URL(ADMIN_PUBLIC, req.url));
    }
    const target = new URL(ADMIN_INTERNAL + pathname.slice(ADMIN_PUBLIC.length) + search, req.url);
    const res = NextResponse.rewrite(target);
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (under(pathname, ADMIN_INTERNAL)) return notFound(req);

  return NextResponse.next();
}

// Matchers must be static, so the proxy sees every page request (ADMIN_PATH is
// only known at runtime). Static assets are skipped; the check above is cheap.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|assets/).*)"],
};
