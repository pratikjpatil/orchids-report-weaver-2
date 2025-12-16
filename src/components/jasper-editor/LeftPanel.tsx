"use client";

import { useState, useCallback, memo, useMemo } from "react";
import { useDebouncedInput } from "@/hooks/useDebouncedInput";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Menu from "@mui/material/Menu";
import Chip from "@mui/material/Chip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import ViewAgendaIcon from "@mui/icons-material/ViewAgenda";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import TuneIcon from "@mui/icons-material/Tune";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import { AddRowDialog } from "./AddRowDialog";
import { VariantDialog } from "./VariantDialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  setTemplateMeta,
  setReportMeta,
  addColumn,
  updateColumn,
  updateColumnFormat,
  removeColumn,
  addRow,
  removeRow,
  reorderRows,
  setVariants,
  addVariant,
  updateVariant,
  removeVariant,
  Row,
  Variant,
} from "@/store/templateSlice";
import {
  selectTemplateMeta,
  selectReportMeta,
  selectColumns,
  selectRows,
  selectVariants,
  selectTableNames,
  selectDynamicRowIds,
  selectExistingRowIds,
} from "@/store/selectors";

const ColumnItem = memo(({ 
  col, 
  index, 
  isEditing, 
  onToggleEdit, 
  onRemove, 
  onUpdate 
}: {
  col: any;
  index: number;
  isEditing: boolean;
  onToggleEdit: () => void;
  onRemove: () => void;
  onUpdate: (field: string, value: any) => void;
}) => {
  return (
    <Box
      sx={{
        mb: 1,
        p: 1,
        bgcolor: "background.paper",
        borderRadius: 1,
        border: "1px solid #e0e0e0",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="caption" fontWeight={600} color="primary">
          {col.id}
        </Typography>
        <Box>
          <IconButton size="small" onClick={onToggleEdit}>
            <ExpandMoreIcon
              fontSize="small"
              sx={{ transform: isEditing ? "rotate(180deg)" : "none" }}
            />
          </IconButton>
          <IconButton size="small" onClick={onRemove}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {isEditing && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            label="Column Name"
            size="small"
            value={col.name || ""}
            onChange={(e) => onUpdate("name", e.target.value)}
            fullWidth
          />
          
          <Box sx={{ display: "flex", gap: 1 }}>
            <Typography variant="caption" sx={{ alignSelf: "center", minWidth: 60 }}>Align:</Typography>
            <IconButton 
              size="small" 
              color={col.format?.align === "left" || !col.format?.align ? "primary" : "default"}
              onClick={() => onUpdate("format.align", "left")}
            >
              <FormatAlignLeftIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color={col.format?.align === "center" ? "primary" : "default"}
              onClick={() => onUpdate("format.align", "center")}
            >
              <FormatAlignCenterIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              color={col.format?.align === "right" ? "primary" : "default"}
              onClick={() => onUpdate("format.align", "right")}
            >
              <FormatAlignRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <TextField
            label="Bold Condition"
            size="small"
            value={col.format?.boldCondition || ""}
            onChange={(e) => onUpdate("format.boldCondition", e.target.value)}
            placeholder="e.g., value > 1000"
            helperText="Expression to make cells bold"
            fullWidth
          />

          <FormControl size="small" fullWidth>
            <InputLabel>Format Type</InputLabel>
            <Select
              value={col.format?.type || "none"}
              onChange={(e) => onUpdate("format.type", e.target.value)}
              label="Format Type"
            >
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="currency">Currency</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="date">Date</MenuItem>
              <MenuItem value="percentage">Percentage</MenuItem>
            </Select>
          </FormControl>

          {col.format?.type === "currency" && (
            <>
              <TextField
                label="Currency Symbol"
                size="small"
                value={col.format?.currencySymbol || ""}
                onChange={(e) => onUpdate("format.currencySymbol", e.target.value)}
                placeholder="$"
                fullWidth
              />
              <TextField
                label="Decimals"
                type="number"
                size="small"
                value={col.format?.decimals ?? 2}
                onChange={(e) => onUpdate("format.decimals", parseInt(e.target.value))}
                fullWidth
              />
            </>
          )}

          {col.format?.type === "number" && (
            <>
              <TextField
                label="Decimals"
                type="number"
                size="small"
                value={col.format?.decimals ?? 0}
                onChange={(e) => onUpdate("format.decimals", parseInt(e.target.value))}
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Thousand Separator</InputLabel>
                <Select
                  value={col.format?.thousandSeparator ? "true" : "false"}
                  onChange={(e) => onUpdate("format.thousandSeparator", e.target.value === "true")}
                  label="Thousand Separator"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </>
          )}

          {col.format?.type === "percentage" && (
            <TextField
              label="Decimals"
              type="number"
              size="small"
              value={col.format?.decimals ?? 2}
              onChange={(e) => onUpdate("format.decimals", parseInt(e.target.value))}
              fullWidth
            />
          )}

          {col.format?.type === "date" && (
            <TextField
              label="Date Format"
              size="small"
              value={col.format?.outputFormat || ""}
              onChange={(e) => onUpdate("format.outputFormat", e.target.value)}
              placeholder="dd-MMM-yyyy"
              fullWidth
            />
          )}

          <TextField
            label="Width (px)"
            type="number"
            size="small"
            value={col.format?.width || 150}
            onChange={(e) => onUpdate("format.width", parseInt(e.target.value) || 150)}
            fullWidth
          />
        </Box>
      )}
    </Box>
  );
});

ColumnItem.displayName = "ColumnItem";

const RowItem = memo(({
  row,
  index,
  isDragging,
  isDropTarget,
  onDragStart,
  onDragOver,
  onDragEnd,
  onInsertClick,
  onRemove,
}: {
  row: Row;
  index: number;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onInsertClick: (e: React.MouseEvent<HTMLElement>) => void;
  onRemove: () => void;
}) => {
  return (
    <Box>
      <Box
        onDragOver={onDragOver}
        onDrop={onDragEnd}
        sx={{
          height: isDropTarget && !isDragging ? 24 : 4,
          bgcolor: isDropTarget && !isDragging ? "primary.light" : "transparent",
          borderRadius: 1,
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isDropTarget && !isDragging && (
          <Typography variant="caption" color="primary.contrastText">
            Drop here
          </Typography>
        )}
      </Box>
      <ListItem
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        sx={{
          cursor: "grab",
          bgcolor: isDragging ? "action.selected" : "transparent",
          borderRadius: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
        secondaryAction={
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <IconButton size="small" onClick={onInsertClick} title="Insert row after">
              <AddIcon fontSize="small" />
            </IconButton>
            <IconButton edge="end" size="small" onClick={onRemove}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        }
      >
        <DragIndicatorIcon sx={{ mr: 1, color: "text.disabled", cursor: "grab" }} fontSize="small" />
        <ListItemText
          primary={row.id}
          secondary={row.rowType}
          primaryTypographyProps={{ variant: "body2" }}
          secondaryTypographyProps={{ variant: "caption", color: "primary" }}
        />
      </ListItem>
    </Box>
  );
});

RowItem.displayName = "RowItem";

export const LeftPanel = memo(() => {
  const dispatch = useAppDispatch();
  const templateMeta = useAppSelector(selectTemplateMeta);
  const reportMeta = useAppSelector(selectReportMeta);
  const columns = useAppSelector(selectColumns);
  const rows = useAppSelector(selectRows);
  const variants = useAppSelector(selectVariants);
  const tableNames = useAppSelector(selectTableNames);
  const dynamicRowIds = useAppSelector(selectDynamicRowIds);
  const existingRowIds = useAppSelector(selectExistingRowIds);

  const [expanded, setExpanded] = useState<string>("metadata");
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "row" | "column";
    index: number;
    references: string[];
    colId: string;
    rowId: string;
  } | null>(null);
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [insertMenuAnchor, setInsertMenuAnchor] = useState<null | HTMLElement>(null);
  const [insertAtIndex, setInsertAtIndex] = useState<number>(0);
  const [addRowDialogState, setAddRowDialogState] = useState<{ open: boolean; rowType: string; insertAt?: number }>({ open: false, rowType: "" });
  const [editingColumn, setEditingColumn] = useState<number | null>(null);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(null);

  const updateMetadata = useCallback((field: string, value: any) => {
    if (field.startsWith("reportMeta.")) {
      const metaField = field.split(".")[1];
      dispatch(setReportMeta({ [metaField]: value }));
    } else if (field.startsWith("templateMeta.")) {
      const metaField = field.split(".")[1];
      dispatch(setTemplateMeta({ [metaField]: value }));
    }
  }, [dispatch]);

  const handleAddColumn = useCallback(() => {
    dispatch(addColumn());
  }, [dispatch]);

  const handleUpdateColumn = useCallback((index: number, field: string, value: any) => {
    if (field.includes(".")) {
      const parts = field.split(".");
      dispatch(updateColumnFormat({ index, format: { [parts[1]]: value } }));
    } else {
      dispatch(updateColumn({ index, column: { [field]: value } }));
    }
  }, [dispatch]);

  const findColumnReferences = useCallback((colId: string) => {
    const references: string[] = [];
    rows.forEach((row, rowIndex) => {
      row.cells?.forEach((cell, cellIndex) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`cell_R__.*?_${colId}\\b`, "g");
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rowIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  }, [rows]);

  const handleRemoveColumn = useCallback((colId: string, index: number) => {
    const references = findColumnReferences(colId);
    if (references.length > 0) {
      setDeleteDialog({ type: "column", index, references, colId, rowId: "" });
    } else {
      dispatch(removeColumn({ colId, index }));
    }
  }, [dispatch, findColumnReferences]);

  const confirmRemoveColumn = useCallback((colId: string, index: number) => {
    dispatch(removeColumn({ colId, index }));
    setDeleteDialog(null);
  }, [dispatch]);

  const openAddRowDialog = useCallback((type: string, insertAt?: number) => {
    setAddRowDialogState({ open: true, rowType: type, insertAt });
    setInsertMenuAnchor(null);
  }, []);

  const handleAddRow = useCallback((rowId: string) => {
    const { rowType, insertAt } = addRowDialogState;
    const newRow: Row = {
      rowType: rowType as Row["rowType"],
      id: rowId,
      cells: columns.map(() => ({ type: "TEXT", value: "" })),
    };

    if (rowType === "DYNAMIC") {
      newRow.dynamicConfig = {
        type: "DB_LIST",
        table: "",
        select: [],
        filters: {},
        columnMappings: [],
      };
      newRow.cells = [];
    }

    dispatch(addRow({ row: newRow, insertAt }));
    setAddRowDialogState({ open: false, rowType: "" });
  }, [dispatch, addRowDialogState, columns]);

  const handleDragStart = useCallback((index: number) => {
    setDraggedRowIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropTargetIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedRowIndex !== null && dropTargetIndex !== null && draggedRowIndex !== dropTargetIndex) {
      dispatch(reorderRows({ fromIndex: draggedRowIndex, toIndex: dropTargetIndex }));
    }
    setDraggedRowIndex(null);
    setDropTargetIndex(null);
  }, [dispatch, draggedRowIndex, dropTargetIndex]);

  const handleInsertClick = useCallback((event: React.MouseEvent<HTMLElement>, index: number) => {
    setInsertMenuAnchor(event.currentTarget);
    setInsertAtIndex(index);
  }, []);

  const findRowReferences = useCallback((rowId: string) => {
    const references: string[] = [];
    rows.forEach((row, rIndex) => {
      row.cells?.forEach((cell, cellIndex) => {
        if (cell.type === "FORMULA" && cell.expression) {
          const pattern = new RegExp(`cell_${rowId}_C__.*?\\b`, "g");
          if (pattern.test(cell.expression)) {
            references.push(`Row ${rIndex + 1}, Cell ${cellIndex + 1}`);
          }
        }
      });
    });
    return references;
  }, [rows]);

  const handleRemoveRow = useCallback((rowId: string, index: number) => {
    const references = findRowReferences(rowId);
    if (references.length > 0) {
      setDeleteDialog({ type: "row", index, references, colId: "", rowId });
    } else {
      dispatch(removeRow({ rowId }));
    }
  }, [dispatch, findRowReferences]);

  const confirmRemoveRow = useCallback((rowId: string) => {
    dispatch(removeRow({ rowId }));
    setDeleteDialog(null);
  }, [dispatch]);

  const openAddVariantDialog = useCallback(() => {
    setEditingVariant(null);
    setEditingVariantIndex(null);
    setVariantDialogOpen(true);
  }, []);

  const openEditVariantDialog = useCallback((variant: Variant, index: number) => {
    setEditingVariant(variant);
    setEditingVariantIndex(index);
    setVariantDialogOpen(true);
  }, []);

  const handleSaveVariant = useCallback((variant: Variant) => {
    if (editingVariantIndex !== null) {
      dispatch(updateVariant({ index: editingVariantIndex, variant }));
    } else {
      dispatch(addVariant(variant));
    }
    setVariantDialogOpen(false);
    setEditingVariant(null);
    setEditingVariantIndex(null);
  }, [dispatch, editingVariantIndex]);

  const handleRemoveVariant = useCallback((index: number) => {
    dispatch(removeVariant(index));
  }, [dispatch]);

  return (
    <Paper
      elevation={0}
      sx={{
        width: 340,
        borderRight: "1px solid #e0e0e0",
        overflow: "auto",
        bgcolor: "#fafafa",
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: "text.secondary" }}>
          REPORT STRUCTURE
        </Typography>

        <Accordion expanded={expanded === "metadata"} onChange={() => setExpanded(expanded === "metadata" ? "" : "metadata")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={500}>Metadata</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Report Name"
                size="small"
                value={reportMeta.reportName}
                onChange={(e) => updateMetadata("reportMeta.reportName", e.target.value)}
                fullWidth
              />
              <TextField
                label="Template ID"
                size="small"
                value={templateMeta.templateId}
                onChange={(e) => updateMetadata("templateMeta.templateId", e.target.value)}
                fullWidth
              />
              <TextField
                label="Version"
                size="small"
                value={templateMeta.version || ""}
                onChange={(e) => updateMetadata("templateMeta.version", e.target.value)}
                placeholder="e.g., 1.0.0"
                fullWidth
              />
              <TextField
                label="Description"
                size="small"
                multiline
                rows={2}
                value={templateMeta.description || ""}
                onChange={(e) => updateMetadata("templateMeta.description", e.target.value)}
                placeholder="Template description..."
                fullWidth
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Page Size</InputLabel>
                <Select
                  value={templateMeta.pageSize}
                  onChange={(e) => updateMetadata("templateMeta.pageSize", e.target.value)}
                  label="Page Size"
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="LETTER">Letter</MenuItem>
                  <MenuItem value="LEGAL">Legal</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" fullWidth>
                <InputLabel>Orientation</InputLabel>
                <Select
                  value={templateMeta.pageOrientation}
                  onChange={(e) => updateMetadata("templateMeta.pageOrientation", e.target.value)}
                  label="Orientation"
                >
                  <MenuItem value="portrait">Portrait</MenuItem>
                  <MenuItem value="landscape">Landscape</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === "columns"} onChange={() => setExpanded(expanded === "columns" ? "" : "columns")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewColumnIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>Columns ({columns.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddColumn} fullWidth>
                Add Column
              </Button>
              <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                {columns.map((col, index) => (
                  <ColumnItem
                    key={col.id}
                    col={col}
                    index={index}
                    isEditing={editingColumn === index}
                    onToggleEdit={() => setEditingColumn(editingColumn === index ? null : index)}
                    onRemove={() => handleRemoveColumn(col.id, index)}
                    onUpdate={(field, value) => handleUpdateColumn(index, field, value)}
                  />
                ))}
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === "rows"} onChange={() => setExpanded(expanded === "rows" ? "" : "rows")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <ViewAgendaIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>Rows ({rows.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0.5 }}>
                <Button variant="outlined" size="small" onClick={() => openAddRowDialog("HEADER")}>Header</Button>
                <Button variant="outlined" size="small" onClick={() => openAddRowDialog("DATA")}>Data</Button>
                <Button variant="outlined" size="small" onClick={() => openAddRowDialog("SEPARATOR")}>Separator</Button>
                <Button variant="outlined" size="small" onClick={() => openAddRowDialog("DYNAMIC")}>Dynamic</Button>
                <Button variant="outlined" size="small" onClick={() => openAddRowDialog("FOOTER")} sx={{ gridColumn: "span 2" }}>Footer</Button>
              </Box>
              <List dense sx={{ bgcolor: "background.paper", borderRadius: 1, mt: 1 }}>
                {rows.map((row, index) => (
                  <RowItem
                    key={row.id}
                    row={row}
                    index={index}
                    isDragging={draggedRowIndex === index}
                    isDropTarget={dropTargetIndex === index}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onInsertClick={(e) => handleInsertClick(e, index + 1)}
                    onRemove={() => handleRemoveRow(row.id, index)}
                  />
                ))}
                <Box
                  onDragOver={(e) => handleDragOver(e, rows.length)}
                  onDrop={handleDragEnd}
                  sx={{
                    height: dropTargetIndex === rows.length ? 24 : 4,
                    bgcolor: dropTargetIndex === rows.length ? "primary.light" : "transparent",
                    borderRadius: 1,
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {dropTargetIndex === rows.length && (
                    <Typography variant="caption" color="primary.contrastText">Drop here</Typography>
                  )}
                </Box>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expanded === "variants"} onChange={() => setExpanded(expanded === "variants" ? "" : "variants")}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <TuneIcon sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2" fontWeight={500}>Variants ({variants.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={openAddVariantDialog} fullWidth>
                Add Variant
              </Button>

              {variants.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 2, color: "text.secondary" }}>
                  <Typography variant="caption">
                    No variants defined. Add variants for different report configurations.
                  </Typography>
                </Box>
              ) : (
                <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                  {variants.map((variant, index) => (
                    <ListItem
                      key={variant.variantCode}
                      sx={{
                        mb: 1,
                        p: 1.5,
                        border: "1px solid #e0e0e0",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "stretch",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{variant.variantName}</Typography>
                          <Typography variant="caption" color="text.secondary">{variant.variantCode}</Typography>
                          {variant.description && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                              {variant.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <IconButton size="small" onClick={() => openEditVariantDialog(variant, index)} title="Edit variant">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleRemoveVariant(index)} title="Delete variant">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
                        <Chip label={`${variant.params.length} params`} size="small" variant="outlined" color="primary" />
                        <Chip label={`${variant.filterRules.length} filters`} size="small" variant="outlined" color="secondary" />
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Menu anchorEl={insertMenuAnchor} open={Boolean(insertMenuAnchor)} onClose={() => setInsertMenuAnchor(null)}>
        <MenuItem onClick={() => openAddRowDialog("HEADER", insertAtIndex)}>Header</MenuItem>
        <MenuItem onClick={() => openAddRowDialog("DATA", insertAtIndex)}>Data</MenuItem>
        <MenuItem onClick={() => openAddRowDialog("SEPARATOR", insertAtIndex)}>Separator</MenuItem>
        <MenuItem onClick={() => openAddRowDialog("DYNAMIC", insertAtIndex)}>Dynamic</MenuItem>
        <MenuItem onClick={() => openAddRowDialog("FOOTER", insertAtIndex)}>Footer</MenuItem>
      </Menu>

      <AddRowDialog
        open={addRowDialogState.open}
        rowType={addRowDialogState.rowType}
        existingRowIds={existingRowIds}
        onClose={() => setAddRowDialogState({ open: false, rowType: "" })}
        onConfirm={handleAddRow}
      />

      <VariantDialog
        open={variantDialogOpen}
        variant={editingVariant}
        tableNames={tableNames}
        dynamicRowIds={dynamicRowIds}
        onClose={() => {
          setVariantDialogOpen(false);
          setEditingVariant(null);
          setEditingVariantIndex(null);
        }}
        onSave={handleSaveVariant}
      />

      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteDialog?.type === "row"
              ? `This row is referenced in the following formulas:`
              : `This column is referenced in the following formulas:`}
          </DialogContentText>
          <Box sx={{ mt: 1, maxHeight: 200, overflow: "auto" }}>
            {deleteDialog?.references.map((ref, i) => (
              <Typography key={i} variant="body2" color="error">• {ref}</Typography>
            ))}
          </Box>
          <DialogContentText sx={{ mt: 2 }}>
            Deleting this will remove these references from the formulas. Continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
          <Button
            onClick={() => {
              if (deleteDialog?.type === "row") {
                confirmRemoveRow(deleteDialog.rowId);
              } else if (deleteDialog?.type === "column") {
                confirmRemoveColumn(deleteDialog.colId, deleteDialog.index);
              }
            }}
            color="error"
            variant="contained"
          >
            Delete Anyway
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
});

LeftPanel.displayName = "LeftPanel";
