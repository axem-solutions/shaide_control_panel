import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  SESSION_EXPIRES_AT_COOKIE,
  isSessionExpired,
  parseSessionExpiresAt,
} from "@/lib/session-config";

const PUBLIC_PATHS = new Set(["/"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const sessionExpiresAt = parseSessionExpiresAt(
    request.cookies.get(SESSION_EXPIRES_AT_COOKIE)?.value,
  );

  // The session lasts exactly as long as the access token
  if (!authToken || isSessionExpired(sessionExpiresAt)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("reason", "expired");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: ["/((?!api|grafana|_next/static|_next/image|favicon.ico).*)"],
};
