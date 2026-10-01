import { NextResponse } from "next/server";
import { parseModelDeletion, parseModelMutation } from "@/lib/model-mutations";
import { createModel, deleteModel, getInstalledModels } from "@/services/fetch-models";
import { jsonError, parseJsonBody, requireAdminToken } from "../_utils";

export async function GET() {
  const auth = await requireAdminToken();
  if (!auth.ok) return auth.response;

  const result = await getInstalledModels(auth.authToken);
  return NextResponse.json(
    { models: result.models, ...(result.error ? { error: result.error } : {}) },
    { status: result.error ? (result.status ?? 502) : 200 },
  );
}

export async function POST(request: Request) {
  const auth = await requireAdminToken();
  if (!auth.ok) return auth.response;
  const mutation = parseModelMutation(await parseJsonBody(request));
  if (!mutation) return jsonError("Invalid model definition.", 400);

  const result = await createModel(auth.authToken, mutation);
  return result.ok
    ? NextResponse.json(result.data ?? {}, { status: result.status })
    : jsonError(result.error, result.status ?? 502);
}

export async function DELETE(request: Request) {
  const auth = await requireAdminToken();
  if (!auth.ok) return auth.response;
  const deletion = parseModelDeletion(await parseJsonBody(request));
  if (!deletion) return jsonError("Invalid model deletion request.", 400);

  const result = await deleteModel(auth.authToken, deletion);
  return result.ok
    ? NextResponse.json(result.data ?? {}, { status: result.status })
    : jsonError(result.error, result.status ?? 502);
}
