import { getTrustedSession } from "@/lib/session-signature";
import { getLicenseExpiry } from "@/services/fetch-license-expiry";
import PageHeader, { type PageHeaderProps } from "../client/ClientPageHeader";

type ServerPageHeaderProps = Omit<
  PageHeaderProps,
  "isAdmin" | "licenseExpiresAt" | "username"
>;

export default async function ServerPageHeader(props: ServerPageHeaderProps) {
  const session = await getTrustedSession();
  const licenseExpiresAt = await getLicenseExpiry();

  return (
    <PageHeader
      {...props}
      isAdmin={session?.role === "admin"}
      username={session?.username}
      licenseExpiresAt={licenseExpiresAt}
    />
  );
}
