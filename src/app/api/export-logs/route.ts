import JSZip from "jszip";
import { NextResponse } from "next/server";
import { requireAdminToken } from "../_utils";
import { requestBackendJson } from "@/services/server-http";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ExportLogsResponse = {
  error?: string;
};

type LogFile = {
  file_name: string;
  content: string;
};

type ServerLogsResponse = {
  log_files: LogFile[];
};

function isValidDateInput(value: string | null): value is string {
  return Boolean(value && DATE_PATTERN.test(value));
}

function buildFileNamePart(value: string) {
  return value.replace(/[^0-9-]/g, "");
}

function formatPreviousDay(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const auth = await requireAdminToken();
  if (!auth.ok) {
    return auth.response;
  }

  const { searchParams } = new URL(request.url);
  const rawStartDate = searchParams.get("start_date");
  const rawEndDate = searchParams.get("end_date");

  if (!isValidDateInput(rawStartDate) || !isValidDateInput(rawEndDate)) {
    return NextResponse.json(
      { error: "start_date and end_date must be in YYYY-MM-DD format." },
      { status: 400 },
    );
  }

  const startDate = rawStartDate;
  const endDate = rawEndDate;

  const commonQuery = `start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(
    endDate,
  )}`;

  const [modelDailyUsageResult, apiUsageStatisticsResult, serverLogsResult] = await Promise.all([
    requestBackendJson<ExportLogsResponse>({
      path: `/v1/statistics/model-daily-usage?${commonQuery}`,
      authToken: auth.authToken,
    }),
    requestBackendJson<ExportLogsResponse>({
      path: `/v1/statistics/api-usage-statistics?${commonQuery}`,
      authToken: auth.authToken,
    }),
    requestBackendJson<ServerLogsResponse>({
      path: `/v1/logs?${commonQuery}`,
      authToken: auth.authToken,
    }),
  ]);

  if (!modelDailyUsageResult.ok) {
    return NextResponse.json(
      { error: modelDailyUsageResult.error },
      { status: modelDailyUsageResult.status ?? 502 },
    );
  }

  if (!apiUsageStatisticsResult.ok) {
    return NextResponse.json(
      { error: apiUsageStatisticsResult.error },
      { status: apiUsageStatisticsResult.status ?? 502 },
    );
  }

  if (!serverLogsResult.ok) {
    return NextResponse.json(
      { error: serverLogsResult.error },
      { status: serverLogsResult.status ?? 502 },
    );
  }

  const zip = new JSZip();
  zip.file(
    "model-daily-usage.json",
    `${JSON.stringify(modelDailyUsageResult.data ?? {}, null, 2)}\n`,
  );
  zip.file(
    "api-usage-statistics.json",
    `${JSON.stringify(apiUsageStatisticsResult.data ?? {}, null, 2)}\n`,
  );

  const logsFolder = zip.folder("server-logs");
  for (const logFile of serverLogsResult.data?.log_files ?? []) {
    logsFolder!.file(logFile.file_name, logFile.content);
  }

  const archive = await zip.generateAsync({ type: "arraybuffer" });
  const startPart = buildFileNamePart(startDate);
  const endPart = buildFileNamePart(formatPreviousDay(endDate));
  const fileName =
    startDate === endDate
      ? `logs-${startPart}.zip`
      : `logs-${startPart}-to-${endPart}.zip`;

  return new NextResponse(archive, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
