import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { redirect } from "next/navigation";
import AdminOnly from "../components/server/AdminOnly";
import LogsPage from "./LogsPage";

export const metadata: Metadata = { title: "Logs" };

export default async function Page() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/");
  }

  return (
    <AdminOnly>
      <LogsPage />
    </AdminOnly>
  );
}
