import "server-only";

import { requestBackendJson } from "./server-http";

export type DeleteCollectionResponse = {
  error?: string;
};

export async function deleteCollection(
  authToken: string,
  id: number,
): Promise<DeleteCollectionResponse> {
  const result = await requestBackendJson({
    path: "/v1/rag/organization-collection",
    method: "DELETE",
    authToken,
    body: { id },
  });

  if (!result.ok) {
    return { error: result.error };
  }

  return {};
}
