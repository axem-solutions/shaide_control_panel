import "server-only";

import { parseModelMutation } from "@/lib/model-mutations";
import type { PlatformModel } from "@/lib/model-types";
import { requestBackendJson } from "./server-http";

export type PlatformModelsResponse = {
  models: PlatformModel[];
  error?: string;
  status?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** The server owns discovery and normalization; the panel validates registration-ready settings. */
export function parsePlatformModels(value: unknown): PlatformModelsResponse {
  if (!isRecord(value) || !Array.isArray(value.models) || !Array.isArray(value.warnings)) {
    return { models: [], error: "Backend returned invalid AI Platform model data.", status: 502 };
  }

  const models: PlatformModel[] = [];
  const errors: string[] = [];
  for (const warning of value.warnings) {
    if (!isRecord(warning) || typeof warning.source !== "string" || typeof warning.message !== "string") {
      return { models: [], error: "Backend returned invalid AI Platform warning data.", status: 502 };
    }
    errors.push(`${warning.source}: ${warning.message}`);
  }
  let invalidCount = 0;
  for (const candidate of value.models) {
    const mutation = isRecord(candidate)
      ? parseModelMutation({ kind: candidate.kind, model: candidate })
      : null;
    if (!mutation) {
      invalidCount += 1;
      continue;
    }
    models.push({ ...mutation.model, kind: mutation.kind } as PlatformModel);
  }
  if (invalidCount) {
    errors.push(`${invalidCount} invalid AI Platform model ${invalidCount === 1 ? "entry was" : "entries were"} ignored.`);
  }
  // A repeated served name is ambiguous; never let list order decide which endpoint gets added.
  const counts = new Map<string, number>();
  for (const model of models) {
    const key = `${model.kind}:${model.name}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [key, count] of counts) {
    if (count > 1) errors.push(`Conflicting AI Platform model ${key} was ignored.`);
  }
  return {
    models: models.filter((model) => counts.get(`${model.kind}:${model.name}`) === 1),
    ...(errors.length ? { error: errors.join(" ") } : {}),
  };
}

export async function getPlatformModels(authToken: string): Promise<PlatformModelsResponse> {
  const result = await requestBackendJson({ path: "/v1/platform-models", authToken });
  if (!result.ok) {
    return {
      models: [],
      error: `${result.status === 503 ? "AI Platform discovery is unavailable." : result.error} Custom models can still be added.`,
      status: result.status ?? 502,
    };
  }
  return parsePlatformModels(result.data);
}
