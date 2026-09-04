import { expect } from "vitest";

/**
 * Inline management-API fixture in the shape of the shared corpus (strategy
 * §4b) — when the corpus lands in Epic 3 these objects are replaced by loaded
 * fixture files and the test bodies stay unchanged.
 */
export type ManagementApiFixture = {
  request: {
    method: string;
    path: string;
    headers?: { Authorization?: string };
    body?: unknown;
  };
  response: {
    status: number;
    body: unknown;
  };
};

export function fixtureResponse(fixture: ManagementApiFixture): Response {
  return new Response(JSON.stringify(fixture.response.body), {
    status: fixture.response.status,
  });
}

type FetchCall = [input: RequestInfo | URL, init?: RequestInit];

export function expectRequestMatchesFixture(
  call: FetchCall,
  fixture: ManagementApiFixture,
) {
  const [url, init] = call;
  expect(String(url)).toContain(fixture.request.path);
  expect(init?.method ?? "GET").toBe(fixture.request.method);
  if (fixture.request.headers) {
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      fixture.request.headers.Authorization ?? null,
    );
  }
  if (fixture.request.body !== undefined) {
    expect(JSON.parse(String(init?.body))).toEqual(fixture.request.body);
  }
}
