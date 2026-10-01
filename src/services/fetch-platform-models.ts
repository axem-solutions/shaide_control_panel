import "server-only";

import { readFile } from "node:fs/promises";
import type {
  PlatformEmbeddingModel,
  PlatformGenerativeModel,
  PlatformModel,
} from "@/lib/model-types";

export const DEFAULT_VLLM_CONFIG_PATH = "/etc/shaide/vllm-config.json";

export type PlatformModelsResponse = {
  models: PlatformModel[];
  error?: string;
};

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requiredString(record: JsonRecord, key: string): string | null {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function requiredInteger(record: JsonRecord, key: string): number | null {
  const value = record[key];
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

function parseGenerative(value: unknown): PlatformGenerativeModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = requiredString(value, "name");
  const endpoint = requiredString(value, "chat-completion-endpoint");
  const apiSchema = requiredString(value, "api-schema");
  const platform = requiredString(value, "platform");
  const maxGeneratedTokens = requiredInteger(value, "max-generated-tokens");
  const contextSize = requiredInteger(value, "context-size");

  if (!name || !endpoint || !apiSchema || !platform || !maxGeneratedTokens || !contextSize) {
    return null;
  }

  return {
    kind: "generative",
    name,
    variant: name,
    chat_completions_endpoint: endpoint,
    api_schema: apiSchema,
    platform,
    max_generated_tokens: maxGeneratedTokens,
    context_size: contextSize,
    supports_images: false,
    reasoning_effort_values: [],
  };
}

function parseEmbedding(value: unknown): PlatformEmbeddingModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const url = requiredString(value, "url");
  const name = requiredString(value, "name");
  const vectorSize = requiredInteger(value, "vector-size");
  const platform = requiredString(value, "platform");

  if (!url || !name || !vectorSize || !platform) {
    return null;
  }

  return {
    kind: "embedding",
    url,
    name,
    vector_size: vectorSize,
    platform,
    api_schema: "open_ai",
  };
}

export function parsePlatformModels(value: unknown): PlatformModelsResponse {
  if (!isRecord(value)) {
    return { models: [], error: "AI Platform model catalog is not a JSON object." };
  }

  const generative = Array.isArray(value.generative) ? value.generative : [];
  const embedding = Array.isArray(value.embedding) ? value.embedding : [];
  const parsedGenerative = generative.map(parseGenerative).filter((model) => model !== null);
  const parsedEmbedding = embedding.map(parseEmbedding).filter((model) => model !== null);
  const invalidCount =
    generative.length + embedding.length - parsedGenerative.length - parsedEmbedding.length;

  return {
    models: [...parsedGenerative, ...parsedEmbedding],
    ...(invalidCount > 0
      ? { error: `${invalidCount} invalid AI Platform model ${invalidCount === 1 ? "entry was" : "entries were"} ignored.` }
      : {}),
  };
}

export async function getPlatformModels(
  path = process.env.VLLM_CONFIG_PATH ?? DEFAULT_VLLM_CONFIG_PATH,
): Promise<PlatformModelsResponse> {
  try {
    const contents = await readFile(path, "utf8");
    return parsePlatformModels(JSON.parse(contents));
  } catch (error) {
    const detail = error instanceof SyntaxError ? "contains invalid JSON" : "is not available";
    console.error(`[platform-models] ${path} ${detail}.`);
    return {
      models: [],
      error: `AI Platform model catalog ${detail}. Custom models can still be added.`,
    };
  }
}
