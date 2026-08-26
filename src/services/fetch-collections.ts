import "server-only";

import type { OrganizationCollection, OrganizationFile } from "../lib/collection-types";
import { requestBackendJson } from "./server-http";

export const runtime = "nodejs"; // ensure Node runtime
export const revalidate = 0; // always dynamic
export const dynamic = "force-dynamic";

export type CollectionsResponse = {
  collections: OrganizationCollection[];
  error?: string;
};

type RawCollectionsResponse = {
  organization?: Array<
    Omit<OrganizationCollection, "files"> & {
      files?: unknown[];
    }
  >;
  message?: string;
};

type RawOrganizationCollection = NonNullable<RawCollectionsResponse["organization"]>[number];

function isOrganizationFile(value: unknown): value is OrganizationFile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const file = value as Partial<OrganizationFile>;
  return (
    typeof file.hash === "string" &&
    typeof file.name === "string" &&
    typeof file.mime_type === "string" &&
    typeof file.status === "string" &&
    typeof file.uploaded_at === "string" &&
    (typeof file.size === "number" || file.size === null)
  );
}

function normalizeCollection(collection: RawOrganizationCollection): OrganizationCollection {
  const files = Array.isArray(collection.files)
    ? collection.files.filter(isOrganizationFile)
    : [];

  return {
    ...collection,
    files,
  };
}

export async function getCollections(
  authToken: string,
): Promise<CollectionsResponse> {
  const result = await requestBackendJson<RawCollectionsResponse>({
    path: "/v1/rag/organization-collection",
    authToken,
  });

  if (!result.ok) {
    return { collections: [], error: result.error };
  }

  const payload = result.data;

  if (!payload) {
    return { collections: [], error: "Backend returned empty response." };
  }

  if (Array.isArray(payload.organization)) {
    return { collections: payload.organization.map(normalizeCollection) };
  }

  if (payload.message) {
    return { collections: [], error: payload.message };
  }

  return { collections: [], error: "Backend returned invalid response." };
}
