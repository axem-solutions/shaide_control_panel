import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isTrialDeployment } from "@/services/fetch-user-daily-limits";
import {
  expectRequestMatchesFixture,
  fixtureResponse,
  type ManagementApiFixture,
} from "@/services/service-test-support";

vi.mock("server-only", () => ({}));

function limit(
  overrides: Partial<{
    daily_input_token_limit: number | null;
    daily_output_token_limit: number | null;
  }> = {},
) {
  return {
    id: 1,
    model_name: "gpt-test",
    daily_input_token_limit: null,
    daily_output_token_limit: null,
    total_input_token_count: 0,
    total_output_token_count: 0,
    ...overrides,
  };
}

const limitsFixture: ManagementApiFixture = {
  request: {
    method: "GET",
    path: "/v1/user-daily-limits",
    headers: { Authorization: "Bearer user-token" },
  },
  response: {
    status: 200,
    body: { limits: [limit({ daily_output_token_limit: 500 })] },
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

describe("isTrialDeployment", () => {
  it("requests GET /v1/user-daily-limits with the given bearer token", async () => {
    fetchMock.mockResolvedValue(fixtureResponse(limitsFixture));

    await isTrialDeployment("user-token");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expectRequestMatchesFixture(fetchMock.mock.calls[0], limitsFixture);
  });

  it("returns true when any model has an input or output daily limit", async () => {
    fetchMock.mockResolvedValue(fixtureResponse(limitsFixture));

    await expect(isTrialDeployment("user-token")).resolves.toBe(true);

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ limits: [limit(), limit({ daily_input_token_limit: 1 })] }),
        { status: 200 },
      ),
    );

    await expect(isTrialDeployment("user-token")).resolves.toBe(true);
  });

  it("returns false when no model has a daily limit", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ limits: [limit(), limit()] }), { status: 200 }),
    );

    await expect(isTrialDeployment("user-token")).resolves.toBe(false);
  });

  it("returns false on a backend error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(isTrialDeployment("user-token")).resolves.toBe(false);
  });

  it("returns false when the limits field is missing or not an array", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ limits: "nope" }), { status: 200 }),
    );

    await expect(isTrialDeployment("user-token")).resolves.toBe(false);
  });
});
