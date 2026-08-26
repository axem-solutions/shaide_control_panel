import UsersTablePanel from "./UsersTablePanel";
import { getUsers } from "../../services/fetch-users";
import { getCollections } from "../../services/fetch-collections";
import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import { Box, Alert } from "@mui/material";

export default async function Page() {
  const data = await getUsers();
  const adminToken = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value ?? "";
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
    isCurrentAdmin: adminToken !== "" && user.auth_token === adminToken,
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
