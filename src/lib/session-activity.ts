"use client";

import { CONTROL_PANEL_BASE_PATH } from "@/lib/api-route-base";
import { SESSION_EXPIRES_AT_HINT_COOKIE, parseSessionExpiresAt } from "@/lib/session-config";
import { clearClientSessionState, replaceWithDocumentNavigation } from "@/lib/client-session";


function getLoginPath() {
  return CONTROL_PANEL_BASE_PATH;
}

function getExpiredLoginUrl() {
  return `${getLoginPath()}?reason=expired`;
}

function normalizePath(path: string) {
  if (!path) {
    return "/";
  }

  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")) {
    return withLeadingSlash.slice(0, -1);
  }

  return withLeadingSlash;
}

let hasHandledSessionExpiry = false;

function isLoginRouteFromAppPath(pathname: string) {
  return normalizePath(pathname) === "/";
}

function isLoginRouteFromBrowserPath(pathname: string) {
  const normalized = normalizePath(pathname);
  const normalizedLoginPath = normalizePath(getLoginPath());
  return normalized === normalizedLoginPath || normalized === "/";
}

/** Reads the client-readable deadline hint written at login. */
function readSessionExpiresAt(): number | null {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${SESSION_EXPIRES_AT_HINT_COOKIE}=`));

  return parseSessionExpiresAt(match?.split("=")[1]);
}

async function redirectToExpiredSession() {
  if (hasHandledSessionExpiry || typeof window === "undefined") {
    return;
  }

  if (isLoginRouteFromBrowserPath(window.location.pathname)) {
    return;
  }

  hasHandledSessionExpiry = true;
  const loginUrl = getExpiredLoginUrl();
  await clearClientSessionState();
  replaceWithDocumentNavigation(loginUrl);
}

export function registerSessionExpiryRedirect(pathname: string) {
  if (isLoginRouteFromAppPath(pathname) || typeof window === "undefined") {
    return () => {};
  }

  let expiryTimer: number | undefined;

  const scheduleExpiry = () => {
    if (expiryTimer !== undefined) {
      window.clearTimeout(expiryTimer);
      expiryTimer = undefined;
    }

    const sessionExpiresAt = readSessionExpiresAt();
    if (sessionExpiresAt === null) {
      void redirectToExpiredSession();
      return;
    }

    const millisecondsRemaining = sessionExpiresAt - Date.now();
    if (millisecondsRemaining <= 0) {
      void redirectToExpiredSession();
      return;
    }

    // setTimeout saturates past ~24.8 days; re-arm instead of firing instantly.
    const MAX_TIMEOUT_MS = 2_147_483_647;
    expiryTimer = window.setTimeout(
      scheduleExpiry,
      Math.min(millisecondsRemaining, MAX_TIMEOUT_MS),
    );
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      scheduleExpiry();
    }
  };

  scheduleExpiry();
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pageshow", scheduleExpiry);

  return () => {
    if (expiryTimer !== undefined) {
      window.clearTimeout(expiryTimer);
    }
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pageshow", scheduleExpiry);
  };
}
