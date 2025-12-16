import { useRef, useMemo, useCallback } from "react";
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

interface ReportCanvasProps {
  template: any;
  onTemplateChange: (template: any) => void;
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  onCellSelect: (cell: { rowIndex: number; cellIndex: number } | null) => void;
  formulaMode: boolean;
}

export const ReportCanvas = ({
  template,
  onTemplateChange,
  selectedCell,
  onCellSelect,
  formulaMode,
}: ReportCanvasProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const handleCellClick = useCallback((
    rowIndex: number,
    cellIndex: number,
    rowId: string,
    colId: string,
    row: any,
    event: React.MouseEvent
  ) => {
    if (formulaMode) {
      // Don't allow selecting dynamic rows in formula mode
      if (row.rowType === "DYNAMIC") {
        return;
      }
      const cellRef = `cell_${rowId}_${colId}`;
      window.dispatchEvent(new CustomEvent("formula-cell-selected", { detail: cellRef }));
      event.stopPropagation();
    } else {
      onCellSelect({ rowIndex, cellIndex });
    }
  }, [formulaMode, onCellSelect]);

  const getCellValue = useCallback((cell: any) => {
    if (cell.type === "TEXT") return cell.value || "Click to edit";
    if (cell.type === "FORMULA") return `= ${cell.expression || "formula"}`;
    if (cell.type?.startsWith("DB_")) return `${cell.type} (${cell.source?.column || "?"})`;
    return "Empty cell";
  }, []);

  const getRowTypeColor = useCallback((type: string) => {
    const colors: Record<string, string> = {
      HEADER: "#1976d2",
      DATA: "#2c8aa8",
      SEPARATOR: "#757575",
      DYNAMIC: "#388e3c",
      FOOTER: "#f57c00",
    };
    return colors[type] || "#757575";
  }, []);

  // Calculate which cells should be hidden due to colspan/rowspan
  const hiddenCells = useMemo(() => {
    const hidden = new Set<string>();
    
    template.reportData.rows.forEach((row: any, rowIndex: number) => {
      if (row.rowType === "DYNAMIC") return;
      
      row.cells?.forEach((cell: any, cellIndex: number) => {
        const colspan = cell.render?.colspan || 1;
        const rowspan = cell.render?.rowspan || 1;

        // Mark cells to the right as hidden (due to colspan)
        for (let c = 1; c < colspan; c++) {
          hidden.add(`${rowIndex}-${cellIndex + c}`);
        }

        // Mark cells below as hidden (due to rowspan)
        for (let r = 1; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            hidden.add(`${rowIndex + r}-${cellIndex + c}`);
          }
        }
      });
    });

    return hidden;
  }, [template.reportData.rows]);

  // Virtual row renderer
  const rowVirtualizer = useVirtualizer({
    count: template.reportData.rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  // Memoized row component
  const RowContent = useCallback(({ row, rowIndex, virtualRow }: { row: any; rowIndex: number; virtualRow: any }) => {
    return (
      <TableRow
        sx={{
          "&:hover": { bgcolor: "#f9f9f9" },
          borderLeft: `3px solid ${getRowTypeColor(row.rowType)}`,
          height: virtualRow.size,
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
            colSpan={template.reportData.columns.length}
            onClick={() => onCellSelect({ rowIndex, cellIndex: -1 })}
            sx={{
              bgcolor: selectedCell?.rowIndex === rowIndex ? "#c8e6c9" : "#e8f5e9",
              fontStyle: "italic",
              color: "text.secondary",
              cursor: formulaMode ? "not-allowed" : "pointer",
              border: selectedCell?.rowIndex === rowIndex ? "2px solid #388e3c" : "1px solid #e0e0e0",
              opacity: formulaMode ? 0.6 : 1,
              "&:hover": {
                bgcolor: formulaMode ? "#e8f5e9" : "#c8e6c9",
              },
            }}
          >
            🔄 Dynamic rows from {row.dynamicConfig?.table || "database"} - Click to configure
            {formulaMode && <Typography variant="caption" display="block" color="error">(Cannot use in formulas)</Typography>}
          </TableCell>
        ) : (
          row.cells?.map((cell: any, cellIndex: number) => {
            // Skip cells that are hidden by colspan/rowspan
            if (hiddenCells.has(`${rowIndex}-${cellIndex}`)) {
              return null;
            }

            const isSelected = selectedCell?.rowIndex === rowIndex && selectedCell?.cellIndex === cellIndex;
            const colspan = cell.render?.colspan || 1;
            const rowspan = cell.render?.rowspan || 1;
            const column = template.reportData.columns[cellIndex];

            return (
              <TableCell
                key={cellIndex}
                onClick={(e) => handleCellClick(rowIndex, cellIndex, row.id, column?.id, row, e)}
                colSpan={colspan}
                rowSpan={rowspan}
                sx={{
                  cursor: formulaMode ? "crosshair" : "pointer",
                  position: "relative",
                  bgcolor: isSelected ? "#e3f2fd" : formulaMode ? "#fff9c4" : "white",
                  border: isSelected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                  fontWeight: cell.render?.bold ? 600 : 400,
                  textAlign: cell.render?.align || "left",
                  width: column?.format?.width || 150,
                  minWidth: column?.format?.width || 150,
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
  }, [selectedCell, formulaMode, hiddenCells, template.reportData.columns, getRowTypeColor, getCellValue, handleCellClick, onCellSelect]);

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
            {template.reportMeta.reportName || "Untitled Report"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {template.reportData.columns.length} cols × {template.reportData.rows.length} rows
          </Typography>
        </Box>

        {template.reportData.columns.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add columns from the left panel to get started
            </Typography>
          </Box>
        ) : (
          <Box ref={parentRef} sx={{ flex: 1, overflow: "auto" }}>
            <TableContainer>
              <Table sx={{ border: "1px solid #e0e0e0", tableLayout: "fixed" }} size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                    <TableCell sx={{ width: 80, minWidth: 80, fontWeight: 600, fontSize: "0.75rem", color: "text.secondary", borderRight: "1px solid #e0e0e0" }}>
                      #
                    </TableCell>
                    {template.reportData.columns.map((col: any, colIndex: number) => (
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
                  {template.reportData.rows.length <= 100 ? (
                    // Non-virtualized for small datasets
                    template.reportData.rows.map((row: any, rowIndex: number) => (
                      <RowContent key={rowIndex} row={row} rowIndex={rowIndex} virtualRow={{ size: 50 }} />
                    ))
                  ) : (
                    // Virtualized for large datasets
                    <>
                      {virtualRows.map((virtualRow) => {
                        const row = template.reportData.rows[virtualRow.index];
                        return (
                          <RowContent 
                            key={virtualRow.key} 
                            row={row} 
                            rowIndex={virtualRow.index} 
                            virtualRow={virtualRow}
                          />
                        );
                      })}
                    </>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {template.reportData.rows.length === 0 && template.reportData.columns.length > 0 && (
          <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
            <Typography variant="body1" gutterBottom>
              Add rows from the left panel
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
