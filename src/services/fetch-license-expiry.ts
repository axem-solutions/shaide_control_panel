import "server-only";

import { cookies } from "next/headers";
import { LICENSE_EXPIRY_COOKIE } from "@/lib/session-config";

export const runtime = "nodejs"; // ensure Node runtime
export const revalidate = 0; // always dynamic
export const dynamic = "force-dynamic";

export async function getLicenseExpiry(): Promise<string | undefined> {
  return (await cookies()).get(LICENSE_EXPIRY_COOKIE)?.value || undefined;
}
