"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { Cancel, CheckCircle, Delete, Warning } from "@mui/icons-material";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "error" | "warning" | "primary" | "success";
  confirmIcon?: React.ReactNode;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

const defaultIcons: Record<string, React.ReactNode> = {
  error:   <Delete />,
  warning: <Warning />,
  primary: <CheckCircle />,
  success: <CheckCircle />,
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmColor = "error",
  confirmIcon,
  onConfirm,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      disableScrollLock
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            p: 2,
            maxWidth: 480,
            width: "100%",
            backgroundColor: "background.paper",
            boxShadow: "0px 8px 32px rgba(0, 0, 0, 0.18)",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.25rem",
          color: "text.primary",
          textAlign: "center",
          pb: 0,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ textAlign: "center", my: 1.5 }}>
          <DialogContentText
            sx={{
              fontSize: "0.95rem",
              color: "text.secondary",
              lineHeight: 1.7,
            }}
          >
            {message}
          </DialogContentText>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 2,
          pb: 2,
          px: 3,
        }}
      >
        <Button
          onClick={onCancel}
          variant="outlined"
          disabled={loading}
          startIcon={<Cancel />}
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            px: 3,
            py: 0.75,
            borderColor: "divider",
            color: "text.secondary",
            "&:hover": { borderColor: "text.primary", color: "text.primary" },
          }}
        >
          {cancelLabel}
        </Button>

        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmColor}
          disabled={loading}
          startIcon={
            loading
              ? <CircularProgress size={18} color="inherit" />
              : (confirmIcon ?? defaultIcons[confirmColor])
          }
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            px: 3,
            py: 0.75,
          }}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
