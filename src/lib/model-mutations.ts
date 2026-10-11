import type { EmbeddingModelInput, GenerativeModelInput, ModelDeletion, ModelMutation } from "./model-types";
import { NATIVE_FIM_MODES, REASONING_EFFORT_VALUES } from "./model-types";

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value);
const stringValue = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const positiveInteger = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.trim() || null : undefined;
}

function optionalInteger(value: unknown, minimum: number): number | null | undefined {
  if (value === undefined || value === null) return null;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= minimum ? value : undefined;
}

function parseGenerative(value: unknown): GenerativeModelInput | null {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name);
  const variant = stringValue(value.variant);
  const endpoint = optionalString(value.chat_completions_endpoint);
  const apiSchema = stringValue(value.api_schema);
  const maxGeneratedTokens = positiveInteger(value.max_generated_tokens);
  const contextSize = positiveInteger(value.context_size);
  if (!name || !variant || endpoint === undefined || !apiSchema || !maxGeneratedTokens || !contextSize) return null;

  const completionsEndpoint = optionalString(value.completions_endpoint);
  const responsesEndpoint = optionalString(value.responses_endpoint);
  const platform = optionalString(value.platform);
  if (completionsEndpoint === undefined || responsesEndpoint === undefined || platform === undefined) return null;

  const dailyInputTokenLimit = optionalInteger(value.daily_input_token_limit, 0);
  const dailyOutputTokenLimit = optionalInteger(value.daily_output_token_limit, 0);
  const maxImagesPerRequest = optionalInteger(value.max_images_per_request, 1);
  const maxImageBytes = optionalInteger(value.max_image_bytes, 1);
  const maxImageWidth = optionalInteger(value.max_image_width_px, 1);
  const maxImageHeight = optionalInteger(value.max_image_height_px, 1);
  if ([dailyInputTokenLimit, dailyOutputTokenLimit, maxImagesPerRequest, maxImageBytes, maxImageWidth, maxImageHeight].includes(undefined)) return null;

  const nativeFimMode = value.native_fim_mode ?? null;
  if (nativeFimMode !== null && !NATIVE_FIM_MODES.some((mode) => mode === nativeFimMode)) return null;
  // Whitespace in a FIM template is part of the prompt.
  const fimPromptTemplate = value.fim_prompt_template ?? null;
  if (fimPromptTemplate !== null && typeof fimPromptTemplate !== "string") return null;

  if (value.supports_images !== undefined && typeof value.supports_images !== "boolean") return null;
  const reasoningEffortValues = value.reasoning_effort_values ?? [];
  if (!Array.isArray(reasoningEffortValues)
    || reasoningEffortValues.some((item) => !REASONING_EFFORT_VALUES.some((option) => option === item))
    || new Set(reasoningEffortValues).size !== reasoningEffortValues.length) return null;

  return {
    name,
    variant,
    // The server accepts an empty endpoint but its request field is a String, not Option<String>.
    chat_completions_endpoint: endpoint ?? "",
    completions_endpoint: completionsEndpoint,
    responses_endpoint: responsesEndpoint,
    api_schema: apiSchema,
    max_generated_tokens: maxGeneratedTokens,
    context_size: contextSize,
    platform,
    supports_images: value.supports_images === true,
    reasoning_effort_values: reasoningEffortValues,
    daily_input_token_limit: dailyInputTokenLimit,
    daily_output_token_limit: dailyOutputTokenLimit,
    max_images_per_request: maxImagesPerRequest,
    max_image_bytes: maxImageBytes,
    max_image_width_px: maxImageWidth,
    max_image_height_px: maxImageHeight,
    native_fim_mode: nativeFimMode as GenerativeModelInput["native_fim_mode"],
    fim_prompt_template: fimPromptTemplate,
  };
}

function parseEmbedding(value: unknown): EmbeddingModelInput | null {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name);
  const url = stringValue(value.url);
  const vectorSize = positiveInteger(value.vector_size);
  const platform = optionalString(value.platform);
  const apiSchema = optionalString(value.api_schema);
  const dailyInputTokenLimit = optionalInteger(value.daily_input_token_limit, 0);
  if (!name || !url || !vectorSize || platform === undefined || apiSchema === undefined || dailyInputTokenLimit === undefined) return null;
  return { name, url, vector_size: vectorSize, platform, api_schema: apiSchema, daily_input_token_limit: dailyInputTokenLimit };
}

export function parseModelMutation(value: unknown): ModelMutation | null {
  if (!isRecord(value)) return null;
  if (value.kind === "generative") {
    const model = parseGenerative(value.model);
    return model ? { kind: "generative", model } : null;
  }
  if (value.kind === "embedding") {
    const model = parseEmbedding(value.model);
    return model ? { kind: "embedding", model } : null;
  }
  return null;
}

export function parseModelDeletion(value: unknown): ModelDeletion | null {
  if (!isRecord(value) || (value.kind !== "generative" && value.kind !== "embedding")) return null;
  const id = positiveInteger(value.id);
  return id ? { kind: value.kind, id } : null;
}
