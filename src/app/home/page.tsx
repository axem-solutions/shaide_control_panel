import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SectionPageLayout from "../components/server/SectionPageLayout";
import HomePage from "./HomePage";

export const metadata: Metadata = { title: "Control Panel | Home" };

export default async function Page() {
  const token = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/");
  }

  return (
    <SectionPageLayout title="Control Panel" disableLogoLink>
      <HomePage />
    </SectionPageLayout>
  );
}
