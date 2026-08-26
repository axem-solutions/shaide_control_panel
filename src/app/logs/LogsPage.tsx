import { Alert, Box } from "@mui/material";
import { getDashboards } from "@/services/fetch-dashboards";
import LogsPanel from "./LogsPanel";

export default async function LogsPage() {
  const { dashboards, error } = await getDashboards();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, gap: 2 }}>
      {error && <Alert severity="warning">{error}</Alert>}
      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <LogsPanel dashboards={dashboards} />
      </Box>
    </Box>
  );
}
