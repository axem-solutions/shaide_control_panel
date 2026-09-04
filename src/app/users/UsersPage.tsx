import UsersTablePanel from "./UsersTablePanel";
import { getUsers } from "../../services/fetch-users";
import { getCollections, type CollectionsResponse } from "../../services/fetch-collections";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { isKnowledgeCenterEnabled } from "@/lib/feature-flags";
import { getTrustedSession } from "@/lib/session-signature";
import { Box, Alert } from "@mui/material";

/**
 * Collection memberships only feed the Knowledge Center column, so the lookup is
 * skipped entirely when the service is not part of this installation — otherwise
 * every Users page visit would call a backend that isn't there and surface its
 * warning.
 */
async function loadCollections(
  adminToken: string,
  knowledgeCenterEnabled: boolean,
): Promise<CollectionsResponse> {
  if (!knowledgeCenterEnabled) {
    return { collections: [] };
  }

  if (!adminToken) {
    return {
      collections: [],
      error: "Missing admin token for collection membership lookup.",
    };
  }

  return getCollections(adminToken);
}

export default async function Page() {
  const knowledgeCenterEnabled = isKnowledgeCenterEnabled();
  const data = await getUsers();
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? "";
  const currentUsername = (await getTrustedSession())?.username ?? "";
  // Skips the request entirely when the Knowledge Center is not installed.
  const collectionsData = await loadCollections(adminToken, knowledgeCenterEnabled);

  const membershipsByUserId = new Map<number, string[]>();
  for (const collection of collectionsData.collections) {
    for (const userId of collection.users) {
      const current = membershipsByUserId.get(userId) ?? [];
      membershipsByUserId.set(userId, [...current, collection.name]);
    }
  }

  const users = data.users.map((user) => ({
    ...user,
    isCurrentAdmin: currentUsername !== "" && user.username === currentUsername,
    collectionNames: membershipsByUserId.get(user.id) ?? [],
  }));

  const pageError = data.error || collectionsData.error;

  return (
    <Box sx={{ display: "grid", gap: 3 }}>
      {pageError && <Alert severity="warning">{pageError}</Alert>}
      <UsersTablePanel users={users} showCollections={knowledgeCenterEnabled} />
    </Box>
  );
}
