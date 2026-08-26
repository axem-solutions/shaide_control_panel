import type { Metadata } from "next";
import AdminOnly from "../components/server/AdminOnly";
import UsersPage from "./UsersPage";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Users" };

export default async function Page() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/");
  }

  return (
    <AdminOnly>
      <UsersPage />
    </AdminOnly>
  );
}
