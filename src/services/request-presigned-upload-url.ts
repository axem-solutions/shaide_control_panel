import "server-only";

import { requestBackendJson } from "./server-http";

export type RequestPresignedUploadUrlInput = {
  organization_id: number;
  file_name: string;
  content_type: string;
};

export type RequestPresignedUploadUrlResponse = {
  presigned_url?: string;
  error?: string;
};

export async function requestPresignedUploadUrl(
  authToken: string,
  payload: RequestPresignedUploadUrlInput,
): Promise<RequestPresignedUploadUrlResponse> {
  const result = await requestBackendJson<{ presigned_url?: string }>({
    path: "/v1/object-storage/presigned-url",
    method: "POST",
    authToken,
    body: payload,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  if (!result.data?.presigned_url) {
    return { error: "Backend did not return a presigned url." };
  }

  return { presigned_url: result.data.presigned_url };
}
