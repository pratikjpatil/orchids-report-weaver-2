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
  selectRows,
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

interface RowContentProps {
  row: Row;
  rowIndex: number;
  columns: Column[];
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  formulaMode: boolean;
  hiddenCells: Set<string>;
  onCellClick: (rowIndex: number, cellIndex: number, rowId: string, colId: string, row: Row, event: React.MouseEvent) => void;
  onDynamicRowClick: (rowIndex: number) => void;
}

const RowContent = memo(({
  row,
  rowIndex,
  columns,
  selectedCell,
  formulaMode,
  hiddenCells,
  onCellClick,
  onDynamicRowClick,
}: RowContentProps) => {
  return (
    <TableRow
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
          onClick={() => onDynamicRowClick(rowIndex)}
          sx={{
            bgcolor: selectedCell?.rowIndex === rowIndex ? "#c8e6c9" : "#e8f5e9",
            fontStyle: "italic",
            color: "text.secondary",
            cursor: formulaMode ? "not-allowed" : "pointer",
            border: selectedCell?.rowIndex === rowIndex ? "2px solid #388e3c" : "1px solid #e0e0e0",
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
        row.cells?.map((cell, cellIndex) => {
          if (hiddenCells.has(`${rowIndex}-${cellIndex}`)) return null;

          const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.cellIndex === cellIndex;
          const colspan = cell.render?.colspan || 1;
          const rowspan = cell.render?.rowspan || 1;
          const column = columns[cellIndex];

          return (
            <TableCell
              key={cellIndex}
              onClick={(e) => onCellClick(rowIndex, cellIndex, row.id, column?.id, row, e)}
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
        })
      )}
    </TableRow>
  );
});

RowContent.displayName = "RowContent";

export const ReportCanvas = memo(() => {
  const dispatch = useAppDispatch();
  const parentRef = useRef<HTMLDivElement>(null);

  const rows = useAppSelector(selectRows);
  const columns = useAppSelector(selectColumns);
  const selectedCell = useAppSelector(selectSelectedCell);
  const formulaMode = useAppSelector(selectFormulaMode);
  const reportMeta = useAppSelector(selectReportMeta);
  const hiddenCells = useAppSelector(selectHiddenCells);

  const handleCellClick = useCallback((
    rowIndex: number,
    cellIndex: number,
    rowId: string,
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
      dispatch(setSelectedCell({ rowIndex, cellIndex }));
    }
  }, [dispatch, formulaMode]);

  const handleDynamicRowClick = useCallback((rowIndex: number) => {
    if (!formulaMode) {
      dispatch(setSelectedCell({ rowIndex, cellIndex: -1 }));
    }
  }, [dispatch, formulaMode]);

    const rowVirtualizer = useVirtualizer({
      count: rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: useCallback(() => 60, []),
      overscan: 20,
      measureElement: typeof window !== "undefined" && navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => {
            const height = element?.getBoundingClientRect().height;
            return height && height > 0 ? height : 60;
          }
        : undefined,
      scrollMargin: parentRef.current?.offsetTop ?? 0,
      lanes: 1,
    });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualRows.length > 0 ? virtualRows[0]?.start ?? 0 : 0;
  const paddingBottom = virtualRows.length > 0 
    ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) 
    : 0;

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
            {columns.length} cols × {rows.length} rows
          </Typography>
        </Box>

        {columns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add columns from the left panel to get started
            </Typography>
          </Box>
        ) : (
          <Box 
            ref={parentRef} 
            sx={{ 
              flex: 1, 
              overflow: "auto",
              contain: "strict",
            }}
          >
            <TableContainer sx={{ height: "100%" }}>
              <Table sx={{ border: "1px solid #e0e0e0", tableLayout: "fixed" }} size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5", position: "sticky", top: 0, zIndex: 10 }}>
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
                <TableBody>
                  {rows.length <= 100 ? (
                    rows.map((row, rowIndex) => (
                      <RowContent
                        key={row.id}
                        row={row}
                        rowIndex={rowIndex}
                        columns={columns}
                        selectedCell={selectedCell}
                        formulaMode={formulaMode}
                        hiddenCells={hiddenCells}
                        onCellClick={handleCellClick}
                        onDynamicRowClick={handleDynamicRowClick}
                      />
                    ))
                  ) : (
                    <>
                      {paddingTop > 0 && (
                        <tr><td style={{ height: paddingTop }} /></tr>
                      )}
                      {virtualRows.map((virtualRow) => {
                        const row = rows[virtualRow.index];
                        return (
                          <RowContent
                            key={row.id}
                            row={row}
                            rowIndex={virtualRow.index}
                            columns={columns}
                            selectedCell={selectedCell}
                            formulaMode={formulaMode}
                            hiddenCells={hiddenCells}
                            onCellClick={handleCellClick}
                            onDynamicRowClick={handleDynamicRowClick}
                          />
                        );
                      })}
                      {paddingBottom > 0 && (
                        <tr><td style={{ height: paddingBottom }} /></tr>
                      )}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {rows.length === 0 && columns.length > 0 && (
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
