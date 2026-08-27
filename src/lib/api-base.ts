import "server-only";

import { existsSync } from "node:fs";

function isRunningInDocker() {
  return existsSync("/.dockerenv");
}

export function getApiBase(): string {
  const serverFqdn =
    process.env.SHAIDE_SERVER_FQDN ??
    (isRunningInDocker() ? "host.docker.internal" : "localhost");
  const serverPort = process.env.SHAIDE_SERVER_PORT ?? "8080";
  return `http://${serverFqdn}:${serverPort}`;
}

export function getGrafanaBase(): string {
  const grafanaFqdn = process.env.GRAFANA_FQDN ?? "grafana.monitoring.svc.cluster.local";
  const grafanaPort = process.env.GRAFANA_PORT ?? "80";
  return `http://${grafanaFqdn}:${grafanaPort}`;
}
