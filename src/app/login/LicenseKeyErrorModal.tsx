"use client";

import CloseIcon from "@mui/icons-material/Close";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

type LicenseKeyErrorModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
};

export default function LicenseKeyErrorModal({
  open,
  onClose,
  title = "Invalid License Key",
  description = "The provided License Key is not valid.",
}: LicenseKeyErrorModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <WarningAmberIcon sx={{ fontSize: 22, color: "var(--ax-magenta)" }} />
          <Box component="span" sx={{ minWidth: 0 }}>
            {title}
          </Box>
        </Box>
        <IconButton color="inherit" size="small" aria-label="Close" onClick={onClose}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
}
