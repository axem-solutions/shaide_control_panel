import "server-only";

import { cache } from "react";
import type { LoginResponse } from "./login-user";
import { requestBackendJson } from "./server-http";

async function fetchSession(authToken: string): Promise<LoginResponse | null> {
  const result = await requestBackendJson<LoginResponse>({
    path: "/v1/login",
    authToken,
  });

  if (!result.ok || !result.data) {
    return null;
  }

  return result.data;
}

/**
 * Re-verifies the caller's session against the backend on every call instead of
 * trusting the client-supplied `shaide_is_admin` cookie, which is unsigned and
 * can be set to any value by the client. Wrapped in `cache()` so multiple checks
 * for the same auth token within a single request share one backend call.
 */
export const verifySession = cache(fetchSession);
