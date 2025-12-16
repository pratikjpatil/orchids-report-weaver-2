import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import SaveIcon from "@mui/icons-material/Save";
import DownloadIcon from "@mui/icons-material/Download";
import UploadIcon from "@mui/icons-material/Upload";
import TableChartIcon from "@mui/icons-material/TableChart";
import TuneIcon from "@mui/icons-material/Tune";

interface TopToolbarProps {
  onExport: () => void;
  onSave: () => void;
  onSaveVariants: () => void;
  onImport: () => void;
  reportName: string;
  saving?: boolean;
  templateSaved?: boolean;
  variantsCount?: number;
}

export const TopToolbar = ({
  onExport,
  onSave,
  onSaveVariants,
  onImport,
  reportName,
  saving = false,
  templateSaved = false,
  variantsCount = 0,
}: TopToolbarProps) => {
  return (
    <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: "1px solid #e0e0e0" }}>
      <Toolbar>
        <IconButton edge="start" color="primary" sx={{ mr: 2 }}>
          <TableChartIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
          {reportName || "Financial Report Builder"}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={onImport}
            size="small"
          >
            Import
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={onExport}
            size="small"
          >
            Export JSON
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={onSave}
            size="small"
            disabled={saving}
          >
            Save Template
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<TuneIcon />}
            onClick={onSaveVariants}
            size="small"
            disabled={saving || !templateSaved}
            title={!templateSaved ? "Save template first" : "Save variants"}
          >
            Save Variants
            {variantsCount > 0 && (
              <Chip
                label={variantsCount}
                size="small"
                sx={{ ml: 1, height: 20, fontSize: "0.7rem" }}
              />
            )}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
