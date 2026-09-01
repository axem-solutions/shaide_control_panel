import UsersTablePanel from "./UsersTablePanel";
import { getUsers } from "../../services/fetch-users";
import { getCollections } from "../../services/fetch-collections";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { getTrustedSession } from "@/lib/session-signature";
import { Box, Alert } from "@mui/material";

export default async function Page() {
  const data = await getUsers();
  const cookieStore = await cookies();
  const adminToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value ?? "";
  const currentUsername = (await getTrustedSession())?.username ?? "";
  const collectionsData = adminToken
    ? await getCollections(adminToken)
    : { collections: [], error: "Missing admin token for collection membership lookup." };

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
      <UsersTablePanel users={users} />
    </Box>
  );
}
