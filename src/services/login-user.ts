import "server-only";

import { type UserRole, parseRole } from "@/lib/session-config";
import { isTrialDeployment } from "./fetch-user-daily-limits";
import { requestBackendJson } from "./server-http";

export const runtime = "nodejs"; // ensure Node runtime
export const revalidate = 0; // always dynamic
export const dynamic = "force-dynamic";

/**
 * Shape of `POST /v1/login` (username + password -> bearer access token).
 *
 * `account_expires_at` is nullable — admin accounts typically have no expiry.
 */
type BackendLoginResponse = {
	access_token?: string;
	token_type?: string;
	/** Token lifetime in seconds. */
	token_expires_in?: number;
	/** "admin" or "user". */
	role?: string;
	account_expires_at?: string | null;
};

export type LoginResponse = {
	access_token?: string;
	token_type?: string;
	token_expires_in?: number;
	role?: UserRole;
	/** Account expiry, or `undefined` for accounts without one (e.g. admins). */
	account_expires_at?: string;
	is_trial?: boolean;
	error?: string;
};

export async function loginUser(
	username: string,
	password: string,
): Promise<LoginResponse> {
	const result = await requestBackendJson<BackendLoginResponse>({
		path: "/v1/login",
		method: "POST",
		allowUnauthenticated: true,
		body: { username, password },
	});

	if (!result.ok) {
		return {
			access_token: "",
			error:
				result.status === 401
					? "Invalid username or password."
					: "Unable to sign in. Please try again.",
		};
	}

	if (!result.data?.access_token) {
		return {
			access_token: "",
			error: "Backend returned an invalid login payload.",
		};
	}

	const { access_token, token_type, token_expires_in, account_expires_at } = result.data;
	const trialDeployment = await isTrialDeployment(access_token);

	return {
		access_token,
		token_type,
		token_expires_in,
		role: parseRole(result.data.role),
		account_expires_at: account_expires_at ?? undefined,
		is_trial: trialDeployment,
	};
}
