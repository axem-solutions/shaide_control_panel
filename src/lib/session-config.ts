export const SESSION_MAX_AGE_SECONDS = 60 * 10; // 10 minutes
export const SESSION_TOUCH_COOLDOWN_SECONDS = 60;
export const AUTH_TOKEN_COOKIE = "shaide_auth_token";
export const IS_ADMIN_COOKIE = "shaide_is_admin";
export const SESSION_TOUCH_AT_COOKIE = "shaide_session_touch_at";

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
