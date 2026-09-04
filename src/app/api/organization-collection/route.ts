import { NextResponse } from "next/server";
import { getUsers } from "@/services/fetch-users";
import { createCollection } from "@/services/create-collection";
import { deleteCollection } from "@/services/delete-collection";
import { getCollections } from "@/services/fetch-collections";
import {
  addCollectionMembers,
  modifyCollection,
  removeCollectionMembers,
} from "@/services/modify-collection";
import {
  jsonError,
  parseJsonBody,
  requireAdminToken,
  requireAuthToken,
  requireKnowledgeCenter,
} from "../_utils";
import { parsePositiveIntegerArray } from "@/lib/collection-utils";

function getBackendStatus(error: string) {
  const match = error.match(/Backend error\s+(\d{3})/i);
  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) ? parsed : undefined;
}


export async function GET() {
  const availability = requireKnowledgeCenter();
  if (!availability.ok) {
    return availability.response;
  }

  const auth = await requireAuthToken();
  if (!auth.ok) {
    return auth.response;
  }

  const result = await getCollections(auth.authToken);
  if (result.error) {
    return jsonError(result.error, 502);
  }

  return NextResponse.json({ collections: result.collections }, { status: 200 });
}

export async function POST(request: Request) {
  const availability = requireKnowledgeCenter();
  if (!availability.ok) {
    return availability.response;
  }

  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await parseJsonBody(request);

  const organization_name =
    typeof body?.organization_name === "string"
      ? body.organization_name.trim()
      : "";
  const organization_description =
    typeof body?.organization_description === "string"
      ? body.organization_description.trim()
      : "";
  const can_users_upload = Boolean(body?.can_users_upload);
  const embedding_model_id =
    typeof body?.embedding_model_id === "number" ? body.embedding_model_id : undefined;
  const selectedUsers = Array.isArray(body?.users)
    ? body.users.filter((id: unknown): id is number => Number.isInteger(id))
    : [];

  if (!organization_name) {
    return jsonError("Collection name is required.", 400);
  }

  if (!embedding_model_id) {
    return jsonError("Embedding model is required.", 400);
  }

  const usersResponse = await getUsers();
  if (usersResponse.error) {
    return jsonError(usersResponse.error, 502);
  }

  const adminUser = usersResponse.users.find(
    (user) => user.auth_token === auth.authToken,
  );

  if (!adminUser) {
    return jsonError("Unable to resolve current admin user.", 400);
  }

  const userIds = Array.from(new Set<number>([...selectedUsers, adminUser.id]));

  const result = await createCollection(auth.authToken, {
    organization_name,
    organization_description,
    users: userIds,
    can_users_upload,
    embedding_model_id,
  });

  if (result.error) {
    return jsonError(result.error, 502);
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: Request) {
  const availability = requireKnowledgeCenter();
  if (!availability.ok) {
    return availability.response;
  }

  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await parseJsonBody(request);
  const id = Number(body?.id);

  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("Collection id is required.", 400);
  }

  const result = await deleteCollection(auth.authToken, id);
  if (result.error) {
    return jsonError(result.error, 502);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function PATCH(request: Request) {
  const availability = requireKnowledgeCenter();
  if (!availability.ok) {
    return availability.response;
  }

  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await parseJsonBody(request);
  const organization_id = Number(body?.organization_id);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const can_users_upload =
    typeof body?.can_users_upload === "boolean" ? body.can_users_upload : null;

  const add_user_ids = parsePositiveIntegerArray(body?.add_user_ids);
  const remove_user_ids = parsePositiveIntegerArray(body?.remove_user_ids);

  if (!Number.isInteger(organization_id) || organization_id <= 0) {
    return jsonError("Valid organization_id is required.", 400);
  }

  if (!name) {
    return jsonError("Collection name is required.", 400);
  }

  if (can_users_upload === null) {
    return jsonError("can_users_upload must be a boolean.", 400);
  }

  const embedding_model_id =
    typeof body?.embedding_model_id === "number" ? body.embedding_model_id : undefined;

  const modifyResult = await modifyCollection(auth.authToken, {
    organization_id,
    name,
    description,
    can_users_upload,
    ...(embedding_model_id !== undefined && { embedding_model_id }),
  });

  if (modifyResult.error) {
    return jsonError(modifyResult.error, getBackendStatus(modifyResult.error) ?? 502);
  }

  if (add_user_ids.length > 0) {
    const addMembersResult = await addCollectionMembers(auth.authToken, {
      organization_id,
      user_ids: add_user_ids,
    });

    if (addMembersResult.error) {
      return jsonError(
        addMembersResult.error,
        getBackendStatus(addMembersResult.error) ?? 502,
      );
    }
  }

  if (remove_user_ids.length > 0) {
    const removeMembersResult = await removeCollectionMembers(auth.authToken, {
      organization_id,
      user_ids: remove_user_ids,
    });

    if (removeMembersResult.error) {
      return jsonError(
        removeMembersResult.error,
        getBackendStatus(removeMembersResult.error) ?? 502,
      );
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
