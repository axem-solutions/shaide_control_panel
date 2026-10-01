import type { Metadata } from "next";
import { getTrustedSession } from "@/lib/session-signature";
import { getInstalledModels } from "@/services/fetch-models";
import { getPlatformModels } from "@/services/fetch-platform-models";
import AdminOnly from "../components/server/AdminOnly";
import ModelsPage from "./ModelsPage";

export const metadata: Metadata = { title: "Models" };

export default async function Page() {
  const session = await getTrustedSession();
  const [installed, platform] = session
    ? await Promise.all([getInstalledModels(session.authToken), getPlatformModels()])
    : [{ models: [], error: "Invalid session." }, { models: [] }];

  return (
    <AdminOnly>
      <ModelsPage
        initialInstalledModels={installed.models}
        platformModels={platform.models}
        initialError={installed.error}
        catalogError={platform.error}
      />
    </AdminOnly>
  );
}
