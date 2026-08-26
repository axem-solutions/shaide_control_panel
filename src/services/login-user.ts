import "server-only";

import { isTrialDeployment } from "./fetch-user-daily-limits";
import { requestBackendJson } from "./server-http";

export const runtime = "nodejs"; // ensure Node runtime
export const revalidate = 0; // always dynamic
export const dynamic = "force-dynamic";

export type LoginResponse = {
	auth_token?: string;
	user_id?: number;
	is_admin?: boolean;
	is_trial?: boolean;
	expiry?: string;
	error?: string;
};

export async function loginUser(username: string): Promise<LoginResponse> {
	const result = await requestBackendJson<LoginResponse>({
		path: "/v1/login",
		method: "GET",
		authToken: username,
		missingAuthError: "License Key is required.",
	});

	if (!result.ok) {
		return {
			auth_token: "",
			error: "The provided License Key is not valid.",
		};
	}

	if (!result.data) {
		return {
			auth_token: "",
			error: "Backend returned empty response.",
		};
	}

	const authToken = result.data.auth_token || username;
	const trialDeployment = await isTrialDeployment(authToken);

	return {
		...result.data,
		is_trial: trialDeployment,
	};
}
