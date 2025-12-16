import { useState, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface ImportTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: { template: any; variants: any[] }) => void;
}

export const ImportTemplateDialog = ({
  open,
  onClose,
  onImport,
}: ImportTemplateDialogProps) => {
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setJsonText(text);
      validateAndParse(text);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (text: string) => {
    setError(null);
    setParsedData(null);

    if (!text.trim()) {
      setError("Please provide JSON content");
      return;
    }

    try {
      const data = JSON.parse(text);

      // Check for required structure
      if (!data.template && !data.templateMeta) {
        setError("Invalid format: Missing template data");
        return;
      }

      // Handle both formats: { template: {...}, variants: [...] } or direct template object
      let template = data.template || data;
      let variants = data.variants || [];

      // Validate template structure
      if (!template.templateMeta || !template.reportMeta || !template.reportData) {
        setError("Invalid template: Missing required sections (templateMeta, reportMeta, reportData)");
        return;
      }

      if (!template.reportData.columns || !template.reportData.rows) {
        setError("Invalid template: Missing columns or rows in reportData");
        return;
      }

      setParsedData({ template, variants });
    } catch (e) {
      setError(`JSON parse error: ${(e as Error).message}`);
    }
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    if (text.trim()) {
      validateAndParse(text);
    } else {
      setError(null);
      setParsedData(null);
    }
  };

  const handleImport = () => {
    if (parsedData) {
      onImport(parsedData);
      setJsonText("");
      setError(null);
      setParsedData(null);
      onClose();
    }
  };

  const handleClose = () => {
    setJsonText("");
    setError(null);
    setParsedData(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Template</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main", bgcolor: "#f5f5f5" },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <CloudUploadIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Click to upload JSON file
            </Typography>
            <Typography variant="caption" color="text.disabled">
              or paste JSON content below
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary">
            OR paste template JSON directly:
          </Typography>

          <TextField
            multiline
            rows={12}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{"template": {...}, "variants": [...]}'
            sx={{
              fontFamily: "monospace",
              fontSize: "0.85rem",
              "& .MuiInputBase-input": { fontFamily: "monospace" },
            }}
            fullWidth
          />

          {error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {error}
            </Alert>
          )}

          {parsedData && (
            <Alert severity="success" sx={{ mt: 1 }}>
              Valid template detected:
              <br />
              • Template: {parsedData.template.reportMeta?.reportName || parsedData.template.templateMeta?.templateId}
              <br />
              • Columns: {parsedData.template.reportData?.columns?.length || 0}
              <br />
              • Rows: {parsedData.template.reportData?.rows?.length || 0}
              <br />
              • Variants: {parsedData.variants?.length || 0}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={!parsedData}
        >
          Import Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};
