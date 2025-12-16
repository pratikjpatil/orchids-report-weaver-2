import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";

interface AddRowDialogProps {
  open: boolean;
  rowType: string;
  existingRowIds: string[];
  onClose: () => void;
  onConfirm: (rowId: string) => void;
}

export const AddRowDialog = ({
  open,
  rowType,
  existingRowIds,
  onClose,
  onConfirm,
}: AddRowDialogProps) => {
  const [customId, setCustomId] = useState("");
  const [error, setError] = useState("");

  const generateDefaultId = () => `R__${Date.now()}`;

  const validateId = (id: string): string | null => {
    if (!id.trim()) return null; // Empty is OK, will use default

    // Check for spaces
    if (/\s/.test(id)) {
      return "Row ID cannot contain spaces";
    }

    // Check for special characters (only allow alphanumeric and underscore)
    if (!/^R__[a-zA-Z0-9]+$/.test(id)) {
      return "Row ID can only contain letters and numbers";
    }

    // Check for duplicates
    if (existingRowIds.includes(id)) {
      return "This Row ID already exists";
    }

    return null;
  };

  const handleIdChange = (value: string) => {
    setCustomId(value);
    const validationError = validateId("R__" + value);
    setError(validationError || "");
  };

  const handleConfirm = () => {
    const finalId = "R__"+customId.trim() || generateDefaultId();
    const validationError = validateId("R__"+customId);

    if (customId.trim() && validationError) {
      setError(validationError);
      return;
    }

    onConfirm(finalId);
    setCustomId("");
    setError("");
  };

  const handleClose = () => {
    setCustomId("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add {rowType} Row</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Enter a custom Row ID or leave empty for auto-generated ID.
          </Typography>

          <TextField
            label="Row ID (optional)"
            value={customId}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="e.g., header1, data_row, total"
            error={!!error}
            helperText={
              error || "Only letters, numbers, and underscores allowed"
            }
            fullWidth
            autoFocus
          />

          {!customId.trim() && (
            <Alert severity="info" sx={{ py: 0.5 }}>
              A unique ID will be auto-generated if left empty
            </Alert>
          )}

          {customId.trim() && !error && (
            <Alert severity="success" sx={{ py: 0.5 }}>
              Row will be created with ID: <strong>{customId}</strong>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!!error}>
          Add Row
        </Button>
      </DialogActions>
    </Dialog>
  );
};
