import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  IS_ADMIN_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  SESSION_TOUCH_AT_COOKIE,
  SESSION_TOUCH_COOLDOWN_SECONDS,
  getSecureCookieFlag,
} from "@/lib/session-config";
import { verifySession } from "@/services/verify-session";
import { getCollections } from "@/services/fetch-collections";

export async function getAuthTokenFromCookies() {
  return (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
}

type AuthSession = {
  ok: true;
  authToken: string;
  isAdmin: string;
};

type MissingSession = {
  ok: false;
  response: NextResponse;
};

type RequireAuthSessionResult = AuthSession | MissingSession;

export async function requireAuthSession(): Promise<RequireAuthSessionResult> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const isAdmin = cookieStore.get(IS_ADMIN_COOKIE)?.value;

  if (!authToken || !isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Missing auth token." }, { status: 401 }),
    };
  }

  return {
    ok: true,
    authToken,
    isAdmin,
  };
}

export async function requireAuthToken() {
  const session = await requireAuthSession();
  if (!session.ok) {
    return session;
  }

  return {
    ok: true as const,
    authToken: session.authToken,
    isAdmin: session.isAdmin,
  };
}

/**
 * Like `requireAuthToken`, but re-verifies admin status against the backend
 * instead of trusting the client-supplied `shaide_is_admin` cookie, which is
 * unsigned and can be set to any value by the caller.
 */
export async function requireAdminToken() {
  const session = await requireAuthToken();
  if (!session.ok) {
    return session;
  }

  const verified = await verifySession(session.authToken);
  if (!verified?.is_admin) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    authToken: session.authToken,
    isAdmin: "true",
  };
}

/**
 * Authorizes a request against a specific organization/collection: admins are
 * always allowed, everyone else must be a member of that organization (proven
 * by it appearing in their own token-scoped collection list) and the
 * collection must have `can_users_upload` enabled.
 */
export async function requireOrganizationAccess(authToken: string, organizationId: number) {
  const verified = await verifySession(authToken);
  if (verified?.is_admin) {
    return { ok: true as const };
  }

  const collectionsResult = await getCollections(authToken);
  if (collectionsResult.error) {
    return {
      ok: false as const,
      response: jsonError(collectionsResult.error, 502),
    };
  }

  const collection = collectionsResult.collections.find(
    (candidate) => candidate.id === organizationId,
  );

  if (!collection || !collection.can_users_upload) {
    return {
      ok: false as const,
      response: jsonError("Forbidden", 403),
    };
  }

  return { ok: true as const };
}

export function refreshSessionCookies(
  response: NextResponse,
  session: AuthSession,
  request: Request,
) {
  const now = Date.now();
  const expiresAt = new Date(now + SESSION_MAX_AGE_SECONDS * 1000);

  response.cookies.set(AUTH_TOKEN_COOKIE, session.authToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
    path: "/",
  });

  response.cookies.set(IS_ADMIN_COOKIE, session.isAdmin, {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
    path: "/",
  });

  response.cookies.set(SESSION_TOUCH_AT_COOKIE, String(now), {
    httpOnly: true,
    sameSite: "lax",
    secure: getSecureCookieFlag(request),
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
    path: "/",
  });

  return response;
}

export async function shouldRefreshSessionFromTouch() {
  const rawLastTouchAt = (await cookies()).get(SESSION_TOUCH_AT_COOKIE)?.value;
  const lastTouchAt = Number(rawLastTouchAt);

  if (!Number.isFinite(lastTouchAt)) {
    return true;
  }

  return Date.now() - lastTouchAt >= SESSION_TOUCH_COOLDOWN_SECONDS * 1000;
}

export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
