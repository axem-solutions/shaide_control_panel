import "server-only";

import type {
  InstalledModel,
  ModelDeletion,
  ModelMutation,
} from "@/lib/model-types";
import { requestBackendJson } from "./server-http";

type RawModel = {
  id?: unknown;
  name?: unknown;
  variant?: unknown;
  platform?: unknown;
  context_size?: unknown;
};

type RawModelsResponse = { models?: unknown };

export type InstalledModelsResponse = {
  models: InstalledModel[];
  error?: string;
  status?: number;
};

function parseModels(value: unknown, kind: InstalledModel["kind"]): InstalledModel[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }
    const model = candidate as RawModel;
    if (typeof model.id !== "number" || typeof model.name !== "string") {
      return [];
    }
    return [{
      id: model.id,
      kind,
      name: model.name,
      ...(typeof model.variant === "string" ? { variant: model.variant } : {}),
      ...(typeof model.platform === "string" ? { platform: model.platform } : {}),
      ...(typeof model.context_size === "number" ? { contextSize: model.context_size } : {}),
    }];
  });
}

async function getModelsByKind(
  authToken: string,
  kind: InstalledModel["kind"],
): Promise<InstalledModelsResponse> {
  const path = kind === "generative" ? "/v1/models" : "/v1/embedding_models";
  const result = await requestBackendJson<RawModelsResponse>({ path, authToken });

  if (!result.ok) {
    return { models: [], error: result.error, status: result.status };
  }

  const models = parseModels(result.data?.models, kind);
  return models
    ? { models }
    : { models: [], error: "Backend returned invalid model data.", status: 502 };
}

export async function getInstalledModels(authToken: string): Promise<InstalledModelsResponse> {
  const [generative, embedding] = await Promise.all([
    getModelsByKind(authToken, "generative"),
    getModelsByKind(authToken, "embedding"),
  ]);
  const errors = [generative.error, embedding.error].filter(Boolean);

  return {
    models: [...generative.models, ...embedding.models],
    ...(errors.length ? { error: errors.join(" ") } : {}),
    ...(generative.status || embedding.status
      ? { status: generative.status ?? embedding.status }
      : {}),
  };
}

export async function createModel(authToken: string, mutation: ModelMutation) {
  return requestBackendJson({
    path: mutation.kind === "generative" ? "/v1/models" : "/v1/embedding_model",
    method: "POST",
    authToken,
    body: mutation.model,
  });
}

export async function deleteModel(authToken: string, deletion: ModelDeletion) {
  return requestBackendJson({
    path: deletion.kind === "generative" ? "/v1/models" : "/v1/embedding_model",
    method: "DELETE",
    authToken,
    body: deletion.kind === "generative" ? { model_id: deletion.id } : { id: deletion.id },
  });
}
