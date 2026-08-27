import { cookies } from "next/headers";
import { IS_ADMIN_COOKIE } from "@/lib/session-config";
import { getLicenseExpiry } from "@/services/fetch-license-expiry";
import PageHeader, { type PageHeaderProps } from "../client/ClientPageHeader";

type ServerPageHeaderProps = Omit<PageHeaderProps, "isAdmin" | "licenseExpiresAt">;

export default async function ServerPageHeader(props: ServerPageHeaderProps) {
  const isAdmin = (await cookies()).get(IS_ADMIN_COOKIE)?.value === "true";
  const licenseExpiresAt = await getLicenseExpiry();
  return <PageHeader {...props} isAdmin={isAdmin} licenseExpiresAt={licenseExpiresAt} />;
}
