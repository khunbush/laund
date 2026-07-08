import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const authenticated = await verifyToken(token);

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // api/backup and api/machine-import are excluded: they are called by
  // Vercel Cron / your export agents and carry their own bearer-token auth
  // instead of the passcode cookie.
  matcher: [
    "/((?!_next/static|_next/image|manifest.json|sw.js|icons|splash|favicon.ico|icon.png|apple-icon.png|api/backup|api/machine-import).*)",
  ],
};
