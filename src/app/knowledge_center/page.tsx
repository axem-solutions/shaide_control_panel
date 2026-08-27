import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE, IS_ADMIN_COOKIE } from "@/lib/session-config";
import { isKnowledgeCenterEnabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";
import { Box } from "@mui/material";
import CollectionsPage from "./CollectionsPage";
import CreateCollectionDialog from "./CreateCollectionDialog";
import GlobalSettingsDialog from "./GlobalSettingsDialog";
import EmptyState from "../components/server/ui/EmptyState";
import PageIntro from "../components/server/ui/PageIntro";
import Panel from "../components/server/ui/Panel";
import { getCollections } from "../../services/fetch-collections";
import { getUsers } from "../../services/fetch-users";

export const metadata: Metadata = { title: "Knowledge Center" };

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect("/");
  }
  if (!isKnowledgeCenterEnabled()) {
    redirect("/home");
  }

  const isAdmin = cookieStore.get(IS_ADMIN_COOKIE)?.value === "true";
  const [collectionsResponse, usersResponse] = await Promise.all([
    getCollections(token),
    isAdmin ? getUsers() : Promise.resolve({ users: [], error: undefined }),
  ]);
  const collectionNames = (collectionsResponse.collections ?? []).map((c) => c.name);
  const collections = collectionsResponse.collections ?? [];
  const collectionsError = collectionsResponse.error;
  const users = usersResponse.users ?? [];
  const usersError = usersResponse.error;
  const fallbackEmbeddingModelId =
    collections.length > 0 ? collections[0].embedding_model_id : undefined;

  const isEmptyNoError = !collectionsError && collections.length === 0;

  return (
    <Box>
      <PageIntro
        title="Collections"
        hideTitle
        subtitle={
          isAdmin ? "Organize documents and assign to users." : "Collections shared with you."
        }
        action={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            {!(isAdmin && isEmptyNoError) && (
              <CreateCollectionDialog
                isAdmin={isAdmin}
                users={users}
                usersError={usersError}
                currentAuthToken={token}
                existingCollectionNames={collectionNames}
                fallbackEmbeddingModelId={fallbackEmbeddingModelId}
              />
            )}
            {isAdmin && <GlobalSettingsDialog />}
          </Box>
        }
      />

      {/* Admin empty state: dashed hero panel */}
      {isAdmin && isEmptyNoError && (
        <Panel dashed padding={20}>
          <EmptyState
            title="No collections yet"
            description="Create your first collection to start assigning knowledge to your users."
            action={
              <CreateCollectionDialog
                isAdmin={isAdmin}
                users={users}
                usersError={usersError}
                currentAuthToken={token}
                existingCollectionNames={collectionNames}
                fallbackEmbeddingModelId={fallbackEmbeddingModelId}
              />
            }
          />
        </Panel>
      )}

      {/* Non-admin empty state */}
      {!isAdmin && isEmptyNoError && (
        <EmptyState
          title="No collections assigned"
          description="You don't have any collections assigned yet. Please contact your administrator to get access."
        />
      )}

      {/* Collections grid (shown when there are collections or an error) */}
      {!isEmptyNoError && (
        <CollectionsPage collections={collections} error={collectionsError} isAdmin={isAdmin} />
      )}
    </Box>
  );
}
