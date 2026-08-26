import "server-only";

import { requestBackendJson } from "./server-http";

export type CreateCollectionInput = {
  organization_name: string;
  organization_description: string;
  users: number[];
  can_users_upload: boolean;
  embedding_model_id: number;
};

export type CreateCollectionResponse = {
  error?: string;
};

export async function createCollection(
  authToken: string,
  payload: CreateCollectionInput,
): Promise<CreateCollectionResponse> {
  const result = await requestBackendJson({
    path: "/v1/rag/organization-collection",
    method: "POST",
    authToken,
    body: payload,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {};
}
