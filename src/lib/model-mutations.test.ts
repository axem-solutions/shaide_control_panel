import { describe, expect, it } from "vitest";
import { parseModelDeletion, parseModelMutation } from "./model-mutations";

describe("model mutation validation", () => {
  it("accepts a complete generative model and trims strings", () => {
    expect(parseModelMutation({
      kind: "generative",
      model: {
        name: " chat ",
        variant: " chat ",
        chat_completions_endpoint: " http://model/v1/chat/completions ",
        api_schema: " open_ai ",
        max_generated_tokens: 1024,
        context_size: 8192,
      },
    })).toMatchObject({
      kind: "generative",
      model: { name: "chat", platform: null, max_generated_tokens: 1024 },
    });
  });

  it("rejects incomplete models and invalid deletion IDs", () => {
    expect(parseModelMutation({ kind: "embedding", model: { name: "embed" } })).toBeNull();
    expect(parseModelDeletion({ kind: "generative", id: 0 })).toBeNull();
    expect(parseModelDeletion({ kind: "embedding", id: 2 })).toEqual({ kind: "embedding", id: 2 });
  });
});
