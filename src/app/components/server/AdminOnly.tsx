import type { ReactNode } from "react";
import { isAdminSession } from "@/lib/session-signature";
import { redirect } from "next/navigation";

/**
 * Admin status comes from the `role` returned by `POST /v1/login`, held in
 * `shaide_role` for the session.
 */
export default async function AdminOnly({ children }: { children: ReactNode }) {
  const isAdmin = await isAdminSession();

  if (!isAdmin) {
    redirect("/home");
  }

  return <>{children}</>;
}
