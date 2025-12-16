"use client";

import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useDebouncedInput } from "@/hooks/useDebouncedInput";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import { FormulaBuilder } from "./FormulaBuilder";
import { DynamicRowConfig } from "./DynamicRowConfig";
import { FilterBuilder } from "./FilterBuilder";
import { useConfig } from "@/contexts/ConfigContext";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  updateCell,
  updateCellRender,
  updateCellFormat,
  updateCellSource,
  updateDynamicConfig,
  setFormulaMode,
} from "@/store/templateSlice";
import {
  selectSelectedCell,
  selectFormulaMode,
  selectRows,
  selectColumns,
  selectTemplateColumns,
  selectTemplateForExport,
} from "@/store/selectors";

export const RightPanel = memo(() => {
  const dispatch = useAppDispatch();
  const { tableConfigs, getSelectableColumns, getAllowedAggFuncs } = useConfig();
  
  const selectedCell = useAppSelector(selectSelectedCell);
  const formulaMode = useAppSelector(selectFormulaMode);
  const rows = useAppSelector(selectRows);
  const columns = useAppSelector(selectColumns);
  const templateColumns = useAppSelector(selectTemplateColumns);
  const templateForExport = useAppSelector(selectTemplateForExport);

  const [cellTypeWarning, setCellTypeWarning] = useState<string | null>(null);

    const row = selectedCell ? rows[selectedCell.rowIndex] : null;
    const cell = row?.cells?.[selectedCell?.cellIndex ?? -1];
    const column = selectedCell ? columns[selectedCell.cellIndex] : null;

    const handleUpdateCellDebounced = useCallback((field: string, value: any) => {
      if (!selectedCell) return;
      
      if (field.startsWith("render.")) {
        const renderField = field.replace("render.", "");
        dispatch(updateCellRender({
          rowIndex: selectedCell.rowIndex,
          cellIndex: selectedCell.cellIndex,
          render: { [renderField]: value },
        }));
      } else if (field.startsWith("format.")) {
        const formatField = field.replace("format.", "");
        dispatch(updateCellFormat({
          rowIndex: selectedCell.rowIndex,
          cellIndex: selectedCell.cellIndex,
          format: { [formatField]: value },
        }));
      } else if (field.startsWith("source.")) {
        const sourceField = field.replace("source.", "");
        dispatch(updateCellSource({
          rowIndex: selectedCell.rowIndex,
          cellIndex: selectedCell.cellIndex,
          source: { [sourceField]: value },
        }));
      } else {
        dispatch(updateCell({
          rowIndex: selectedCell.rowIndex,
          cellIndex: selectedCell.cellIndex,
          cell: { [field]: value },
        }));
      }
    }, [dispatch, selectedCell]);

    const [debouncedTextValue, setDebouncedTextValue] = useDebouncedInput(
      cell?.value || "",
      useCallback((value) => handleUpdateCellDebounced("value", value), [handleUpdateCellDebounced]),
      150
    );

    useEffect(() => {
      setDebouncedTextValue(cell?.value || "");
    }, [cell?.value, selectedCell, setDebouncedTextValue]);

    const handleUpdateCell = useCallback((field: string, value: any) => {
    if (!selectedCell) return;
    
    if (field.startsWith("render.")) {
      const renderField = field.replace("render.", "");
      dispatch(updateCellRender({
        rowIndex: selectedCell.rowIndex,
        cellIndex: selectedCell.cellIndex,
        render: { [renderField]: value },
      }));
    } else if (field.startsWith("format.")) {
      const formatField = field.replace("format.", "");
      dispatch(updateCellFormat({
        rowIndex: selectedCell.rowIndex,
        cellIndex: selectedCell.cellIndex,
        format: { [formatField]: value },
      }));
    } else if (field.startsWith("source.")) {
      const sourceField = field.replace("source.", "");
      dispatch(updateCellSource({
        rowIndex: selectedCell.rowIndex,
        cellIndex: selectedCell.cellIndex,
        source: { [sourceField]: value },
      }));
    } else {
      dispatch(updateCell({
        rowIndex: selectedCell.rowIndex,
        cellIndex: selectedCell.cellIndex,
        cell: { [field]: value },
      }));
    }
  }, [dispatch, selectedCell]);

  const handleFormulaModeChange = useCallback((mode: boolean) => {
    dispatch(setFormulaMode(mode));
  }, [dispatch]);

  const handleDynamicConfigChange = useCallback((config: any) => {
    if (!selectedCell) return;
    dispatch(updateDynamicConfig({
      rowIndex: selectedCell.rowIndex,
      config,
    }));
  }, [dispatch, selectedCell]);

  useEffect(() => {
    setCellTypeWarning(null);
  }, [selectedCell]);

  if (!selectedCell) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: 350,
          bgcolor: "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2" gutterBottom>No cell selected</Typography>
          <Typography variant="caption">Click on a cell in the canvas to edit its properties</Typography>
        </Box>
      </Paper>
    );
  }

  if (row?.rowType === "DYNAMIC" || (row?.rowType === "DYNAMIC" && selectedCell.cellIndex === -1)) {
    return (
      <Paper elevation={0} sx={{ width: 350, overflow: "auto", bgcolor: "#fafafa" }}>
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} sx={{ color: "text.secondary" }}>
              DYNAMIC ROW
            </Typography>
            <Chip label={`Row ${selectedCell.rowIndex + 1}`} size="small" sx={{ fontSize: "0.7rem" }} />
          </Box>
          <DynamicRowConfig
            dynamicConfig={row?.dynamicConfig || {}}
            templateColumns={templateColumns}
            onConfigChange={handleDynamicConfigChange}
          />
        </Box>
      </Paper>
    );
  }

  if (!cell) return null;

  const selectedTable = cell.source?.table || "";
  const selectableColumns = selectedTable ? getSelectableColumns(selectedTable) : [];

  const validateCellTypeForColumn = (cellType: string, table: string, col: string) => {
    if (!table || !col) return true;
    if (!cellType.startsWith("DB_") || cellType === "DB_VALUE") return true;
    const aggFunc = cellType.replace("DB_", "");
    const allowedFuncs = getAllowedAggFuncs(table, col);
    return allowedFuncs.includes(aggFunc);
  };

  const handleCellTypeChange = (newType: string) => {
    setCellTypeWarning(null);
    if (newType.startsWith("DB_") && newType !== "DB_VALUE" && selectedTable && cell.source?.column) {
      const isAllowed = validateCellTypeForColumn(newType, selectedTable, cell.source.column);
      if (!isAllowed) {
        setCellTypeWarning(`${newType} is not supported for column "${cell.source.column}". Please select a different column or cell type.`);
      }
    }
    handleUpdateCell("type", newType);
  };

  const handleColumnChange = (newColumn: string) => {
    handleUpdateCell("source.column", newColumn);
    const currentType = cell.type;
    if (currentType && currentType.startsWith("DB_") && currentType !== "DB_VALUE" && selectedTable && newColumn) {
      const isAllowed = validateCellTypeForColumn(currentType, selectedTable, newColumn);
      if (!isAllowed) {
        setCellTypeWarning(`${currentType} is not supported for column "${newColumn}". Cell type has been reset to DB_VALUE.`);
        handleUpdateCell("type", "DB_VALUE");
      } else {
        setCellTypeWarning(null);
      }
    }
  };

  const getCellTypeOptions = () => {
    const baseTypes = [
      { value: "TEXT", label: "Text" },
      { value: "DB_VALUE", label: "DB Value" },
      { value: "FORMULA", label: "Formula" },
    ];

    if (!selectedTable || !cell.source?.column) {
      return [
        ...baseTypes,
        { value: "DB_COUNT", label: "DB Count" },
        { value: "DB_SUM", label: "DB Sum" },
        { value: "DB_AVG", label: "DB Average" },
        { value: "DB_MIN", label: "DB Min" },
        { value: "DB_MAX", label: "DB Max" },
      ];
    }

    const allowedAggFuncs = getAllowedAggFuncs(selectedTable, cell.source.column);
    const aggTypes = [];
    if (allowedAggFuncs.includes("COUNT")) aggTypes.push({ value: "DB_COUNT", label: "DB Count" });
    if (allowedAggFuncs.includes("SUM")) aggTypes.push({ value: "DB_SUM", label: "DB Sum" });
    if (allowedAggFuncs.includes("AVG")) aggTypes.push({ value: "DB_AVG", label: "DB Average" });
    if (allowedAggFuncs.includes("MIN")) aggTypes.push({ value: "DB_MIN", label: "DB Min" });
    if (allowedAggFuncs.includes("MAX")) aggTypes.push({ value: "DB_MAX", label: "DB Max" });

    return [...baseTypes, ...aggTypes];
  };

  return (
    <Paper elevation={0} sx={{ width: 350, overflow: "auto", bgcolor: "#fafafa" }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ color: "text.secondary" }}>
            CELL PROPERTIES
          </Typography>
          <Chip label={`R${selectedCell.rowIndex + 1}C${selectedCell.cellIndex + 1}`} size="small" sx={{ fontSize: "0.7rem" }} />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Cell Type</InputLabel>
            <Select
              value={cell.type || "TEXT"}
              onChange={(e) => handleCellTypeChange(e.target.value)}
              label="Cell Type"
            >
              {getCellTypeOptions().map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {cellTypeWarning && (
            <Alert severity="warning" sx={{ py: 0.5 }}>
              <Typography variant="caption">{cellTypeWarning}</Typography>
            </Alert>
          )}

          <Divider />

            {cell.type === "TEXT" && (
              <TextField
                label="Text Value"
                size="small"
                multiline
                rows={3}
                value={debouncedTextValue}
                onChange={(e) => setDebouncedTextValue(e.target.value)}
                fullWidth
              />
            )}

          {cell.type === "FORMULA" && (
            <FormulaBuilder
              expression={cell.expression || ""}
              variables={cell.variables || {}}
              template={templateForExport}
              currentCellRowId={row?.id || ""}
              currentCellColId={column?.id || ""}
              onExpressionChange={(expr) => handleUpdateCell("expression", expr)}
              onVariablesChange={(vars) => handleUpdateCell("variables", vars)}
              formulaMode={formulaMode}
              onFormulaModeChange={handleFormulaModeChange}
            />
          )}

          {cell.type?.startsWith("DB_") && (
            <>
              <Autocomplete
                size="small"
                options={tableConfigs.map((t) => t.tableName)}
                value={selectedTable || null}
                onChange={(_, newValue) => {
                  handleUpdateCell("source.table", newValue || "");
                  handleUpdateCell("source.column", "");
                  setCellTypeWarning(null);
                }}
                getOptionLabel={(option) => {
                  const table = tableConfigs.find((t) => t.tableName === option);
                  return table ? `${table.tableName} (${table.label})` : option;
                }}
                renderInput={(params) => <TextField {...params} label="Table" placeholder="Select table..." />}
                fullWidth
              />

              <Autocomplete
                size="small"
                options={selectableColumns}
                value={cell.source?.column || null}
                onChange={(_, newValue) => handleColumnChange(newValue || "")}
                disabled={!selectedTable}
                renderInput={(params) => (
                  <TextField {...params} label="Column" placeholder={selectedTable ? "Select column..." : "Select table first"} />
                )}
                fullWidth
              />

              {selectedTable && cell.source?.column && (
                <Box sx={{ p: 1, bgcolor: "#e8f5e9", borderRadius: 1 }}>
                  <Typography variant="caption" color="success.dark">
                    <strong>Supported aggregates:</strong>{" "}
                    {getAllowedAggFuncs(selectedTable, cell.source.column).join(", ") || "None"}
                  </Typography>
                </Box>
              )}

              <FilterBuilder
                filters={cell.source?.filters || {}}
                onFiltersChange={(filters) => handleUpdateCell("source.filters", filters)}
                tableName={selectedTable}
              />
            </>
          )}

          <Divider />

          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">FORMATTING</Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={cell.render?.bold || false}
                onChange={(e) => handleUpdateCell("render.bold", e.target.checked)}
                size="small"
              />
            }
            label="Bold"
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Text Align</InputLabel>
            <Select
              value={cell.render?.align || "left"}
              onChange={(e) => handleUpdateCell("render.align", e.target.value)}
              label="Text Align"
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Colspan"
            type="number"
            size="small"
            value={cell.render?.colspan || 1}
            onChange={(e) => handleUpdateCell("render.colspan", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1, max: columns.length } }}
            fullWidth
          />

          <TextField
            label="Rowspan"
            type="number"
            size="small"
            value={cell.render?.rowspan || 1}
            onChange={(e) => handleUpdateCell("render.rowspan", parseInt(e.target.value) || 1)}
            InputProps={{ inputProps: { min: 1, max: 10 } }}
            fullWidth
          />

          <Divider />

          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">CELL FORMAT</Typography>

          <FormControl size="small" fullWidth>
            <InputLabel>Format Type</InputLabel>
            <Select
              value={cell.format?.type || "none"}
              onChange={(e) => handleUpdateCell("format.type", e.target.value)}
              label="Format Type"
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="currency">Currency</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
            </Select>
          </FormControl>

          {cell.format?.type === "currency" && (
            <>
              <TextField
                label="Currency Symbol"
                size="small"
                value={cell.format?.currencySymbol || ""}
                onChange={(e) => handleUpdateCell("format.currencySymbol", e.target.value)}
                placeholder="$"
                fullWidth
              />
              <TextField
                label="Decimals"
                type="number"
                size="small"
                value={cell.format?.decimals ?? 2}
                onChange={(e) => handleUpdateCell("format.decimals", parseInt(e.target.value))}
                fullWidth
              />
            </>
          )}

          {cell.format?.type === "number" && (
            <>
              <TextField
                label="Decimals"
                type="number"
                size="small"
                value={cell.format?.decimals ?? 0}
                onChange={(e) => handleUpdateCell("format.decimals", parseInt(e.target.value))}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Thousand Separator</InputLabel>
                <Select
                  value={cell.format?.thousandSeparator ? "true" : "false"}
                  onChange={(e) => handleUpdateCell("format.thousandSeparator", e.target.value === "true")}
                  label="Thousand Separator"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {cell.format?.type === "percentage" && (
            <TextField
              label="Decimals"
              type="number"
              size="small"
              value={cell.format?.decimals ?? 2}
              onChange={(e) => handleUpdateCell("format.decimals", parseInt(e.target.value))}
              fullWidth
            />
          )}

          {cell.format?.type === "date" && (
            <TextField
              label="Date Format"
              size="small"
              value={cell.format?.outputFormat || ""}
              onChange={(e) => handleUpdateCell("format.outputFormat", e.target.value)}
              placeholder="dd-MMM-yyyy"
              fullWidth
            />
          )}

          <TextField
            label="Background Color"
            size="small"
            type="color"
            value={cell.format?.bgColor || "#ffffff"}
            onChange={(e) => handleUpdateCell("format.bgColor", e.target.value)}
            fullWidth
            InputProps={{ sx: { height: 40 } }}
          />

          <Divider />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Cell ID: cell_{row?.id}_{column?.id}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
});

RightPanel.displayName = "RightPanel";
