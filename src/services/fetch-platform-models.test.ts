import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parsePlatformModels } from "./fetch-platform-models";

describe("parsePlatformModels", () => {
  it("normalizes the SHD-922 vllm-config contract", () => {
    expect(parsePlatformModels({
      generative: [{
        name: "chat-model",
        "chat-completion-endpoint": "http://chat/v1/chat/completions",
        "api-schema": "open_ai",
        platform: "axem",
        "max-generated-tokens": 4096,
        "context-size": 32768,
      }],
      embedding: [{
        name: "embed-model",
        url: "http://embed/v1/embeddings",
        "vector-size": 768,
        platform: "axem",
      }],
    })).toEqual({ models: [
      {
        kind: "generative",
        name: "chat-model",
        variant: "chat-model",
        chat_completions_endpoint: "http://chat/v1/chat/completions",
        api_schema: "open_ai",
        platform: "axem",
        max_generated_tokens: 4096,
        context_size: 32768,
        supports_images: false,
        reasoning_effort_values: [],
      },
      {
        kind: "embedding",
        name: "embed-model",
        url: "http://embed/v1/embeddings",
        vector_size: 768,
        platform: "axem",
        api_schema: "open_ai",
      },
    ] });
  });

  it("ignores malformed entries and reports them", () => {
    expect(parsePlatformModels({ generative: [{ name: "incomplete" }], embedding: [] }))
      .toEqual({ models: [], error: "1 invalid AI Platform model entry was ignored." });
  });
});
