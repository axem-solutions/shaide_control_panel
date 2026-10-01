import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createModel, deleteModel, getInstalledModels } from "./fetch-models";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("model backend services", () => {
  it("combines generative and embedding models", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ id: 1, name: "chat", platform: "axem", context_size: 8192 }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ models: [{ id: 2, name: "embed" }] }), { status: 200 }));

    await expect(getInstalledModels("token")).resolves.toEqual({ models: [
      { id: 1, kind: "generative", name: "chat", platform: "axem", contextSize: 8192 },
      { id: 2, kind: "embedding", name: "embed" },
    ] });
    expect(fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname)).toEqual([
      "/v1/models",
      "/v1/embedding_models",
    ]);
  });

  it("uses each server mutation endpoint and body shape", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }));
    await createModel("token", {
      kind: "embedding",
      model: { name: "embed", url: "http://embed", vector_size: 10 },
    });
    await deleteModel("token", { kind: "generative", id: 7 });

    expect(new URL(String(fetchMock.mock.calls[0][0])).pathname).toBe("/v1/embedding_model");
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body as string)).toEqual({ name: "embed", url: "http://embed", vector_size: 10 });
    expect(new URL(String(fetchMock.mock.calls[1][0])).pathname).toBe("/v1/models");
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({ model_id: 7 });
  });
});
