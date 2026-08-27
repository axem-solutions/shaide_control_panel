import "server-only";

import { getGrafanaBase } from "@/lib/api-base";

export type Dashboard = {
  uid: string;
  title: string;
  tags: string[];
  url: string;
};

export type DashboardsResponse = {
  dashboards: Dashboard[];
  error?: string;
};

function isDashboard(value: unknown): value is Dashboard {
  if (!value || typeof value !== "object") {
    return false;
  }
  const dashboard = value as Partial<Dashboard>;
  return (
    typeof dashboard.uid === "string" &&
    typeof dashboard.title === "string" &&
    typeof dashboard.url === "string" &&
    Array.isArray(dashboard.tags) &&
    dashboard.tags.every((tag) => typeof tag === "string")
  );
}

const MAX_LOGGED_BODY_LENGTH = 2000;

function truncate(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}… (truncated)` : text;
}

export async function getDashboards(): Promise<DashboardsResponse> {
  const base = getGrafanaBase();
  const url = `${base}/api/search?type=dash-db`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[fetch-dashboards] Grafana request failed", {
        url,
        method: "GET",
        status: response.status,
        statusText: response.statusText,
        responseBody: truncate(text, MAX_LOGGED_BODY_LENGTH),
      });
      return { dashboards: [], error: `Grafana error ${response.status}.` };
    }

    const rawBody = await response.text();
    const data = (() => {
      try {
        return JSON.parse(rawBody);
      } catch {
        return null;
      }
    })();

    if (!Array.isArray(data)) {
      console.error("[fetch-dashboards] Grafana returned a non-array response", {
        url,
        status: response.status,
        responseBody: truncate(rawBody, MAX_LOGGED_BODY_LENGTH),
      });
      return { dashboards: [], error: "Grafana returned an invalid response." };
    }

    return {
      dashboards: data.filter(isDashboard).map((dashboard) => ({
        uid: dashboard.uid,
        title: dashboard.title,
        tags: dashboard.tags,
        url: dashboard.url,
      })),
    };
  } catch (error) {
    console.error("[fetch-dashboards] Grafana request threw before a response was received", {
      url,
      method: "GET",
      error,
    });
    return { dashboards: [], error: "Unable to reach Grafana." };
  }
}
