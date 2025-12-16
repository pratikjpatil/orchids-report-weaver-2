import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Autocomplete from "@mui/material/Autocomplete";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useConfig } from "@/contexts/ConfigContext";

interface FilterCondition {
  column: string;
  operator: string;
  value: string | string[];
}

interface FilterBuilderProps {
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  tableName?: string;
}

const OPERATORS = [
  { value: "=", label: "Equals (=)" },
  { value: "!=", label: "Not Equals (≠)" },
  { value: ">", label: "Greater Than (>)" },
  { value: ">=", label: "Greater or Equal (≥)" },
  { value: "<", label: "Less Than (<)" },
  { value: "<=", label: "Less or Equal (≤)" },
  { value: "LIKE", label: "Contains (LIKE)" },
  { value: "IN", label: "In List (IN)" },
  { value: "NOT IN", label: "Not In List (NOT IN)" },
  { value: "IS NULL", label: "Is Empty (NULL)" },
  { value: "IS NOT NULL", label: "Is Not Empty (NOT NULL)" },
];

export const FilterBuilder = ({
  filters,
  onFiltersChange,
  tableName = "",
}: FilterBuilderProps) => {
  const { getFilterableColumns } = useConfig();
  const [newInValue, setNewInValue] = useState<string>("");

  // Get filterable columns for the selected table
  const availableColumns = tableName ? getFilterableColumns(tableName) : [];

  // Convert filters object to array of conditions
  const parseFilters = (): FilterCondition[] => {
    const conditions: FilterCondition[] = [];

    Object.entries(filters || {}).forEach(([column, value]) => {
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        if (value.op !== undefined) {
          conditions.push({
            column,
            operator: value.op,
            value: value.value,
          });
        } else {
          Object.entries(value).forEach(([op, val]) => {
            conditions.push({
              column,
              operator: op,
              value: val as string | string[],
            });
          });
        }
      } else {
        conditions.push({
          column,
          operator: "=",
          value: value as string,
        });
      }
    });

    return conditions;
  };

  const [conditions, setConditions] = useState<FilterCondition[]>(parseFilters);

  // Convert conditions array back to filters object
  const conditionsToFilters = (conds: FilterCondition[]): Record<string, any> => {
    const result: Record<string, any> = {};

    conds.forEach((cond) => {
      if (cond.operator === "IS NULL") {
        result[cond.column] = { op: "IS NULL", value: null };
      } else if (cond.operator === "IS NOT NULL") {
        result[cond.column] = { op: "IS NOT NULL", value: null };
      } else {
        result[cond.column] = { op: cond.operator, value: cond.value };
      }
    });

    return result;
  };

  const updateConditions = (newConditions: FilterCondition[]) => {
    setConditions(newConditions);
    onFiltersChange(conditionsToFilters(newConditions));
  };

  const addCondition = () => {
    updateConditions([
      ...conditions,
      { column: availableColumns[0] || "", operator: "=", value: "" },
    ]);
  };

  const removeCondition = (index: number) => {
    updateConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: keyof FilterCondition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };

    if (field === "operator") {
      if (value === "IN" || value === "NOT IN") {
        newConditions[index].value = [];
      } else if (Array.isArray(newConditions[index].value)) {
        newConditions[index].value = "";
      } else if (value === "IS NULL" || value === "IS NOT NULL") {
        newConditions[index].value = "";
      }
    }

    updateConditions(newConditions);
  };

  const addInValue = (index: number, val: string) => {
    if (!val.trim()) return;
    const newConditions = [...conditions];
    const currentValues = Array.isArray(newConditions[index].value)
      ? (newConditions[index].value as string[])
      : [];
    newConditions[index].value = [...currentValues, val.trim()];
    updateConditions(newConditions);
    setNewInValue("");
  };

  const removeInValue = (condIndex: number, valIndex: number) => {
    const newConditions = [...conditions];
    const currentValues = newConditions[condIndex].value as string[];
    newConditions[condIndex].value = currentValues.filter((_, i) => i !== valIndex);
    updateConditions(newConditions);
  };

  const isNullOperator = (op: string) => op === "IS NULL" || op === "IS NOT NULL";
  const isInOperator = (op: string) => op === "IN" || op === "NOT IN";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="caption" fontWeight={600} color="text.secondary">
          FILTER CONDITIONS
        </Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addCondition}
          variant="outlined"
          disabled={!tableName}
        >
          Add Condition
        </Button>
      </Box>

      {!tableName && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}>
          <Typography variant="body2" color="warning.dark">
            Please select a table first to add filter conditions.
          </Typography>
        </Paper>
      )}

      {tableName && conditions.length === 0 && (
        <Paper variant="outlined" sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
          <Typography variant="body2" color="text.secondary">
            No filter conditions. Click "Add Condition" to add filters.
          </Typography>
        </Paper>
      )}

      {conditions.map((condition, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5, bgcolor: "#fafafa" }}>
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", flexWrap: "wrap" }}>
            <Autocomplete
              size="small"
              sx={{ minWidth: 140 }}
              options={availableColumns}
              value={condition.column || null}
              onChange={(_, newValue) => updateCondition(index, "column", newValue || "")}
              renderInput={(params) => <TextField {...params} label="Column" />}
              freeSolo={false}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={condition.operator}
                onChange={(e) => updateCondition(index, "operator", e.target.value)}
                label="Operator"
              >
                {OPERATORS.map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {!isNullOperator(condition.operator) && !isInOperator(condition.operator) && (
              <TextField
                size="small"
                label="Value"
                value={condition.value as string}
                onChange={(e) => updateCondition(index, "value", e.target.value)}
                sx={{ flex: 1, minWidth: 100 }}
              />
            )}

            <IconButton size="small" onClick={() => removeCondition(index)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>

          {isInOperator(condition.operator) && (
            <Box sx={{ mt: 1.5, pl: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                Values in list:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                {Array.isArray(condition.value) &&
                  condition.value.map((val, valIndex) => (
                    <Chip
                      key={valIndex}
                      label={val}
                      size="small"
                      onDelete={() => removeInValue(index, valIndex)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                {(!Array.isArray(condition.value) || condition.value.length === 0) && (
                  <Typography variant="caption" color="text.disabled">
                    No values added yet
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  size="small"
                  label="Add value"
                  value={newInValue}
                  onChange={(e) => setNewInValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addInValue(index, newInValue);
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button size="small" variant="contained" onClick={() => addInValue(index, newInValue)}>
                  Add
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      ))}

      {conditions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#e8f5e9" }}>
          <Typography variant="caption" color="success.dark">
            <strong>Preview:</strong> {conditions.length} condition{conditions.length !== 1 ? "s" : ""} will be applied
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            {conditions.map((c, i) => (
              <Typography key={i} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {i > 0 && "AND "}
                {c.column} {c.operator}{" "}
                {isNullOperator(c.operator)
                  ? ""
                  : isInOperator(c.operator)
                  ? `(${(c.value as string[]).join(", ")})`
                  : `"${c.value}"`}
              </Typography>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};
