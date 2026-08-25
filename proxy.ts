import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "sunvolt_admin_session";

/**
 * Fast UX-level guard: bounce anonymous visitors away from /admin.
 * The real session-signature check happens in the admin layout and
 * in every admin server action (this proxy only checks cookie presence).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!request.cookies.get(SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
