import { describe, expect, it } from "vitest";
import { parseModelDeletion, parseModelMutation } from "./model-mutations";

describe("model mutation validation", () => {
  const completeModel = {
    name: "chat", variant: "chat", chat_completions_endpoint: "http://model/chat",
    api_schema: "open_ai", max_generated_tokens: 1024, context_size: 8192,
    platform: "foundry", completions_endpoint: "http://model/completions",
    responses_endpoint: "http://model/responses", daily_input_token_limit: 0,
    daily_output_token_limit: 100, supports_images: true,
    reasoning_effort_values: ["none", "low", "high"],
    max_images_per_request: 4, max_image_bytes: 1024,
    max_image_width_px: 640, max_image_height_px: 480,
    native_fim_mode: "fim_tokens", fim_prompt_template: "  {prefix}\n{suffix}  ",
  };

  it("preserves every supported generative field and prompt whitespace", () => {
    expect(parseModelMutation({ kind: "generative", model: completeModel }))
      .toEqual({ kind: "generative", model: completeModel });
  });

  it.each([
    ["daily_input_token_limit", -1], ["daily_output_token_limit", 1.5],
    ["max_images_per_request", 0], ["max_image_bytes", "1024"],
    ["max_image_width_px", Number.MAX_SAFE_INTEGER + 1], ["max_image_height_px", -1],
    ["native_fim_mode", "unknown"], ["fim_prompt_template", 123],
    ["supports_images", "true"], ["reasoning_effort_values", ["low", "low"]],
    ["reasoning_effort_values", ["unsupported"]], ["reasoning_effort_values", "low"],
  ])("rejects invalid %s instead of silently dropping it", (field, value) => {
    expect(parseModelMutation({ kind: "generative", model: { ...completeModel, [field]: value } })).toBeNull();
  });

  it("preserves embedding limits including zero and rejects invalid limits", () => {
    const model = { name: "embed", url: "http://embed", vector_size: 768, platform: "foundry", api_schema: "open_ai" };
    for (const limit of [null, 0, 1000]) {
      expect(parseModelMutation({ kind: "embedding", model: { ...model, daily_input_token_limit: limit } }))
        .toEqual({ kind: "embedding", model: { ...model, daily_input_token_limit: limit } });
    }
    for (const limit of [-1, 0.5, "1000"]) {
      expect(parseModelMutation({ kind: "embedding", model: { ...model, daily_input_token_limit: limit } })).toBeNull();
    }
  });

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
