import type { EmbeddingModelInput, GenerativeModelInput, ModelDeletion, ModelMutation } from "./model-types";

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => value !== null && typeof value === "object" && !Array.isArray(value);
const stringValue = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null;
const positiveInteger = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
function optionalString(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  return typeof value === "string" ? value.trim() : undefined;
}

function parseGenerative(value: unknown): GenerativeModelInput | null {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name);
  const variant = stringValue(value.variant);
  const endpoint = stringValue(value.chat_completions_endpoint);
  const apiSchema = stringValue(value.api_schema);
  const maxGeneratedTokens = positiveInteger(value.max_generated_tokens);
  const contextSize = positiveInteger(value.context_size);
  if (!name || !variant || !endpoint || !apiSchema || !maxGeneratedTokens || !contextSize) return null;

  const completionsEndpoint = optionalString(value.completions_endpoint);
  const responsesEndpoint = optionalString(value.responses_endpoint);
  const platform = optionalString(value.platform);
  if (completionsEndpoint === undefined || responsesEndpoint === undefined || platform === undefined) return null;

  return {
    name,
    variant,
    chat_completions_endpoint: endpoint,
    completions_endpoint: completionsEndpoint,
    responses_endpoint: responsesEndpoint,
    api_schema: apiSchema,
    max_generated_tokens: maxGeneratedTokens,
    context_size: contextSize,
    platform,
    supports_images: value.supports_images === true,
    reasoning_effort_values: Array.isArray(value.reasoning_effort_values)
      ? value.reasoning_effort_values.filter((item): item is string => typeof item === "string")
      : [],
  };
}

function parseEmbedding(value: unknown): EmbeddingModelInput | null {
  if (!isRecord(value)) return null;
  const name = stringValue(value.name);
  const url = stringValue(value.url);
  const vectorSize = positiveInteger(value.vector_size);
  const platform = optionalString(value.platform);
  const apiSchema = optionalString(value.api_schema);
  if (!name || !url || !vectorSize || platform === undefined || apiSchema === undefined) return null;
  return { name, url, vector_size: vectorSize, platform, api_schema: apiSchema };
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
