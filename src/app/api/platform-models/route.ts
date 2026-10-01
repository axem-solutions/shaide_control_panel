import { NextResponse } from "next/server";
import { getPlatformModels } from "@/services/fetch-platform-models";
import { requireAdminToken } from "../_utils";

export async function GET() {
  const auth = await requireAdminToken();
  if (!auth.ok) return auth.response;
  return NextResponse.json(await getPlatformModels());
}
