import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import {
  AUTH_TOKEN_COOKIE,
  ROLE_COOKIE,
  SESSION_EXPIRES_AT_COOKIE,
  SESSION_SIGNATURE_COOKIE,
  USERNAME_COOKIE,
  type UserRole,
  isSessionExpired,
  parseRole,
  parseSessionExpiresAt,
} from "@/lib/session-config";

/**
 * Session cookies are `httpOnly`, which stops a script from reading them but
 * not the person holding the browser: without a signature, any user can edit
 * `shaide_role` to "admin" in devtools and the Control Panel would believe them.
 *
 * So at login the whole session tuple is signed with HMAC-SHA256 and the result
 * is stored in `shaide_session_sig`. Two properties matter:
 *
 *   - The access token is part of the signed payload, so a signature only
 *     verifies in a browser that already holds that exact token. Copying an
 *     admin's role + signature cookies into another browser fails.
 *   - The role is *inside* the payload rather than checked beside it, so
 *     tampering doesn't silently demote the user — it invalidates the session
 *     and sends them back to the login page.
 *
 * This does not address revocation: a role withdrawn mid-session is not noticed
 * until the token expires. Only re-verification against the backend fixes that.
 */

const MINIMUM_SECRET_LENGTH = 32;
/** ASCII unit separator: cannot occur in a role, username, timestamp or token. */
const FIELD_SEPARATOR = "\u001f";
const encoder = new TextEncoder();

export type TrustedSession = {
  authToken: string;
  role: UserRole;
  username: string;
  sessionExpiresAt: number;
};

function getSecret(): string | null {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < MINIMUM_SECRET_LENGTH) {
    console.error(
      `[session] SESSION_SECRET is missing or shorter than ${MINIMUM_SECRET_LENGTH} characters. ` +
        "No session can be signed or trusted. Generate one with: openssl rand -base64 48",
    );
    return null;
  }

  return secret;
}

async function importKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/**
 * Binds a signature to one specific session: the claim, who it belongs to, the
 * window it is valid for, and the token it was issued against. The unit
 * separator is a byte that cannot appear in any of the fields, so no
 * combination of values can be rearranged into another valid payload.
 */
function buildPayload(session: TrustedSession) {
  return [
    session.role,
    session.username,
    String(session.sessionExpiresAt),
    session.authToken,
  ].join(FIELD_SEPARATOR);
}

// base64url without `Buffer`, so this stays usable on the Edge runtime too.
function toBase64Url(bytes: ArrayBuffer) {
  const binary = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string) {
  const binary = atob(value.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

/** Returns `null` when the deployment has no usable `SESSION_SECRET`. */
export async function signSession(session: TrustedSession): Promise<string | null> {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(buildPayload(session)),
  );

  return toBase64Url(signature);
}

async function readTrustedSession(): Promise<TrustedSession | null> {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const signature = cookieStore.get(SESSION_SIGNATURE_COOKIE)?.value;
  const sessionExpiresAt = parseSessionExpiresAt(
    cookieStore.get(SESSION_EXPIRES_AT_COOKIE)?.value,
  );

  if (!authToken || !signature || sessionExpiresAt === null) {
    return null;
  }

  if (isSessionExpired(sessionExpiresAt)) {
    return null;
  }

  const candidate: TrustedSession = {
    authToken,
    role: parseRole(cookieStore.get(ROLE_COOKIE)?.value),
    username: cookieStore.get(USERNAME_COOKIE)?.value ?? "",
    sessionExpiresAt,
  };

  let isValid = false;
  try {
    const key = await importKey(secret);
    // `crypto.subtle.verify` compares in constant time.
    isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      encoder.encode(buildPayload(candidate)),
    );
  } catch {
    // A malformed signature cookie decodes to garbage; treat it as invalid.
    return null;
  }

  return isValid ? candidate : null;
}

/**
 * The verified session, or `null` when there isn't one. Wrapped in `cache()` so
 * the several components that ask during one render share a single
 * verification.
 */
export const getTrustedSession = cache(readTrustedSession);

/** Convenience for the many call sites that only care about admin rights. */
export async function isAdminSession() {
  return (await getTrustedSession())?.role === "admin";
}
