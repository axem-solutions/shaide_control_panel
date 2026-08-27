import "server-only";

import { requestBackendJson } from "./server-http";

export type DeleteCollectionFileInput = {
  organization_id: number;
  file_hash: string;
};

export type DeleteCollectionFileResponse = {
  error?: string;
};

export async function deleteCollectionFile(
  authToken: string,
  payload: DeleteCollectionFileInput,
): Promise<DeleteCollectionFileResponse> {
  const result = await requestBackendJson({
    path: "/v1/rag/organization-collection/file",
    method: "DELETE",
    authToken,
    body: payload,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {};
}
