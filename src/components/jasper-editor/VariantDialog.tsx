import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsIcon from "@mui/icons-material/Settings";
import FilterListIcon from "@mui/icons-material/FilterList";

interface Param {
  paramName: string;
  label: string;
  paramType: "STRING" | "DATE" | "NUMBER" | "BOOLEAN";
  required: boolean;
  multiValued: boolean;
  uiHint: string;
}

interface FilterRule {
  scopeType: "ALL_DB" | "TABLE" | "DYNAMIC_TABLE";
  scopeValue?: string;
  paramName: string;
  dbColumn: string;
  operator: string;
}

interface Variant {
  variantCode: string;
  variantName: string;
  description: string;
  params: Param[];
  filterRules: FilterRule[];
}

interface VariantDialogProps {
  open: boolean;
  variant: Variant | null;
  tableNames: string[];
  dynamicRowIds: string[];
  onClose: () => void;
  onSave: (variant: Variant) => void;
}

const OPERATORS = ["=", "!=", ">", "<", ">=", "<=", "LIKE", "IN", "NOT IN", "IS NULL", "IS NOT NULL"];
const PARAM_TYPES = ["STRING", "DATE", "NUMBER", "BOOLEAN"];
const UI_HINTS = ["text", "date", "number", "select", "multiselect", "checkbox"];
const SCOPE_TYPES = ["ALL_DB", "TABLE", "DYNAMIC_TABLE"];

