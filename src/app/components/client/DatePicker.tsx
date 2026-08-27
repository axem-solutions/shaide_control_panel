"use client";

import { type Dayjs } from "dayjs";
import { DatePicker } from "@mui/x-date-pickers";
import FieldLabel from "@/app/components/server/ui/FieldLabel";
import { Box } from "@mui/material";

type ExportLogsDatePickerProps = {
  label: string;
  value: Dayjs | null;
  onChange: (value: Dayjs | null) => void;
};

export default function ExportLogsDatePicker({
  label,
  value,
  onChange,
}: ExportLogsDatePickerProps) {
  return (
    <Box sx={{ display: "grid", gap: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      <DatePicker
        value={value}
        onChange={onChange}
        slotProps={{
          popper: { placement: "top-start" },
          desktopPaper: {
            sx: {
              "& .MuiDateCalendar-root": { height: 300 },
              "& .MuiPickersDay-root": { width: 30, height: 30 },
            },
          },
          textField: {
            fullWidth: true,
            inputProps: { "aria-label": label },
          },
        }}
      />
    </Box>
  );
}
