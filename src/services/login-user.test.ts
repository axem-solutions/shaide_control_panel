import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loginUser } from "@/services/login-user";
import {
  expectRequestMatchesFixture,
  fixtureResponse,
  type ManagementApiFixture,
} from "@/services/service-test-support";

vi.mock("server-only", () => ({}));

const loginFixture: ManagementApiFixture = {
  request: {
    method: "POST",
    path: "/v1/login",
    headers: {},
    body: { username: "alice", password: "correct-horse" },
  },
  response: {
    status: 200,
    body: {
      access_token: "srv-token",
      token_type: "bearer",
      token_expires_in: 3600,
      role: "admin",
      account_expires_at: "2027-06-30T00:00:00Z",
    },
  },
};

// The follow-up call loginUser makes to classify the deployment as trial.
const trialLimitsFixture: ManagementApiFixture = {
  request: {
    method: "GET",
    path: "/v1/user-daily-limits",
    headers: { Authorization: "Bearer srv-token" },
  },
  response: {
    status: 200,
    body: {
      limits: [
        {
          id: 1,
          model_name: "gpt-test",
          daily_input_token_limit: 1000,
          daily_output_token_limit: null,
          total_input_token_count: 0,
          total_output_token_count: 0,
        },
      ],
    },
  },
};

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loginUser", () => {
  it("posts the credentials, then queries daily limits with the returned access token", async () => {
    fetchMock
      .mockResolvedValueOnce(fixtureResponse(loginFixture))
      .mockResolvedValueOnce(fixtureResponse(trialLimitsFixture));

    await loginUser("alice", "correct-horse");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expectRequestMatchesFixture(fetchMock.mock.calls[0], loginFixture);
    expectRequestMatchesFixture(fetchMock.mock.calls[1], trialLimitsFixture);
  });

  it("returns the login payload with is_trial=true when a daily limit is set", async () => {
    fetchMock
      .mockResolvedValueOnce(fixtureResponse(loginFixture))
      .mockResolvedValueOnce(fixtureResponse(trialLimitsFixture));

    const result = await loginUser("alice", "correct-horse");

    expect(result).toEqual({
      access_token: "srv-token",
      token_type: "bearer",
      token_expires_in: 3600,
      role: "admin",
      account_expires_at: "2027-06-30T00:00:00Z",
      is_trial: true,
    });
  });

  it("returns is_trial=false when no daily limit is set", async () => {
    fetchMock
      .mockResolvedValueOnce(fixtureResponse(loginFixture))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            limits: [
              {
                id: 1,
                model_name: "gpt-test",
                daily_input_token_limit: null,
                daily_output_token_limit: null,
                total_input_token_count: 0,
                total_output_token_count: 0,
              },
            ],
          }),
          { status: 200 },
        ),
      );

    const result = await loginUser("alice", "correct-horse");

    expect(result).toMatchObject({ is_trial: false });
  });

  it("rejects a successful response that has no access token", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ role: "user" }), { status: 200 }),
    );

    const result = await loginUser("alice", "correct-horse");

    expect(result).toEqual({
      access_token: "",
      error: "Backend returned an invalid login payload.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid credentials without leaking the backend error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("unauthorized", { status: 401 }));

    const result = await loginUser("alice", "wrong-password");

    expect(result).toEqual({
      access_token: "",
      error: "Invalid username or password.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps a non-authentication backend error to a generic sign-in error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("unavailable", { status: 503 }));

    const result = await loginUser("alice", "correct-horse");

    expect(result).toEqual({
      access_token: "",
      error: "Unable to sign in. Please try again.",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports an empty backend response as an error", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 200 }));

    const result = await loginUser("alice", "correct-horse");

    expect(result).toEqual({
      access_token: "",
      error: "Backend returned an invalid login payload.",
    });
  });
});
