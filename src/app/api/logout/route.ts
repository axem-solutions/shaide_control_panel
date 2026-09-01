import { NextResponse } from "next/server";
import { ALL_SESSION_COOKIES, getSecureCookieFlag } from "@/lib/session-config";

export async function POST(request: Request) {
  const response = NextResponse.json({ ok: true });

  for (const name of ALL_SESSION_COOKIES) {
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
