import "server-only";

import { requestBackendJson } from "./server-http";

type UserDailyLimit = {
  id: number;
  model_name: string;
  daily_input_token_limit: number | null;
  daily_output_token_limit: number | null;
  total_input_token_count: number;
  total_output_token_count: number;
};

type UserDailyLimitsResponse = {
  limits?: UserDailyLimit[];
};

function hasTrialLimit(limit: UserDailyLimit) {
  return (
    limit.daily_input_token_limit !== null ||
    limit.daily_output_token_limit !== null
  );
}

export async function isTrialDeployment(authToken: string): Promise<boolean> {
  const result = await requestBackendJson<UserDailyLimitsResponse>({
    path: "/v1/user-daily-limits",
    authToken,
  });

  if (!result.ok || !result.data || !Array.isArray(result.data.limits)) {
    return false;
  }

  return result.data.limits.some(hasTrialLimit);
}