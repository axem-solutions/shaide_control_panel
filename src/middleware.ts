import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  IS_ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getSecureCookieFlag,
} from "@/lib/session-config";

const MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS;
const PUBLIC_PATHS = new Set(["/"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const isAdmin = request.cookies.get(IS_ADMIN_COOKIE)?.value;

  if (!authToken || !isAdmin) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/";
    loginUrl.searchParams.set("reason", "expired");
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  response.cookies.set(AUTH_TOKEN_COOKIE, authToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(request),
    maxAge: MAX_AGE_SECONDS,
    expires: expiresAt,
    path: "/",
  });

  response.cookies.set(IS_ADMIN_COOKIE, isAdmin, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(request),
    maxAge: MAX_AGE_SECONDS,
    expires: expiresAt,
    path: "/",
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|grafana|_next/static|_next/image|favicon.ico).*)"],
};
