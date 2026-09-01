export const AUTH_TOKEN_COOKIE = "shaide_auth_token";
export const ROLE_COOKIE = "shaide_role";
export const USERNAME_COOKIE = "shaide_username";
export const LICENSE_EXPIRY_COOKIE = "shaide_license_expiry";
export const SESSION_EXPIRES_AT_COOKIE = "shaide_session_expires_at";
/**
 * Client-readable copy of the deadline, used only to schedule the "your session
 * ended" redirect in the browser. It is deliberately NOT the cookie the server
 * trusts: `SESSION_EXPIRES_AT_COOKIE` is `httpOnly` and is the one enforced in
 * `middleware.ts` and `requireAuthSession`, so editing this hint can only make a
 * browser redirect itself sooner or later — it cannot extend a session.
 */
export const SESSION_EXPIRES_AT_HINT_COOKIE = "shaide_session_expires_at_hint";
/**
 * HMAC over the session tuple, proving the other cookies were issued by this
 * server rather than typed into devtools.
 */
export const SESSION_SIGNATURE_COOKIE = "shaide_session_sig";

/**
 * `POST /v1/login` returns `role`, currently "admin" or "user". Anything
 * unrecognised is treated as a plain user so a new backend role can never
 * accidentally grant admin rights.
 */
export type UserRole = "admin" | "user";

export function parseRole(value: string | null | undefined): UserRole {
  return value === "admin" ? "admin" : "user";
}

export function isAdminRole(value: string | null | undefined): boolean {
  return parseRole(value) === "admin";
}

export const ALL_SESSION_COOKIES = [
  AUTH_TOKEN_COOKIE,
  ROLE_COOKIE,
  USERNAME_COOKIE,
  LICENSE_EXPIRY_COOKIE,
  SESSION_EXPIRES_AT_COOKIE,
  SESSION_EXPIRES_AT_HINT_COOKIE,
  SESSION_SIGNATURE_COOKIE,
] as const;

/**
 * Fallback session length used when `POST /v1/login` omits `token_expires_in` or
 * returns something unusable. Deliberately short: a malformed payload should
 * shorten a session, never extend one.
 */
export const FALLBACK_TOKEN_LIFETIME_SECONDS = 60 * 10;

/**
 * Upper bound on `token_expires_in`. The OpenAPI example is `Number.MAX_SAFE_INTEGER`,
 * which would overflow `Date` and produce an invalid cookie expiry, so any
 * absurd lifetime is clamped to a year.
 */
export const MAX_TOKEN_LIFETIME_SECONDS = 60 * 60 * 24 * 365;

/**
 * Turns the backend's `token_expires_in` (seconds) into an absolute deadline. Session
 * lifetime is owned entirely by the server now: the deadline is fixed at login
 * and is never extended by activity.
 */
export function resolveSessionExpiresAt(
  expiresInSeconds: number | undefined,
  now = Date.now(),
): number {
  const lifetimeSeconds =
    typeof expiresInSeconds === "number" &&
    Number.isFinite(expiresInSeconds) &&
    expiresInSeconds > 0
      ? expiresInSeconds
      : FALLBACK_TOKEN_LIFETIME_SECONDS;

  return now + Math.min(lifetimeSeconds, MAX_TOKEN_LIFETIME_SECONDS) * 1000;
}

/** Parses the deadline cookie; returns `null` when absent or corrupt. */
export function parseSessionExpiresAt(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const expiresAt = Number(value);
  return Number.isFinite(expiresAt) ? expiresAt : null;
}

/** True once the session deadline has passed, or when it is missing/corrupt. */
export function isSessionExpired(sessionExpiresAt: number | null, now = Date.now()) {
  return sessionExpiresAt === null || sessionExpiresAt <= now;
}

/**
 * Cookie lifetime for the session: exactly the remaining token lifetime, so
 * every session cookie dies with the access token. Returns `null` once the
 * deadline has passed.
 */
export function getSessionCookieLifetime(
  sessionExpiresAt: number | null,
  now = Date.now(),
): { maxAgeSeconds: number; expiresAt: Date } | null {
  if (sessionExpiresAt === null || isSessionExpired(sessionExpiresAt, now)) {
    return null;
  }

  const maxAgeSeconds = Math.floor((sessionExpiresAt - now) / 1000);
  if (maxAgeSeconds <= 0) {
    return null;
  }

  return { maxAgeSeconds, expiresAt: new Date(sessionExpiresAt) };
}

/**
 * Resolves the effective scheme of the incoming request, trusting
 * `X-Forwarded-Proto` when a proxy sets it (e.g. a TLS-terminating ingress) and
 * otherwise mirroring the scheme the request actually arrived on.
 */
export function getRequestProtocol(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return (
    forwardedProto?.split(",")[0]?.trim() ||
    new URL(request.url).protocol.replace(":", "")
  );
}

/**
 * Auth/session cookies are only marked `Secure` on HTTPS requests. Browsers
 * refuse to send `Secure` cookies over plain HTTP, so deriving the flag from
 * the actual request scheme keeps the session working on HTTP-only on-prem
 * deployments while still securing cookies behind TLS.
 */
export function getSecureCookieFlag(request: Request): boolean {
  return getRequestProtocol(request) === "https";
}
