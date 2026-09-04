import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { getUsers } from "@/services/fetch-users";
import {
  expectRequestMatchesFixture,
  fixtureResponse,
  type ManagementApiFixture,
} from "@/services/service-test-support";
import { cookies } from "next/headers";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));

const usersFixture: ManagementApiFixture = {
  request: {
    method: "GET",
    path: "/v1/users",
    headers: { Authorization: "Bearer admin-token" },
  },
  response: {
    status: 200,
    body: {
      users: [
        { id: 1, username: "alice", expires_at: "2027-06-30T00:00:00Z" },
        { id: 2, username: "bob" },
        { id: 3, username: "carol" },
      ],
    },
  },
};

const fetchMock = vi.fn<typeof fetch>();

function setAuthCookie(value?: string) {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === AUTH_TOKEN_COOKIE && value ? { name, value } : undefined,
  } as never);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setAuthCookie("admin-token");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getUsers", () => {
  it("requests GET /v1/users with the session cookie as bearer token", async () => {
    fetchMock.mockResolvedValue(fixtureResponse(usersFixture));

    await getUsers();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expectRequestMatchesFixture(fetchMock.mock.calls[0], usersFixture);
  });

  it("returns username-based users and their account expiry", async () => {
    fetchMock.mockResolvedValue(fixtureResponse(usersFixture));

    const result = await getUsers();

    expect(result).toEqual({
      users: [
        { id: 1, username: "alice", expires_at: "2027-06-30T00:00:00Z" },
        { id: 2, username: "bob" },
        { id: 3, username: "carol" },
      ],
    });
  });

  it("fails without a network call when the session cookie is missing", async () => {
    setAuthCookie(undefined);

    const result = await getUsers();

    expect(result).toEqual({ users: [], error: "Missing auth token." });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps a backend error status to an error result", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const result = await getUsers();

    expect(result).toEqual({ users: [], error: "Backend error 500." });
  });

  it("rejects a response whose users field is not an array", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ users: "nope" }), { status: 200 }),
    );

    const result = await getUsers();

    expect(result).toEqual({
      users: [],
      error: "Backend returned invalid response.",
    });
  });
});
