import "server-only";

import { cookies } from "next/headers";
import { AUTH_TOKEN_COOKIE } from "@/lib/session-config";
import type { User } from "@/lib/user-types";
import { requestBackendJson } from "./server-http";

export const runtime = 'nodejs';   // ensure Node runtime
export const revalidate = 0;       // always dynamic
export const dynamic = 'force-dynamic';

export type UsersResponse = { users: User[]; error?: string };

type License = { auth_token: string; expires_at: string };

type RawUsersResponse = {
  users: User[];
  licenses?: License[];
  error?: string;
};

export async function getUsers(): Promise<UsersResponse> {
  const bearerToken = (await cookies()).get(AUTH_TOKEN_COOKIE)?.value;

  const result = await requestBackendJson<RawUsersResponse>({
    path: "/v1/users",
    authToken: bearerToken,
  });

  if (!result.ok) {
    return { users: [], error: result.error };
  }

  if (!result.data || !Array.isArray(result.data.users)) {
    return { users: [], error: "Backend returned invalid response." };
  }

  const expiresAtByAuthToken = new Map(
    (result.data.licenses ?? []).map((license) => [license.auth_token, license.expires_at]),
  );

  return {
    users: result.data.users.map((user) => ({
      ...user,
      expires_at: expiresAtByAuthToken.get(user.auth_token) ?? user.expires_at,
    })),
  };
}
