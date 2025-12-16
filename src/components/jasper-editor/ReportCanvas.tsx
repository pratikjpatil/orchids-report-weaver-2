"use client";

import { useRef, useMemo, useCallback, memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedCell } from "@/store/templateSlice";
import {
  selectRowOrder,
  selectRowsEntities,
  selectCellsEntities,
  selectColumns,
  selectSelectedCell,
  selectFormulaMode,
  selectReportMeta,
  selectHiddenCells,
} from "@/store/selectors";
import type { Row, Cell, Column } from "@/store/templateSlice";

const getRowTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    HEADER: "#1976d2",
    DATA: "#2c8aa8",
    SEPARATOR: "#757575",
    DYNAMIC: "#388e3c",
    FOOTER: "#f57c00",
  };
  return colors[type] || "#757575";
};

const getCellValue = (cell: Cell) => {
  if (cell.type === "TEXT") return cell.value || "Click to edit";
  if (cell.type === "FORMULA") return `= ${cell.expression || "formula"}`;
  if (cell.type?.startsWith("DB_")) return `${cell.type} (${cell.source?.column || "?"})`;
  return "Empty cell";
};

interface CellComponentProps {
  cell: Cell;
  cellId: string;
  rowId: string;
  row: Row;
  colId: string;
  isSelected: boolean;
  formulaMode: boolean;
  column: Column;
  isHidden: boolean;
  onCellClick: (rowId: string, cellId: string, colId: string, row: Row, event: React.MouseEvent) => void;
}

const CellComponent = memo(({
  cell,
  cellId,
  rowId,
  row,
  colId,
  isSelected,
  formulaMode,
  column,
  isHidden,
  onCellClick,
}: CellComponentProps) => {
  if (isHidden) return null;

  const colspan = cell.render?.colspan || 1;
  const rowspan = cell.render?.rowspan || 1;

  return (
    <TableCell
      onClick={(e) => onCellClick(rowId, cellId, colId, row, e)}
      colSpan={colspan}
      rowSpan={rowspan}
      sx={{
        cursor: formulaMode ? "crosshair" : "pointer",
        position: "relative",
        bgcolor: cell.format?.bgColor && cell.format.bgColor !== "#ffffff" 
          ? cell.format.bgColor 
          : isSelected 
            ? "#e3f2fd" 
            : formulaMode 
              ? "#fff9c4" 
              : "white",
        border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
        fontWeight: cell.render?.bold ? 600 : 400,
        textAlign: cell.render?.align || column?.format?.align || "left",
        width: column?.format?.width || 150,
        minWidth: column?.format?.width || 150,
        p: 1,
        "&:hover": {
          bgcolor: isSelected ? "#e3f2fd" : formulaMode ? "#fff59d" : "#f5f5f5",
        },
        transition: "all 0.15s ease",
      }}
    >
      <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
        {getCellValue(cell)}
      </Typography>
      {colspan > 1 && (
        <Chip
          label={`cs:${colspan}`}
          size="small"
          sx={{ position: "absolute", top: 2, right: 2, height: 16, fontSize: "0.6rem" }}
        />
      )}
      {rowspan > 1 && (
        <Chip
          label={`rs:${rowspan}`}
          size="small"
          color="secondary"
          sx={{ position: "absolute", top: colspan > 1 ? 20 : 2, right: 2, height: 16, fontSize: "0.6rem" }}
        />
      )}
    </TableCell>
  );
});

CellComponent.displayName = "CellComponent";

interface RowContentProps {
  rowId: string;
  row: Row;
  rows: Record<string, Row>;
  cells: Record<string, Cell>;
  columns: Column[];
  selectedCell: { rowId: string; cellId: string } | null;
  formulaMode: boolean;
  hiddenCells: Set<string>;
  onCellClick: (rowId: string, cellId: string, colId: string, row: Row, event: React.MouseEvent) => void;
  onDynamicRowClick: (rowId: string) => void;
  measureElement?: (el: Element | null) => void;
}

const RowContent = memo(({ 
  rowId, 
  row, 
  rows, 
  cells, 
  columns, 
  selectedCell, 
  formulaMode, 
  hiddenCells, 
  onCellClick, 
  onDynamicRowClick,
  measureElement 
}: RowContentProps) => {
  if (!row) return null;

  return (
    <TableRow
      ref={measureElement}
      sx={{
        "&:hover": { bgcolor: "#f9f9f9" },
        borderLeft: `3px solid ${getRowTypeColor(row.rowType)}`,
      }}
    >
      <TableCell
        sx={{
          bgcolor: "#fafafa",
          borderRight: "1px solid #e0e0e0",
          textAlign: "center",
          width: 80,
          minWidth: 80,
          maxWidth: 80,
          p: 0.5,
        }}
      >
        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
          {row.id}
        </Typography>
        <Chip
          label={row.rowType}
          size="small"
          sx={{
            fontSize: "0.6rem",
            height: 18,
            bgcolor: getRowTypeColor(row.rowType),
            color: "white",
            fontWeight: 600,
          }}
        />
      </TableCell>

      {row.rowType === "DYNAMIC" ? (
        <TableCell
          colSpan={columns.length}
          onClick={() => onDynamicRowClick(rowId)}
          sx={{
            bgcolor: selectedCell?.rowId === rowId ? "#c8e6c9" : "#e8f5e9",
            fontStyle: "italic",
            color: "text.secondary",
            cursor: formulaMode ? "not-allowed" : "pointer",
            border: selectedCell?.rowId === rowId ? "2px solid #388e3c" : "1px solid #e0e0e0",
            opacity: formulaMode ? 0.6 : 1,
            "&:hover": { bgcolor: formulaMode ? "#e8f5e9" : "#c8e6c9" },
          }}
        >
          Dynamic rows from {row.dynamicConfig?.table || "database"} - Click to configure
          {formulaMode && (
            <Typography variant="caption" display="block" color="error">(Cannot use in formulas)</Typography>
          )}
        </TableCell>
      ) : (
        row.cellIds?.map((cellId, cellIndex) => {
          const cell = cells[cellId];
          if (!cell) return null;

          const isHidden = hiddenCells.has(`${rowId}-${cellId}`);
          const isSelected = selectedCell?.rowId === rowId && selectedCell?.cellId === cellId;
          const column = columns[cellIndex];

          return (
            <CellComponent
              key={cellId}
              cell={cell}
              cellId={cellId}
              rowId={rowId}
              row={row}
              colId={column?.id}
              isSelected={isSelected}
              formulaMode={formulaMode}
              column={column}
              isHidden={isHidden}
              onCellClick={onCellClick}
            />
          );
        })
      )}
    </TableRow>
  );
});

