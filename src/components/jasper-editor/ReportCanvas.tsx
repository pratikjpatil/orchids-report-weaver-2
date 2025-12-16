"use client";

import { useRef, useMemo, useCallback, memo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedCell } from "@/store/templateSlice";
import {
  selectRowOrder,
  selectColumns,
  selectSelectedCell,
  selectFormulaMode,
  selectReportMeta,
  selectHiddenCells,
} from "@/store/selectors";
import type { Cell } from "@/store/templateSlice";

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
  cellId: string;
  rowId: string;
  colId: string;
  isSelected: boolean;
  formulaMode: boolean;
  columnWidth: number;
  columnAlign: string;
  isHidden: boolean;
  onCellClick: (rowId: string, cellId: string, colId: string) => void;
}

const CellComponent = memo(({
  cellId,
  rowId,
  colId,
  isSelected,
  formulaMode,
  columnWidth,
  columnAlign,
  isHidden,
  onCellClick,
}: CellComponentProps) => {
  const cell = useAppSelector(
    (state) => state.template.cells[cellId],
    (a, b) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      return (
        a.id === b.id &&
        a.type === b.type &&
        a.value === b.value &&
        a.expression === b.expression &&
        a.render?.colspan === b.render?.colspan &&
        a.render?.rowspan === b.render?.rowspan &&
        a.render?.bold === b.render?.bold &&
        a.render?.align === b.render?.align &&
        a.format?.bgColor === b.format?.bgColor
      );
    }
  );
  
  const handleClick = useCallback(() => {
    onCellClick(rowId, cellId, colId);
  }, [rowId, cellId, colId, onCellClick]);
  
  if (isHidden || !cell) return null;

  const colspan = cell.render?.colspan || 1;
  const rowspan = cell.render?.rowspan || 1;

    return (
      <Box
        onClick={handleClick}
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
          boxSizing: "border-box",
          fontWeight: cell.render?.bold ? 600 : 400,
          textAlign: cell.render?.align || columnAlign || "left",
          width: columnWidth * colspan,
          minWidth: columnWidth * colspan,
          gridColumn: colspan > 1 ? `span ${colspan}` : undefined,
          p: 1,
          zIndex: isSelected ? 10 : 1,
          "&:hover": {
            bgcolor: isSelected ? "#e3f2fd" : formulaMode ? "#fff59d" : "#f5f5f5",
            zIndex: isSelected ? 10 : 2,
          },
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
    </Box>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.cellId === nextProps.cellId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.formulaMode === nextProps.formulaMode &&
    prevProps.isHidden === nextProps.isHidden &&
    prevProps.columnWidth === nextProps.columnWidth &&
    prevProps.columnAlign === nextProps.columnAlign
  );
});

CellComponent.displayName = "CellComponent";

