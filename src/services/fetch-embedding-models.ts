import "server-only";

import { requestBackendJson } from "./server-http";

export type EmbeddingModel = {
  id: number;
  name: string;
  [key: string]: unknown;
};

export type EmbeddingModelsResponse = {
  models: EmbeddingModel[];
  error?: string;
  status?: number;
};

type RawEmbeddingModelsResponse = {
  models?: unknown[];
  embedding_models?: unknown[];
  message?: string;
};

function isEmbeddingModel(value: unknown): value is EmbeddingModel {
  if (!value || typeof value !== "object") {
    return false;
  }
  const model = value as Partial<EmbeddingModel>;
  return typeof model.id === "number" && typeof model.name === "string";
}

export async function getEmbeddingModels(
  authToken: string,
): Promise<EmbeddingModelsResponse> {
  const result = await requestBackendJson<RawEmbeddingModelsResponse>({
    path: "/v1/embedding_models",
    authToken,
  });

  if (!result.ok) {
    return { models: [], error: result.error, status: result.status };
  }

  const payload = result.data;

  if (!payload) {
    return { models: [], error: "Backend returned empty response." };
  }

  if (Array.isArray(payload.models)) {
    return { models: payload.models.filter(isEmbeddingModel) };
  }

  if (Array.isArray(payload.embedding_models)) {
    return { models: payload.embedding_models.filter(isEmbeddingModel) };
  }

  if (payload.message) {
    return { models: [], error: payload.message };
  }

  return { models: [], error: "Backend returned invalid response." };
}
