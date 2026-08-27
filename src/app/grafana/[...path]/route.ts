import { NextResponse, type NextRequest } from "next/server";
import { requireAdminToken } from "../../api/_utils";
import { getGrafanaBase } from "@/lib/api-base";

async function proxy(request: NextRequest, path: string[]) {
  const auth = await requireAdminToken();
  if (!auth.ok) {
    auth.response.headers.set("X-Frame-Options", "SAMEORIGIN");
    return auth.response;
  }

  const targetPath = path.map(encodeURIComponent).join("/");
  const upstreamUrl = `${getGrafanaBase()}/${targetPath}${request.nextUrl.search}`;

  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("cookie");
  upstreamHeaders.delete("content-length");
  upstreamHeaders.delete("accept-encoding");

  const hasBody = !["GET", "HEAD"].includes(request.method);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: hasBody ? request.body : undefined,
      // Node's fetch requires this when streaming a request body.
      // @ts-expect-error -- `duplex` isn't in the DOM RequestInit types yet.
      duplex: hasBody ? "half" : undefined,
      redirect: "follow",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[grafana-proxy] ${request.method} ${upstreamUrl} -> unreachable: ${message}`);
    return NextResponse.json({ error: "Unable to reach Grafana." }, { status: 502 });
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.set("X-Frame-Options", "SAMEORIGIN");
  responseHeaders.delete("content-security-policy");

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxy(request, path);
}

export {
  handle as GET,
  handle as POST,
  handle as PUT,
  handle as PATCH,
  handle as DELETE,
  handle as HEAD,
};
