import type { OrganizationCollection } from "./collection-types";

export type CollectionsApiPayload = {
	collections?: OrganizationCollection[];
} | null;

export function findCollectionById(
	collections: OrganizationCollection[],
	collectionId?: number,
) {
	if (!collectionId) {
		return undefined;
	}

	return collections.find((collection) => collection.id === collectionId);
}

export function findCollectionByName(
	collections: OrganizationCollection[],
	name: string,
) {
	return collections.find((collection) => collection.name === name);
}

export function getCollectionFromPayloadById(
	payload: CollectionsApiPayload,
	collectionId?: number,
) {
	if (!Array.isArray(payload?.collections)) {
		return undefined;
	}

	return findCollectionById(payload.collections, collectionId);
}

export function parsePositiveIntegerArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value.filter(
        (id: unknown): id is number => Number.isInteger(id) && Number(id) > 0,
      ),
    ),
  );
}