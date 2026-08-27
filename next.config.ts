import type { NextConfig } from "next";
import { CONTROL_PANEL_BASE_PATH } from "./src/lib/api-route-base";

const nextConfig: NextConfig = {
  output: 'standalone',
  devIndicators: false,
  basePath: CONTROL_PANEL_BASE_PATH,
  async headers() {
    return [
      {
        source: "/((?!grafana/).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
