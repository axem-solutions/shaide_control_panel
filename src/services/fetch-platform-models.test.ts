import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getPlatformModels, parsePlatformModels } from "./fetch-platform-models";

const generative = {
  kind: "generative", name: "served-chat", variant: "served-chat",
  chat_completions_endpoint: "http://chat.models.svc.cluster.local/v1/chat/completions",
  completions_endpoint: "http://chat.models.svc.cluster.local/v1/completions",
  api_schema: "open_ai", platform: "axem", max_generated_tokens: 2048, context_size: 8192,
  supports_images: true, max_images_per_request: 4, reasoning_effort_values: [],
};
const embedding = {
  kind: "embedding", name: "served-embed", url: "http://embed.models.svc.cluster.local:8200/v1/embeddings",
  vector_size: 768, api_schema: "open_ai", platform: "axem",
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

describe("platform discovery API", () => {
  it("fetches fresh server data with the administrator token", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ models: [generative, embedding], warnings: [] }));
    const result = await getPlatformModels("admin-token");
    expect(result.models).toHaveLength(2);
    expect(result.models[0]).toMatchObject(generative);
    expect(result.models[1]).toMatchObject(embedding);
    const [url, options] = fetchMock.mock.calls[0];
    expect(new URL(String(url)).pathname).toBe("/v1/platform-models");
    expect(options?.cache).toBe("no-store");
    expect(new Headers(options?.headers).get("Authorization")).toBe("Bearer admin-token");
  });

  it("does not fetch without authentication", async () => {
    expect((await getPlatformModels("")).error).toContain("Missing auth token");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retains usable entries and explains unavailable metadata", () => {
    const result = parsePlatformModels({ models: [generative, {kind:"embedding",name:"incomplete"}], warnings: [
      { source: "models/missing", message: "Runtime metadata is unavailable." },
    ] });
    expect(result.models).toHaveLength(1);
    expect(result.error).toContain("models/missing: Runtime metadata is unavailable.");
    expect(result.error).toContain("1 invalid AI Platform model entry was ignored.");
  });

  it("rejects the retired file format and malformed responses", () => {
    for (const value of [null, {}, {generative:[],embedding:[]}, {models:[],warnings:"broken"}, {models:[],warnings:[{}]}]) {
      expect(parsePlatformModels(value)).toMatchObject({models:[],status:502});
    }
  });

  it("excludes conflicting names without dropping a different kind", () => {
    const result = parsePlatformModels({models:[generative,generative,{...embedding,name:generative.name}],warnings:[]});
    expect(result.models).toHaveLength(1);
    expect(result.models[0].kind).toBe("embedding");
    expect(result.error).toContain("Conflicting AI Platform model");
  });

  it("propagates discovery outages and authorization failures", async () => {
    for (const status of [401,403,503]) {
      fetchMock.mockResolvedValueOnce(new Response("unavailable", {status}));
      expect(await getPlatformModels("token")).toMatchObject({models:[],status});
    }
  });
});
