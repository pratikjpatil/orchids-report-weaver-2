import { useState, useEffect, useCallback } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useConfig } from "@/contexts/ConfigContext";
import { FilterBuilder } from "./FilterBuilder";

interface FormulaBuilderProps {
  expression: string;
  variables: any;
  template: any;
  currentCellRowId?: string;
  currentCellColId?: string;
  onExpressionChange: (expression: string) => void;
  onVariablesChange: (variables: any) => void;
  formulaMode: boolean;
  onFormulaModeChange: (mode: boolean) => void;
}

export const FormulaBuilder = ({
  expression,
  variables,
  template,
  currentCellRowId,
  currentCellColId,
  onExpressionChange,
  onVariablesChange,
  formulaMode,
  onFormulaModeChange,
}: FormulaBuilderProps) => {
  const { tableConfigs, getSelectableColumns } = useConfig();
  const [showVariableDialog, setShowVariableDialog] = useState(false);
  const [newVarName, setNewVarName] = useState("");
  const [newVarType, setNewVarType] = useState("CELL_REF");
  const [newVarConfig, setNewVarConfig] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get current cell reference for self-reference check
  const currentCellRef = currentCellRowId && currentCellColId 
    ? `cell_${currentCellRowId}_${currentCellColId}` 
    : null;

  // Get all dynamic row IDs to prevent referencing them in formulas
  const dynamicRowIds: string[] = template.reportData.rows
    .filter((r: any) => r.rowType === "DYNAMIC")
    .map((r: any) => r.id as string);

  // Validate expression
  const validateExpression = useCallback(
    (expr: string) => {
      const errors: string[] = [];

      if (!expr.trim()) {
        return errors;
      }

      // Check for balanced parentheses
      let parenCount = 0;
      for (const char of expr) {
        if (char === "(") parenCount++;
        if (char === ")") parenCount--;
        if (parenCount < 0) {
          errors.push("Unbalanced parentheses: extra closing parenthesis");
          break;
        }
      }
      if (parenCount > 0) {
        errors.push("Unbalanced parentheses: missing closing parenthesis");
      }

      // Check for consecutive operators
      const operatorPattern = /[+\-*/]{2,}/;
      if (operatorPattern.test(expr.replace(/\s/g, ""))) {
        errors.push("Consecutive operators detected (e.g., ++ or --)");
      }

      // Check for operators at start/end (excluding parentheses and cell refs)
      const trimmed = expr.trim();
      if (/^[+*/]/.test(trimmed)) {
        errors.push("Expression cannot start with an operator (except -)");
      }
      if (/[+\-*/]$/.test(trimmed)) {
        errors.push("Expression cannot end with an operator");
      }

      // Check for undefined variables
      const knownVars = new Set(Object.keys(variables || {}));

      // Extract all cell references with the new format
      const cellPattern = /cell_R__[A-Za-z0-9_]+_C__[A-Za-z0-9_]+/g;
      const cellRefs: string[] = expr.match(cellPattern) || [];

      // Check for self-reference
      if (currentCellRef && cellRefs.indexOf(currentCellRef) !== -1) {
        errors.push("Cannot reference the current cell in its own formula (circular reference)");
      }

      // Validate cell references exist in template and are not dynamic rows
      cellRefs.forEach((ref) => {
        const match = ref.match(/cell_(R__[A-Za-z0-9_]+)_(C__[A-Za-z0-9_]+)/);
        if (match) {
          const [, rowId, colId] = match;
          const row = template.reportData.rows.find((r: any) => r.id === rowId);
          const colExists = template.reportData.columns.some((c: any) => c.id === colId);

          if (!row) {
            errors.push(`Invalid cell reference: Row "${rowId}" does not exist`);
          } else if (row.rowType === "DYNAMIC") {
            errors.push(`Cannot reference dynamic row "${rowId}" in formula. Dynamic rows generate multiple rows at runtime.`);
          }
          if (!colExists) {
            errors.push(`Invalid cell reference: Column "${colId}" does not exist`);
          }
        }
      });

      // Check for variables that are not defined
      const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
      let varMatch;
      while ((varMatch = variablePattern.exec(expr)) !== null) {
        const varName = varMatch[1];
        // Skip if it's a cell reference part or known variable
        if (!varName.startsWith("cell_") && !varName.startsWith("R__") && !varName.startsWith("C__") && !knownVars.has(varName)) {
          // Check if it's not part of a cell reference
          const context = expr.substring(Math.max(0, varMatch.index - 5), varMatch.index + varName.length + 5);
          if (!context.includes("cell_") && !context.includes("_C__")) {
            errors.push(`Undefined variable: "${varName}"`);
          }
        }
      }

      return errors;
    },
    [template, variables, currentCellRef, dynamicRowIds]
  );

  useEffect(() => {
    const errors = validateExpression(expression);
    setValidationErrors(errors);
  }, [expression, validateExpression]);

  useEffect(() => {
    const handleCellSelected = (event: any) => {
      const cellRef = event.detail;
      
      // Check if this is a self-reference
      if (currentCellRef && cellRef === currentCellRef) {
        setValidationErrors(prev => [...new Set([...prev, "Cannot reference the current cell in its own formula"])]);
        return;
      }

      // Check if this is a dynamic row reference
      const match = cellRef.match(/cell_(R__[A-Za-z0-9_]+)_(C__[A-Za-z0-9_]+)/);
      if (match) {
        const [, rowId] = match;
        const row = template.reportData.rows.find((r: any) => r.id === rowId);
        if (row?.rowType === "DYNAMIC") {
          setValidationErrors(prev => [...new Set([...prev, `Cannot reference dynamic row "${rowId}" in formula`])]);
          return;
        }
      }

      // Add operator if expression doesn't end with one and isn't empty
      const trimmedExpr = expression.trim();
      if (trimmedExpr && !trimmedExpr.match(/[+\-*/(\s]$/)) {
        onExpressionChange(expression + " + " + cellRef);
      } else {
        onExpressionChange(
          expression +
            (expression && !expression.endsWith(" ") ? " " : "") +
            cellRef
        );
      }
    };

    window.addEventListener("formula-cell-selected", handleCellSelected);
    return () =>
      window.removeEventListener("formula-cell-selected", handleCellSelected);
  }, [expression, onExpressionChange, currentCellRef, template.reportData.rows]);

  const addOperator = (op: string) => {
    onExpressionChange(expression + ` ${op} `);
  };

  const toggleFormulaMode = () => {
    onFormulaModeChange(!formulaMode);
  };

  const addVariable = () => {
    setNewVarName("");
    setNewVarType("CELL_REF");
    setNewVarConfig({});
    setShowVariableDialog(true);
  };

  const saveVariable = () => {
    if (!newVarName) return;

    const newVariables = { ...variables };

    if (newVarType === "CELL_REF") {
      newVariables[newVarName] = "CELL_REF";
    } else {
      newVariables[newVarName] = {
        type: newVarType,
        table: newVarConfig.table || "",
        column: newVarConfig.column || "",
        filters: newVarConfig.filters || {},
      };
    }

    onVariablesChange(newVariables);

    // Add with operator if needed
    const trimmedExpr = expression.trim();
    if (trimmedExpr && !trimmedExpr.match(/[+\-*/(\s]$/)) {
      onExpressionChange(expression + " + " + newVarName);
    } else {
      onExpressionChange(
        expression +
          (expression && !expression.endsWith(" ") ? " " : "") +
          newVarName
      );
    }

    setShowVariableDialog(false);
    setNewVarName("");
    setNewVarType("CELL_REF");
    setNewVarConfig({});
  };

  const removeVariable = (varName: string) => {
    const newVariables = { ...variables };
    delete newVariables[varName];
    onVariablesChange(newVariables);

    // Remove variable from expression and clean up orphaned operators
    let newExpr = expression;

    // Remove the variable
    newExpr = newExpr.replace(new RegExp(`\\b${varName}\\b`, "g"), "");

    // Clean up double operators and spaces
    newExpr = newExpr
      .replace(/\s*[+\-*/]\s*[+\-*/]\s*/g, " + ")
      .replace(/^\s*[+\-*/]\s*/, "")
      .replace(/\s*[+\-*/]\s*$/, "")
      .replace(/\s+/g, " ")
      .trim();

    onExpressionChange(newExpr);
  };

  const selectableColumns = newVarConfig.table
    ? getSelectableColumns(newVarConfig.table)
    : [];

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: "block" }}
        >
          EXPRESSION
        </Typography>
        <TextField
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder="e.g., cell_R__R1_C__C1 + variable1"
          size="small"
          fullWidth
          multiline
          rows={2}
          error={validationErrors.length > 0}
          sx={{ fontFamily: "monospace" }}
        />
        {validationErrors.length > 0 && (
          <Alert severity="error" sx={{ mt: 1, py: 0 }}>
            <Typography variant="caption">
              {validationErrors.map((err, i) => (
                <span key={i}>
                  {err}
                  {i < validationErrors.length - 1 && <br />}
                </span>
              ))}
            </Typography>
          </Alert>
        )}
      </Box>

      <Box>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: "block" }}
        >
          OPERATORS
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          {["+", "-", "*", "/", "(", ")"].map((op) => (
            <Button
              key={op}
              variant="outlined"
              size="small"
              onClick={() => addOperator(op)}
              sx={{ minWidth: 40 }}
            >
              {op}
            </Button>
          ))}
        </Box>
      </Box>

      <Box>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: "block" }}
        >
          INSERT
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
          <Button
            variant={formulaMode ? "contained" : "outlined"}
            size="small"
            onClick={toggleFormulaMode}
            sx={{
              bgcolor: formulaMode ? "#ff9800" : undefined,
              color: formulaMode ? "white" : undefined,
              "&:hover": {
                bgcolor: formulaMode ? "#f57c00" : undefined,
              },
            }}
          >
            {formulaMode
              ? "Click cells to add (Active)"
              : "Select Cell from Canvas"}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={addVariable}
          >
            Variable
          </Button>
        </Box>
        {formulaMode && (
          <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
            <Typography variant="caption">
              Click on cells in the canvas to add them to the formula. 
              Dynamic rows and the current cell cannot be selected.
            </Typography>
          </Alert>
        )}
      </Box>

      <Box>
        <Typography
          variant="caption"
          fontWeight={600}
          sx={{ mb: 1, display: "block" }}
        >
          VARIABLES ({Object.keys(variables || {}).length})
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {Object.entries(variables || {}).map(
            ([name, config]: [string, any]) => (
              <Box
                key={name}
                sx={{
                  p: 1,
                  bgcolor: "background.paper",
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box>
                  <Chip
                    label={name}
                    size="small"
                    color="primary"
                    sx={{ mb: 0.5 }}
                  />
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                  >
                    {config === "CELL_REF"
                      ? "Cell Reference"
                      : `${config.type} from ${config.table}.${config.column}`}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => removeVariable(name)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )
          )}
        </Box>
      </Box>

      <Dialog
        open={showVariableDialog}
        onClose={() => setShowVariableDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Variable</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="Variable Name"
              value={newVarName}
              onChange={(e) =>
                setNewVarName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))
              }
              placeholder="e.g., maxBalance"
              size="small"
              fullWidth
              helperText="Only letters, numbers, and underscores"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Variable Type</InputLabel>
              <Select
                value={newVarType}
                onChange={(e) => setNewVarType(e.target.value)}
                label="Variable Type"
              >
                <MenuItem value="CELL_REF">Cell Reference</MenuItem>
                <MenuItem value="DB_VALUE">DB Value</MenuItem>
                <MenuItem value="DB_SUM">DB Sum</MenuItem>
                <MenuItem value="DB_COUNT">DB Count</MenuItem>
                <MenuItem value="DB_AVG">DB Average</MenuItem>
                <MenuItem value="DB_MIN">DB Min</MenuItem>
                <MenuItem value="DB_MAX">DB Max</MenuItem>
              </Select>
            </FormControl>

            {newVarType !== "CELL_REF" && (
              <>
                <Autocomplete
                  size="small"
                  options={tableConfigs.map((t) => t.tableName)}
                  value={newVarConfig.table || null}
                  onChange={(_, newValue) =>
                    setNewVarConfig({
                      ...newVarConfig,
                      table: newValue || "",
                      column: "",
                    })
                  }
                  getOptionLabel={(option) => {
                    const table = tableConfigs.find(
                      (t) => t.tableName === option
                    );
                    return table
                      ? `${table.tableName} (${table.label})`
                      : option;
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Table"
                      placeholder="Select table..."
                    />
                  )}
                  fullWidth
                />

                <Autocomplete
                  size="small"
                  options={selectableColumns}
                  value={newVarConfig.column || null}
                  onChange={(_, newValue) =>
                    setNewVarConfig({ ...newVarConfig, column: newValue || "" })
                  }
                  disabled={!newVarConfig.table}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Column"
                      placeholder={
                        newVarConfig.table
                          ? "Select column..."
                          : "Select table first"
                      }
                    />
                  )}
                  fullWidth
                />

                <FilterBuilder
                  filters={newVarConfig.filters || {}}
                  onFiltersChange={(filters) =>
                    setNewVarConfig({ ...newVarConfig, filters })
                  }
                  tableName={newVarConfig.table || ""}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVariableDialog(false)}>Cancel</Button>
          <Button
            onClick={saveVariable}
            variant="contained"
            disabled={!newVarName}
          >
            Add Variable
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
