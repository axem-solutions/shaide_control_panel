import { NextResponse } from "next/server";
import { getEmbeddingModels } from "@/services/fetch-embedding-models";
import { requireAdminToken } from "../_utils";

export async function GET() {
  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const result = await getEmbeddingModels(auth.authToken);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 502 },
    );
  }

  return NextResponse.json({ models: result.models }, { status: 200 });
}
