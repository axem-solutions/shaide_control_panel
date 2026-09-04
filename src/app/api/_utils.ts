import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/session-config";
import { isKnowledgeCenterEnabled } from "@/lib/feature-flags";
import { getTrustedSession, isAdminSession } from "@/lib/session-signature";
import { getCollections } from "@/services/fetch-collections";

type AuthSession = {
  ok: true;
  authToken: string;
  role: UserRole;
  username: string;
};

type MissingSession = {
  ok: false;
  response: NextResponse;
};

type RequireAuthSessionResult = AuthSession | MissingSession;

export async function requireAuthSession(): Promise<RequireAuthSessionResult> {
  // Every field comes from the signed session: an edited role, username or
  // deadline cookie fails verification and is treated as no session at all.
  const session = await getTrustedSession();

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid session." }, { status: 401 }),
    };
  }

  return {
    ok: true,
    authToken: session.authToken,
    role: session.role,
    username: session.username,
  };
}

export async function requireAuthToken() {
  const session = await requireAuthSession();
  if (!session.ok) {
    return session;
  }

  return {
    ok: true as const,
    authToken: session.authToken,
    role: session.role,
    username: session.username,
  };
}

export async function requireAdminToken() {
  const session = await requireAuthToken();
  if (!session.ok) {
    return session;
  }

  if (session.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return {
    ok: true as const,
    authToken: session.authToken,
    role: session.role,
    username: session.username,
  };
}

/**
 * Rejects Knowledge Center requests when the deployment has not switched the
 * service on, so the `CONTROL_PANEL_ENABLED` flag is enforced on the API the
 * same way it is on the `/knowledge_center` pages. Answers 404 rather than 403:
 * with the service absent the endpoint does not meaningfully exist, and there is
 * no per-caller permission to explain.
 */
export function requireKnowledgeCenter() {
  if (!isKnowledgeCenterEnabled()) {
    return {
      ok: false as const,
      response: jsonError("Knowledge Center is not available.", 404),
    };
  }

  return { ok: true as const };
}

/**
 * Authorizes a request against a specific organization/collection: admins are
 * always allowed, everyone else must be a member of that organization (proven
 * by it appearing in their own token-scoped collection list) and the
 * collection must have `can_users_upload` enabled.
 */
export async function requireOrganizationAccess(authToken: string, organizationId: number) {
  if (await isAdminSession()) {
    return { ok: true as const };
  }

  const collectionsResult = await getCollections(authToken);
  if (collectionsResult.error) {
    return {
      ok: false as const,
      response: jsonError(collectionsResult.error, 502),
    };
  }

  const collection = collectionsResult.collections.find(
    (candidate) => candidate.id === organizationId,
  );

  if (!collection || !collection.can_users_upload) {
    return {
      ok: false as const,
      response: jsonError("Forbidden", 403),
    };
  }

  return { ok: true as const };
}

export async function parseJsonBody(
  request: Request,
): Promise<Record<string, unknown> | null> {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return null;
  }
  return body as Record<string, unknown>;
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}
