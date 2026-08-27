import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  IS_ADMIN_COOKIE,
  SESSION_TOUCH_AT_COOKIE,
  getSecureCookieFlag,
} from "@/lib/session-config";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });

  for (const name of [AUTH_TOKEN_COOKIE, IS_ADMIN_COOKIE, SESSION_TOUCH_AT_COOKIE]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(request),
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}
