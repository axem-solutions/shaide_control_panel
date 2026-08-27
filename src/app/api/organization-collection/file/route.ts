import { NextResponse } from "next/server";
import { deleteCollectionFile } from "@/services/delete-collection-file";
import {
  jsonError,
  parseJsonBody,
  requireAuthToken,
  requireOrganizationAccess,
} from "../../_utils";

export async function DELETE(request: Request) {
  const auth = await requireAuthToken();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await parseJsonBody(request);
  const organization_id = Number(body?.organization_id);
  const file_hash =
    typeof body?.file_hash === "string"
      ? body.file_hash.trim()
      : typeof body?.hash === "string"
        ? body.hash.trim()
        : "";

  if (!Number.isInteger(organization_id) || organization_id <= 0) {
    return jsonError("organization_id is required.", 400);
  }

  if (!file_hash) {
    return jsonError("file_hash is required.", 400);
  }

  const access = await requireOrganizationAccess(auth.authToken, organization_id);
  if (!access.ok) {
    return access.response;
  }

  const result = await deleteCollectionFile(auth.authToken, {
    organization_id,
    file_hash,
  });

  if (result.error) {
    return jsonError(result.error, 502);
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
