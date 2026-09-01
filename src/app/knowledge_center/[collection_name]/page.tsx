import CollectionPage from "./CollectionPage";
import CollectionNotFound from "./CollectionNotFound";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { getTrustedSession } from "@/lib/session-signature";
import { redirect } from "next/navigation";
import { Box } from "@mui/material";
import CollectionBreadcrumb from "../CollectionBreadcrumb";
import { getCollections } from "../../../services/fetch-collections";
import { getUsers } from "../../../services/fetch-users";
import { getCollectionDescription } from "@/lib/collection-labels";
import { findCollectionByName } from "@/lib/collection-utils";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Knowledge Center" };

type PageProps = {
  params: Promise<{ collection_name: string }>;
};

export default async function Page({ params }: PageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const username = (await getTrustedSession())?.username;
  if (!token) {
    redirect("/");
  }

  const { collection_name } = await params;
  const name = decodeURIComponent(collection_name);
  const isAdmin = (await getTrustedSession())?.role === "admin";
  const [collectionsResponse, usersResponse] = await Promise.all([
    getCollections(token ?? ""),
    isAdmin ? getUsers() : Promise.resolve({ users: [], error: undefined }),
  ]);
  const collections = collectionsResponse.error ? [] : collectionsResponse.collections;
  const selectedCollection = findCollectionByName(collections, name);

  if (!selectedCollection) {
    return <CollectionNotFound name={name} />;
  }

  const description = getCollectionDescription(selectedCollection.description);
  const users = usersResponse.users ?? [];
  const usersError = usersResponse.error;

  return (
    <Box>
      <Box sx={{ pb: 3 }}>
        <CollectionBreadcrumb
          collections={collections.map((collection) => collection.name)}
          currentName={name}
        />
      </Box>
      <Box>
        <CollectionPage
          name={name}
          description={description}
          collectionId={selectedCollection?.id}
          collectionFiles={selectedCollection?.files ?? []}
          canUsersUpload={selectedCollection?.can_users_upload ?? false}
          collectionUserIds={selectedCollection?.users ?? []}
          updatedAt={selectedCollection?.updated_at}
          isAdmin={isAdmin}
          users={users}
          usersError={usersError}
          currentUsername={username}
          existingCollectionNames={collections.map((c) => c.name)}
        />
      </Box>
    </Box>
  );
}