export const VariantDialog = ({
  open,
  variant,
  tableNames,
  dynamicRowIds,
  onClose,
  onSave,
}: VariantDialogProps) => {
  const [editedVariant, setEditedVariant] = useState<Variant>({
    variantCode: "",
    variantName: "",
    description: "",
    params: [],
    filterRules: [],
  });

  useEffect(() => {
    if (variant) {
      setEditedVariant({ ...variant });
    } else {
      setEditedVariant({
        variantCode: `VARIANT_${Date.now()}`,
        variantName: "New Variant",
        description: "",
        params: [],
        filterRules: [],
      });
    }
  }, [variant, open]);

  const updateField = (field: keyof Variant, value: any) => {
    setEditedVariant({ ...editedVariant, [field]: value });
  };

  const addParam = () => {
    setEditedVariant({
      ...editedVariant,
      params: [
        ...editedVariant.params,
        {
          paramName: `param_${Date.now()}`,
          label: "New Parameter",
          paramType: "STRING",
          required: true,
          multiValued: false,
          uiHint: "text",
        },
      ],
    });
  };

  const updateParam = (index: number, field: keyof Param, value: any) => {
    const newParams = [...editedVariant.params];
    newParams[index] = { ...newParams[index], [field]: value };
    setEditedVariant({ ...editedVariant, params: newParams });
  };

  const removeParam = (index: number) => {
    setEditedVariant({
      ...editedVariant,
      params: editedVariant.params.filter((_, i) => i !== index),
    });
  };

  const addFilterRule = () => {
    setEditedVariant({
      ...editedVariant,
      filterRules: [
        ...editedVariant.filterRules,
        {
          scopeType: "ALL_DB",
          paramName: "",
          dbColumn: "",
          operator: "=",
        },
      ],
    });
  };

  const updateFilterRule = (index: number, field: keyof FilterRule, value: any) => {
    const newRules = [...editedVariant.filterRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setEditedVariant({ ...editedVariant, filterRules: newRules });
  };

  const removeFilterRule = (index: number) => {
    setEditedVariant({
      ...editedVariant,
      filterRules: editedVariant.filterRules.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    onSave(editedVariant);
    onClose();
  };

  const isValid = editedVariant.variantCode.trim() && editedVariant.variantName.trim();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {variant ? "Edit Variant" : "Add New Variant"}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Basic Info */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <TextField
              label="Variant Code"
              value={editedVariant.variantCode}
              onChange={(e) => updateField("variantCode", e.target.value.replace(/\s/g, "_").toUpperCase())}
              size="small"
              required
              helperText="Unique identifier (no spaces)"
            />
            <TextField
              label="Variant Name"
              value={editedVariant.variantName}
              onChange={(e) => updateField("variantName", e.target.value)}
              size="small"
              required
            />
          </Box>
          <TextField
            label="Description"
            value={editedVariant.description}
            onChange={(e) => updateField("description", e.target.value)}
            size="small"
            multiline
            rows={2}
            fullWidth
          />

          <Divider />

          {/* Parameters Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <SettingsIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Parameters ({editedVariant.params.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addParam}
                >
                  Add Parameter
                </Button>

                {editedVariant.params.map((param, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Chip
                        label={param.paramName}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <IconButton size="small" onClick={() => removeParam(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <TextField
                        label="Param Name"
                        size="small"
                        value={param.paramName}
                        onChange={(e) => updateParam(index, "paramName", e.target.value.replace(/\s/g, ""))}
                        fullWidth
                      />
                      <TextField
                        label="Label"
                        size="small"
                        value={param.label}
                        onChange={(e) => updateParam(index, "label", e.target.value)}
                        fullWidth
                      />
                      <FormControl size="small" fullWidth>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={param.paramType}
                          onChange={(e) => updateParam(index, "paramType", e.target.value)}
                          label="Type"
                        >
                          {PARAM_TYPES.map((t) => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" fullWidth>
                        <InputLabel>UI Hint</InputLabel>
                        <Select
                          value={param.uiHint}
                          onChange={(e) => updateParam(index, "uiHint", e.target.value)}
                          label="UI Hint"
                        >
                          {UI_HINTS.map((h) => (
                            <MenuItem key={h} value={h}>{h}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={param.required}
                            onChange={(e) => updateParam(index, "required", e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Required</Typography>}
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={param.multiValued}
                            onChange={(e) => updateParam(index, "multiValued", e.target.checked)}
                            size="small"
                          />
                        }
                        label={<Typography variant="body2">Multi-valued</Typography>}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Filter Rules Section */}
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FilterListIcon fontSize="small" />
                <Typography variant="subtitle2" fontWeight={600}>
                  Filter Rules ({editedVariant.filterRules.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={addFilterRule}
                >
                  Add Filter Rule
                </Button>

                {editedVariant.filterRules.map((rule, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      bgcolor: "#fafafa",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Chip
                        label={rule.scopeType}
                        size="small"
                        color={
                          rule.scopeType === "ALL_DB"
                            ? "success"
                            : rule.scopeType === "TABLE"
                            ? "primary"
                            : "warning"
                        }
                        variant="outlined"
                      />
                      <IconButton size="small" onClick={() => removeFilterRule(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel>Scope Type</InputLabel>
                        <Select
                          value={rule.scopeType}
                          onChange={(e) => updateFilterRule(index, "scopeType", e.target.value)}
                          label="Scope Type"
                        >
                          {SCOPE_TYPES.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {rule.scopeType === "TABLE" && (
                        <FormControl size="small" fullWidth>
                          <InputLabel>Table</InputLabel>
                          <Select
                            value={rule.scopeValue || ""}
                            onChange={(e) => updateFilterRule(index, "scopeValue", e.target.value)}
                            label="Table"
                          >
                            {tableNames.map((t) => (
                              <MenuItem key={t} value={t}>{t}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {rule.scopeType === "DYNAMIC_TABLE" && (
                        <FormControl size="small" fullWidth>
                          <InputLabel>Dynamic Row</InputLabel>
                          <Select
                            value={rule.scopeValue || ""}
                            onChange={(e) => updateFilterRule(index, "scopeValue", e.target.value)}
                            label="Dynamic Row"
                          >
                            {dynamicRowIds.map((id) => (
                              <MenuItem key={id} value={id}>{id}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {rule.scopeType === "ALL_DB" && <Box />}

                      <FormControl size="small" fullWidth>
                        <InputLabel>Parameter</InputLabel>
                        <Select
                          value={rule.paramName}
                          onChange={(e) => updateFilterRule(index, "paramName", e.target.value)}
                          label="Parameter"
                        >
                          {editedVariant.params.map((p) => (
                            <MenuItem key={p.paramName} value={p.paramName}>
                              {p.paramName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        label="DB Column"
                        size="small"
                        value={rule.dbColumn}
                        onChange={(e) => updateFilterRule(index, "dbColumn", e.target.value.toUpperCase())}
                        fullWidth
                      />

                      <FormControl size="small" fullWidth>
                        <InputLabel>Operator</InputLabel>
                        <Select
                          value={rule.operator}
                          onChange={(e) => updateFilterRule(index, "operator", e.target.value)}
                          label="Operator"
                        >
                          {OPERATORS.map((op) => (
                            <MenuItem key={op} value={op}>{op}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!isValid}>
          {variant ? "Save Changes" : "Add Variant"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
