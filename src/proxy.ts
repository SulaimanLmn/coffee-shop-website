import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic redirects only (cookie presence). Real authorisation is enforced
// in pages and server actions via requireUser() / requireAdmin().
const SESSION_COOKIE = "bh_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (hasSession) return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const url = new URL("/login", request.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/orders/:path*", "/profile/:path*", "/payment/:path*"],
};