interface RowContentProps {
  rowId: string;
  gridTemplateColumns: string;
  selectedCellId: string | null;
  formulaMode: boolean;
  hiddenCellsMap: Map<string, boolean>;
  onCellClick: (rowId: string, cellId: string, colId: string) => void;
  onDynamicRowClick: (rowId: string) => void;
}

  const RowContent = memo(({ 
    rowId, 
    gridTemplateColumns,
    selectedCellId, 
    formulaMode, 
    hiddenCellsMap, 
    onCellClick, 
    onDynamicRowClick,
  }: RowContentProps) => {
    const row = useAppSelector((state) => state.template.rows[rowId]);
    const columns = useAppSelector(selectColumns);
  
    const handleDynamicClick = useCallback(() => {
      onDynamicRowClick(rowId);
    }, [rowId, onDynamicRowClick]);
  
    if (!row) return null;
  
    return (
      <Box
        sx={{
          display: "flex",
          borderLeft: `3px solid ${getRowTypeColor(row.rowType)}`,
          "&:hover": { bgcolor: "#f9f9f9" },
          minHeight: 60,
        }}
      >
        <Box
          sx={{
            bgcolor: "#fafafa",
            borderRight: "1px solid #e0e0e0",
            textAlign: "center",
            width: 80,
            minWidth: 80,
            flexShrink: 0,
            p: 0.5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            paddingTop: 1,
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
              mt: 0.5,
            }}
          />
        </Box>

      {row.rowType === "DYNAMIC" ? (
        <Box
          onClick={handleDynamicClick}
          sx={{
            flex: 1,
            bgcolor: selectedCellId === null ? "#c8e6c9" : "#e8f5e9",
            fontStyle: "italic",
            color: "text.secondary",
            cursor: formulaMode ? "not-allowed" : "pointer",
            border: selectedCellId === null ? "2px solid #388e3c" : "1px solid #e0e0e0",
            opacity: formulaMode ? 0.6 : 1,
            p: 1,
            "&:hover": { bgcolor: formulaMode ? "#e8f5e9" : "#c8e6c9" },
          }}
        >
          Dynamic rows from {row.dynamicConfig?.table || "database"} - Click to configure
          {formulaMode && (
            <Typography variant="caption" display="block" color="error">(Cannot use in formulas)</Typography>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns,
            flex: 1,
          }}
        >
          {row.cellIds?.map((cellId, cellIndex) => {
            const isHidden = hiddenCellsMap.get(`${rowId}-${cellId}`) || false;
            const isSelected = selectedCellId === cellId;
            const column = columns[cellIndex];

            return (
              <CellComponent
                key={cellId}
                cellId={cellId}
                rowId={rowId}
                colId={column?.id}
                isSelected={isSelected}
                formulaMode={formulaMode}
                columnWidth={column?.format?.width || 150}
                columnAlign={column?.format?.align || "left"}
                isHidden={isHidden}
                onCellClick={onCellClick}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.rowId === nextProps.rowId &&
    prevProps.selectedCellId === nextProps.selectedCellId &&
    prevProps.formulaMode === nextProps.formulaMode &&
    prevProps.hiddenCellsMap === nextProps.hiddenCellsMap &&
    prevProps.gridTemplateColumns === nextProps.gridTemplateColumns
  );
});

RowContent.displayName = "RowContent";

  export const ReportCanvas = memo(() => {
    const dispatch = useAppDispatch();
    const parentRef = useRef<HTMLDivElement>(null);
    const headerScrollRef = useRef<HTMLDivElement>(null);
  
    const rowOrder = useAppSelector(selectRowOrder);
    const columns = useAppSelector(selectColumns);
    const selectedCell = useAppSelector(selectSelectedCell);
    const formulaMode = useAppSelector(selectFormulaMode);
    const reportMeta = useAppSelector(selectReportMeta);
    const hiddenCells = useAppSelector(selectHiddenCells);

  const hiddenCellsMap = useMemo(() => {
    const map = new Map<string, boolean>();
    hiddenCells.forEach(key => map.set(key, true));
    return map;
  }, [hiddenCells]);

  const gridTemplateColumns = useMemo(
    () => columns.map(col => `${col.format?.width || 150}px`).join(" "),
    [columns]
  );

  const rowVirtualizer = useVirtualizer({
    count: rowOrder.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 60, []),
    overscan: 20,
  });

  const rows = useAppSelector((state) => state.template.rows);

  const handleCellClick = useCallback((
    rowId: string,
    cellId: string,
    colId: string,
  ) => {
    const row = rows[rowId];
    
    if (formulaMode) {
      if (row?.rowType === "DYNAMIC") return;
      const cellRef = `cell_${rowId}_${colId}`;
      window.dispatchEvent(new CustomEvent("formula-cell-selected", { detail: cellRef }));
    } else {
      dispatch(setSelectedCell({ rowId, cellId }));
    }
  }, [rows, dispatch, formulaMode]);

    const handleDynamicRowClick = useCallback((rowId: string) => {
      if (!formulaMode) {
        dispatch(setSelectedCell({ rowId, cellId: "" }));
      }
    }, [dispatch, formulaMode]);
  
    const handleScroll = useCallback(() => {
      if (parentRef.current && headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = parentRef.current.scrollLeft;
      }
    }, []);
  
    const virtualItems = rowVirtualizer.getVirtualItems();

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
                <Box
                  sx={{
                    flexShrink: 0,
                    display: "flex",
                    bgcolor: "#f5f5f5",
                    borderBottom: "2px solid #e0e0e0",
                    overflow: "hidden",
                    position: "sticky",
                    top: 0,
                    zIndex: 100,
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      minWidth: 80,
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      color: "text.secondary",
                      borderRight: "1px solid #e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 1,
                      flexShrink: 0,
                      position: "sticky",
                      left: 0,
                      bgcolor: "#f5f5f5",
                      zIndex: 101,
                    }}
                  >
                    #
                  </Box>
                  <Box
                    ref={headerScrollRef}
                    sx={{
                      flex: 1,
                      overflowX: "hidden",
                      overflowY: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns,
                      }}
                    >
                      {columns.map((col) => (
                        <Box
                          key={col.id}
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            p: 1,
                            borderRight: "1px solid #e0e0e0",
                          }}
                        >
                          {col.name}
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
                            {col.id} ({col.format?.width || 150}px)
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>

              <Box 
                ref={parentRef}
                onScroll={handleScroll}
                sx={{ 
                  flex: 1, 
                  overflow: "auto",
                  position: "relative",
                  willChange: "transform",
                }}
              >
              <Box
                sx={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const rowId = rowOrder[virtualRow.index];

                  return (
                    <Box
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <RowContent
                        rowId={rowId}
                        gridTemplateColumns={gridTemplateColumns}
                        selectedCellId={selectedCell?.cellId || null}
                        formulaMode={formulaMode}
                        hiddenCellsMap={hiddenCellsMap}
                        onCellClick={handleCellClick}
                        onDynamicRowClick={handleDynamicRowClick}
                      />
                    </Box>
                  );
                })}
              </Box>
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
