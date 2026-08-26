import { NextResponse } from "next/server";
import { loginUser } from "@/services/login-user";
import {
  AUTH_TOKEN_COOKIE,
  IS_ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  getSecureCookieFlag,
} from "@/lib/session-config";
import { parseJsonBody } from "../_utils";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";

  if (!username) {
    return Response.json(
      { auth_token: "", error: "License Key is required." },
      { status: 400 },
    );
  }

  const result = await loginUser(username === username.trim() ? username : "");
  const missingRequiredFields =
    !result.error &&
    (result.user_id === undefined || result.is_admin === undefined);

  const status = result.error || missingRequiredFields ? 401 : 200;

  const responsePayload = missingRequiredFields
    ? {
        error: "Backend returned an invalid login payload.",
      }
    : result;

  const response = NextResponse.json(responsePayload, { status });
  const maxAgeSeconds = SESSION_MAX_AGE_SECONDS;
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  if (!result.error && !missingRequiredFields) {
    response.cookies.set(AUTH_TOKEN_COOKIE, result.auth_token || username, {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(request),
      maxAge: maxAgeSeconds,
      expires: expiresAt,
      path: "/",
    });
    response.cookies.set(IS_ADMIN_COOKIE, result.is_admin ? "true" : "false", {
      httpOnly: true,
      sameSite: "lax",
      secure: getSecureCookieFlag(request),
      maxAge: maxAgeSeconds,
      expires: expiresAt,
      path: "/",
    });
  }

  return response;
}
