import { NextResponse } from "next/server";
import { requestPresignedUploadUrl } from "@/services/request-presigned-upload-url";
import { getRequestProtocol } from "@/lib/session-config";
import {
  jsonError,
  parseJsonBody,
  requireAuthToken,
  requireOrganizationAccess,
} from "../../_utils";

export async function POST(request: Request) {
  const auth = await requireAuthToken();
  if (!auth.ok) {
    return auth.response;
  }

  const body = await parseJsonBody(request);

  const organization_id = Number(body?.organization_id);
  const file_name =
    typeof body?.file_name === "string" ? body.file_name.trim() : "";
  const content_type =
    typeof body?.content_type === "string" ? body.content_type.trim() : "";

  if (!Number.isInteger(organization_id) || organization_id <= 0) {
    return jsonError("organization_id is required.", 400);
  }

  if (!file_name) {
    return jsonError("file_name is required.", 400);
  }

  if (!content_type) {
    return jsonError("content_type is required.", 400);
  }

  const access = await requireOrganizationAccess(auth.authToken, organization_id);
  if (!access.ok) {
    return access.response;
  }

  const result = await requestPresignedUploadUrl(auth.authToken, {
    organization_id,
    file_name,
    content_type,
  });

  if (result.error || !result.presigned_url) {
    return jsonError(result.error || "Failed to request presigned url.", 502);
  }

  // Extract the public hostname and protocol from headers (set by ingress).
  // X-Forwarded-Host / X-Forwarded-Proto carry the original client request
  // info; when absent (e.g. HTTP-only on-prem with no proxy) we mirror the
  // actual request scheme instead of forcing https.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "localhost:3000";
  const protocol = getRequestProtocol(request);

  const fullUrl = `${protocol}://${host}${result.presigned_url}`;

  return NextResponse.json({ presigned_url: fullUrl }, { status: 200 });
}
