import "server-only";

import { getApiBase } from "@/lib/api-base";

type BackendRequestOptions = {
  path: string;
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
  authToken?: string;
  body?: unknown;
  headers?: HeadersInit;
  missingAuthError?: string;
  allowUnauthenticated?: boolean;
};

type BackendSuccess<T> = {
  ok: true;
  status: number;
  data: T | null;
};

type BackendFailure = {
  ok: false;
  status?: number;
  error: string;
};

export type BackendJsonResult<T> = BackendSuccess<T> | BackendFailure;

export async function requestBackendJson<T = unknown>(
  options: BackendRequestOptions,
): Promise<BackendJsonResult<T>> {
  const {
    path,
    method = "GET",
    authToken,
    body,
    headers,
    missingAuthError = "Missing auth token.",
    allowUnauthenticated = false,
  } = options;

  if (!authToken && !allowUnauthenticated) {
    return { ok: false, error: missingAuthError };
  }

  const base = getApiBase();

  try {
    const mergedHeaders = new Headers(headers);
    if (authToken) {
      mergedHeaders.set("Authorization", `Bearer ${authToken}`);
    }

    const hasBody = body !== undefined;
    if (hasBody && !mergedHeaders.has("Content-Type")) {
      mergedHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(`${base}${path}`, {
      method,
      cache: "no-store",
      headers: mergedHeaders,
      body: hasBody ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[server-http] ${method} ${path} -> ${response.status}: ${text || response.statusText}`,
      );
      return {
        ok: false,
        status: response.status,
        error: `Backend error ${response.status}.`,
      };
    }

    const data = (await response.json().catch(() => null)) as T | null;

    return {
      ok: true,
      status: response.status,
      data,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[server-http] ${method} ${path} -> unreachable at ${base}: ${message}`);
    return {
      ok: false,
      error: "Unable to reach backend service.",
    };
  }
}
