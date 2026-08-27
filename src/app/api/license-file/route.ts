import { NextResponse } from "next/server";
import { requireAdminToken } from "../_utils";
import { getApiBase } from "@/lib/api-base";
import { MAX_LICENSE_FILE_SIZE_BYTES } from "@/lib/license-file";

export async function PUT(request: Request) {
  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_LICENSE_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File size must not exceed 1 MB." }, { status: 413 });
  }

  const body = await request.arrayBuffer();

  if (body.byteLength > MAX_LICENSE_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File size must not exceed 1 MB." }, { status: 413 });
  }

  try {
    const response = await fetch(`${getApiBase()}/v1/license-file`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${auth.authToken}` },
      body,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(
        `[license-file] PUT /v1/license-file -> ${response.status}: ${text || response.statusText}`,
      );
      return NextResponse.json(
        { error: `Backend error ${response.status}.` },
        { status: response.status },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[license-file] PUT /v1/license-file -> unreachable: ${message}`);
    return NextResponse.json({ error: "Unable to reach backend service." }, { status: 502 });
  }
}
