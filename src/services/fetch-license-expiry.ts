import "server-only";

import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { verifySession } from "./verify-session";

export const runtime = "nodejs"; // ensure Node runtime
export const revalidate = 0; // always dynamic
export const dynamic = "force-dynamic";

export async function getLicenseExpiry(): Promise<string | undefined> {
  const authToken = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!authToken) {
    return undefined;
  }

  const session = await verifySession(authToken);
  return session?.expiry;
}
