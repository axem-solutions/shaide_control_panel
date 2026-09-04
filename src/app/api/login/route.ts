import { NextResponse } from "next/server";
import { loginUser } from "@/services/login-user";
import {
  AUTH_TOKEN_COOKIE,
  ROLE_COOKIE,
  LICENSE_EXPIRY_COOKIE,
  SESSION_EXPIRES_AT_COOKIE,
  SESSION_EXPIRES_AT_HINT_COOKIE,
  SESSION_SIGNATURE_COOKIE,
  USERNAME_COOKIE,
  getSecureCookieFlag,
  getSessionCookieLifetime,
  resolveSessionExpiresAt,
} from "@/lib/session-config";
import { signSession } from "@/lib/session-signature";
import { parseJsonBody } from "../_utils";

export async function POST(request: Request) {
  const body = await parseJsonBody(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!username || !password) {
    return Response.json(
      { error: "Username and password are required." },
      { status: 400 },
    );
  }

  const result = await loginUser(username, password);

  if (result.error || !result.access_token) {
    return NextResponse.json(
      { error: result.error || "Backend returned an invalid login payload." },
      { status: 401 },
    );
  }

  const now = Date.now();
  // Session lifetime is owned by the server: the deadline is fixed here from
  // `token_expires_in` and is never extended by activity.
  const sessionExpiresAt = resolveSessionExpiresAt(result.token_expires_in, now);
  const lifetime = getSessionCookieLifetime(sessionExpiresAt, now);

  if (!lifetime) {
    return NextResponse.json(
      { error: "Backend issued an already-expired access token." },
      { status: 401 },
    );
  }

  const role = result.role ?? "user";
  const signature = await signSession({
    authToken: result.access_token,
    role,
    username,
    sessionExpiresAt,
  });

  if (!signature) {
    return NextResponse.json(
      { error: "Server is misconfigured. Contact your administrator." },
      { status: 500 },
    );
  }

  const response = NextResponse.json(result, { status: 200 });

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getSecureCookieFlag(request),
    maxAge: lifetime.maxAgeSeconds,
    expires: lifetime.expiresAt,
    path: "/",
  };

  response.cookies.set(AUTH_TOKEN_COOKIE, result.access_token, cookieOptions);
  response.cookies.set(ROLE_COOKIE, role, cookieOptions);
  // Identifies the signed-in user in the header and against `/v1/users` rows,
  // which no longer carry anything else the session can be matched on.
  response.cookies.set(USERNAME_COOKIE, username, cookieOptions);
  response.cookies.set(SESSION_EXPIRES_AT_COOKIE, String(sessionExpiresAt), cookieOptions);
  response.cookies.set(SESSION_SIGNATURE_COOKIE, signature, cookieOptions);
  // Display-only; see the note on SESSION_EXPIRES_AT_HINT_COOKIE.
  response.cookies.set(SESSION_EXPIRES_AT_HINT_COOKIE, String(sessionExpiresAt), {
    ...cookieOptions,
    httpOnly: false,
  });

  if (result.account_expires_at) {
    response.cookies.set(LICENSE_EXPIRY_COOKIE, result.account_expires_at, cookieOptions);
  } else {
    // Accounts without an expiry (admins) must not inherit a stale value.
    response.cookies.set(LICENSE_EXPIRY_COOKIE, "", {
      ...cookieOptions,
      maxAge: 0,
      expires: undefined,
    });
  }

  return response;
}
