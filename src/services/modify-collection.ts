import "server-only";

import { requestBackendJson } from "./server-http";

export type ModifyCollectionInput = {
	organization_id: number;
	name: string;
	description: string;
	can_users_upload: boolean;
	embedding_model_id?: number;
};

export type ModifyCollectionResponse = {
	error?: string;
};

export async function modifyCollection(
	authToken: string,
	payload: ModifyCollectionInput,
): Promise<ModifyCollectionResponse> {
	const result = await requestBackendJson({
		path: "/v1/rag/organization-collection",
		method: "PATCH",
		authToken,
		body: payload,
	});

	if (!result.ok) {
		return { error: result.error };
	}

	return {};
}

type ModifyCollectionMembershipInput = {
	organization_id: number;
	user_ids: number[];
};

type ModifyCollectionMembershipResponse = {
	error?: string;
};

export async function addCollectionMembers(
	authToken: string,
	payload: ModifyCollectionMembershipInput,
): Promise<ModifyCollectionMembershipResponse> {
	const result = await requestBackendJson({
		path: "/v1/rag/organization-collection/membership",
		method: "PATCH",
		authToken,
		body: payload,
	});

	if (!result.ok) {
		return { error: result.error };
	}

	return {};
}

export async function removeCollectionMembers(
	authToken: string,
	payload: ModifyCollectionMembershipInput,
): Promise<ModifyCollectionMembershipResponse> {
	const result = await requestBackendJson({
		path: "/v1/rag/organization-collection/membership",
		method: "DELETE",
		authToken,
		body: payload,
	});

	if (!result.ok) {
		return { error: result.error };
	}

	return {};
}