RowContent.displayName = "RowContent";

export const ReportCanvas = memo(() => {
  const dispatch = useAppDispatch();
  const parentRef = useRef<HTMLDivElement>(null);

  const rowOrder = useAppSelector(selectRowOrder);
  const rows = useAppSelector(selectRowsEntities);
  const cells = useAppSelector(selectCellsEntities);
  const columns = useAppSelector(selectColumns);
  const selectedCell = useAppSelector(selectSelectedCell);
  const formulaMode = useAppSelector(selectFormulaMode);
  const reportMeta = useAppSelector(selectReportMeta);
  const hiddenCells = useAppSelector(selectHiddenCells);

  const rowVirtualizer = useVirtualizer({
    count: rowOrder.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 60, []),
    overscan: 5,
    measureElement:
      typeof window !== 'undefined' && navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  });

  const handleCellClick = useCallback((
    rowId: string,
    cellId: string,
    colId: string,
    row: Row,
    event: React.MouseEvent
  ) => {
    if (formulaMode) {
      if (row.rowType === "DYNAMIC") return;
      const cellRef = `cell_${rowId}_${colId}`;
      window.dispatchEvent(new CustomEvent("formula-cell-selected", { detail: cellRef }));
      event.stopPropagation();
    } else {
      dispatch(setSelectedCell({ rowId, cellId }));
    }
  }, [dispatch, formulaMode]);

  const handleDynamicRowClick = useCallback((rowId: string) => {
    if (!formulaMode) {
      dispatch(setSelectedCell({ rowId, cellId: "" }));
    }
  }, [dispatch, formulaMode]);

  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: formulaMode ? "#fff3e0" : "#f5f7fa",
        p: 3,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: formulaMode ? "crosshair" : "default",
        transition: "background-color 0.3s ease",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "white",
          p: 2,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {formulaMode && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: "#ff9800",
              color: "white",
              borderRadius: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              Formula Building Mode - Click cells to add to formula (Dynamic rows excluded)
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            {reportMeta.reportName || "Untitled Report"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {columns.length} cols × {rowOrder.length} rows
          </Typography>
        </Box>

        {columns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add columns from the left panel to get started
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <TableContainer sx={{ flexShrink: 0 }}>
              <Table sx={{ border: "1px solid #e0e0e0", tableLayout: "fixed" }} size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ width: 80, minWidth: 80, fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", borderRight: "1px solid #e0e0e0" }}>
                      #
                    </TableCell>
                    {columns.map((col, colIndex) => (
                      <TableCell
                        key={colIndex}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.8rem",
                          width: col.format?.width || 150,
                          minWidth: col.format?.width || 150,
                        }}
                      >
                        {col.name}
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                          {col.id} ({col.format?.width || 150}px)
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
              </Table>
            </TableContainer>

            <Box 
              ref={parentRef}
              sx={{ 
                flex: 1, 
                overflow: "auto",
                contain: "strict",
              }}
            >
              <Table sx={{ tableLayout: "fixed", width: "100%" }} size="small">
                <TableBody>
                  <TableRow>
                    <TableCell 
                      colSpan={columns.length + 1} 
                      sx={{ 
                        p: 0, 
                        border: 0,
                        position: "relative",
                        height: `${rowVirtualizer.getTotalSize()}px`,
                      }}
                    >
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const rowId = rowOrder[virtualRow.index];
                        const row = rows[rowId];

                        return (
                          <Box
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            sx={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                          >
                            <Table sx={{ tableLayout: "fixed", width: "100%" }} size="small">
                              <TableBody>
                                <RowContent
                                  rowId={rowId}
                                  row={row}
                                  rows={rows}
                                  cells={cells}
                                  columns={columns}
                                  selectedCell={selectedCell}
                                  formulaMode={formulaMode}
                                  hiddenCells={hiddenCells}
                                  onCellClick={handleCellClick}
                                  onDynamicRowClick={handleDynamicRowClick}
                                />
                              </TableBody>
                            </Table>
                          </Box>
                        );
                      })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {rowOrder.length === 0 && columns.length > 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add rows from the left panel
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
});

ReportCanvas.displayName = "ReportCanvas";
