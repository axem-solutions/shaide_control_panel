"use client";

import { useMemo, useState } from "react";
import { type Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers";
import ExportLogsDatePicker from "./DatePicker";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowGlyph from "@/app/components/server/ui/ArrowGlyph";
import FieldLabel from "@/app/components/server/ui/FieldLabel";
import RadioCard from "@/app/components/server/ui/RadioCard";
import { API_ROUTE_BASE } from "@/lib/api-route-base";

type ExportRangeOption = "1" | "7" | "30" | "custom";

const RANGE_OPTIONS: { value: ExportRangeOption; title: string; hint: string }[] = [
  { value: "1", title: "1 day", hint: "Since yesterday" },
  { value: "7", title: "7 days", hint: "Last week" },
  { value: "30", title: "30 days", hint: "Last month" },
  { value: "custom", title: "Custom", hint: "Pick a range" },
];

type ExportLogsPanelProps = {
  open: boolean;
  onClose: () => void;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function toDateInputValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export default function ExportLogsPanel({ open, onClose }: ExportLogsPanelProps) {
  const [rangeOption, setRangeOption] = useState<ExportRangeOption>("1");
  const [customStartDate, setCustomStartDate] = useState<Dayjs | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Dayjs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const dateRanges = useMemo(() => {
    const now = new Date();

    if (rangeOption === "custom") {
      if (!customStartDate || !customEndDate) {
        return null;
      }

      const startDateInput = customStartDate.format("YYYY-MM-DD");
      const endDateInput = customEndDate.format("YYYY-MM-DD");
      const start = new Date(`${startDateInput}T00:00:00`);
      const end = new Date(`${endDateInput}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return null;
      }

      return {
        displayStartDate: startDateInput,
        displayEndDate: endDateInput,
        requestStartDate: startDateInput,
        requestEndDate: toDateInputValue(addDays(end, 1)),
      };
    }

    const daysBack = Number(rangeOption);
    const displayStart = toDateInputValue(addDays(now, -daysBack));
    const displayEnd = toDateInputValue(now);
    return {
      displayStartDate: displayStart,
      displayEndDate: displayEnd,
      requestStartDate: displayStart,
      requestEndDate: toDateInputValue(addDays(now, 1)),
    };
  }, [customEndDate, customStartDate, rangeOption]);

  const handleDownload = async () => {
    if (!dateRanges) {
      setError("Please provide a valid date range.");
      return;
    }

    if (
      rangeOption === "custom" &&
      customStartDate &&
      customEndDate &&
      customEndDate.isBefore(customStartDate, "day")
    ) {
      setError("End date must be on or after start date.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const query = new URLSearchParams({
        start_date: dateRanges.requestStartDate,
        end_date: dateRanges.requestEndDate,
      });

      const response = await fetch(`${API_ROUTE_BASE}/export-logs?${query.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error || "Failed to export logs.");
        return;
      }

      const blob = await response.blob();
      const headerName = response.headers.get("Content-Disposition");
      const filenameMatch = headerName?.match(/filename="([^"]+)"/i);
      const filename = filenameMatch?.[1] || "logs-export.zip";

      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch {
      setError("Failed to export logs.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isProcessing ? undefined : onClose}
      disableScrollLock
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        Export logs
        <IconButton
          color="inherit"
          size="small"
          aria-label="Close"
          onClick={onClose}
          disabled={isProcessing}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          overflowY: "auto",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Select a time range, then download a zip file with logs.
        </Typography>

        <Box sx={{ display: "grid", gap: 1 }}>
          <FieldLabel>Time range</FieldLabel>
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {RANGE_OPTIONS.map((option) => (
              <RadioCard
                key={option.value}
                name="export-range"
                selected={rangeOption === option.value}
                onSelect={() => setRangeOption(option.value)}
                title={option.title}
                hint={option.hint}
              />
            ))}
          </Box>
        </Box>

        {rangeOption === "custom" && (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <ExportLogsDatePicker
                label="Start date"
                value={customStartDate}
                onChange={(value) => {
                  setCustomStartDate(value);
                  if (value && customEndDate && value.isAfter(customEndDate, "day")) {
                    setCustomEndDate(value);
                  }
                }}
              />
              <ExportLogsDatePicker
                label="End date"
                value={customEndDate}
                onChange={(value) => {
                  setCustomEndDate(value);
                  if (value && customStartDate && value.isBefore(customStartDate, "day")) {
                    setCustomStartDate(value);
                  }
                }}
              />
            </Stack>
          </LocalizationProvider>
        )}

        {rangeOption !== "custom" && dateRanges && (
          <Alert severity="info">
            Export range: {dateRanges.displayStartDate} – {dateRanges.displayEndDate}
          </Alert>
        )}

        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={isProcessing}>
          Close
        </Button>
        <Button variant="contained" onClick={handleDownload} disabled={isProcessing}>
          {isProcessing ? "Processing…" : "Download"}
          <ArrowGlyph />
        </Button>
      </DialogActions>
    </Dialog>
  );
}
