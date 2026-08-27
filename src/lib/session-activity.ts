"use client";

import { CONTROL_PANEL_BASE_PATH } from "@/lib/api-route-base";
import { API_ROUTE_BASE } from "@/lib/api-route-base";
import { clearClientSessionState, replaceWithDocumentNavigation } from "@/lib/client-session";

const SESSION_TOUCH_PATH = `${API_ROUTE_BASE}/session/touch`;
const SESSION_STATUS_PATH = `${API_ROUTE_BASE}/session/status`;
const SESSION_TOUCH_INTERVAL_MS = 60_000;
const SESSION_STATUS_CHECK_INTERVAL_MS = 1_000;

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

export function registerSessionActivityTouch(pathname: string) {
  if (isLoginRouteFromAppPath(pathname)) {
    return () => {
    };
  }

  function touchSession() {
    void fetch(SESSION_TOUCH_PATH, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      keepalive: true,
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          redirectToExpiredSession();
        }
      })
      .catch(() => {
      });
  }

  function checkSessionStatus() {
    void fetch(SESSION_STATUS_PATH, {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      keepalive: true,
    })
      .then((response) => {
        if (response.status === 401 || response.status === 403) {
          redirectToExpiredSession();
        }
      })
      .catch(() => {
      });
  }

  let lastUserActivityAt = Date.now();
  let lastTouchAt = 0;

  touchSession();
  checkSessionStatus();

  const onActivity = () => {
    const now = Date.now();
    lastUserActivityAt = now;
    if (now - lastTouchAt >= SESSION_TOUCH_INTERVAL_MS) {
      lastTouchAt = now;
      touchSession();
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const now = Date.now();
      lastUserActivityAt = now;
      if (now - lastTouchAt >= SESSION_TOUCH_INTERVAL_MS) {
        lastTouchAt = now;
        touchSession();
      }
    }
  };

  const events: Array<keyof WindowEventMap> = [
    "pointerdown",
    "keydown",
    "scroll",
    "focus",
  ];

  for (const eventName of events) {
    window.addEventListener(eventName, onActivity, { passive: true });
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  const statusCheckTimer = window.setInterval(checkSessionStatus, SESSION_STATUS_CHECK_INTERVAL_MS);
  const touchHeartbeatTimer = window.setInterval(() => {
    if (document.visibilityState !== "visible") {
      return;
    }

    if (Date.now() - lastUserActivityAt > SESSION_TOUCH_INTERVAL_MS) {
      return;
    }

    lastTouchAt = Date.now();
    touchSession();
  }, SESSION_TOUCH_INTERVAL_MS);

  return () => {
    for (const eventName of events) {
      window.removeEventListener(eventName, onActivity);
    }

    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.clearInterval(statusCheckTimer);
    window.clearInterval(touchHeartbeatTimer);
  };
}
