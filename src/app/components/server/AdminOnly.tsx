import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { redirect } from "next/navigation";
import { verifySession } from "@/services/verify-session";

export default async function AdminOnly({ children }: { children: ReactNode }) {
  const authToken = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  const session = authToken ? await verifySession(authToken) : null;

  if (!session?.is_admin) {
    redirect("/home");
  }

  return <>{children}</>;
}
