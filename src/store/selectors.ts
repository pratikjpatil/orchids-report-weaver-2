import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import type { Row, Cell } from "./templateSlice";

const selectTemplate = (state: RootState) => state.template;

export const selectTemplateMeta = createSelector(
  [selectTemplate],
  (template) => template.templateMeta
);

export const selectReportMeta = createSelector(
  [selectTemplate],
  (template) => template.reportMeta
);

export const selectColumns = createSelector(
  [selectTemplate],
  (template) => template.columns
);

export const selectRowOrder = createSelector(
  [selectTemplate],
  (template) => template.rowOrder
);

export const selectRowsEntities = createSelector(
  [selectTemplate],
  (template) => template.rows
);

export const selectCellsEntities = createSelector(
  [selectTemplate],
  (template) => template.cells
);

export const selectRows = createSelector(
  [selectRowOrder, selectRowsEntities, selectCellsEntities],
  (rowOrder, rows, cells) => {
    return rowOrder.map(rowId => {
      const row = rows[rowId];
      const rowCells = row.cellIds.map(cellId => cells[cellId]);
      return {
        ...row,
        cells: rowCells,
      };
    });
  }
);

export const selectRowById = createSelector(
  [selectRowsEntities, selectCellsEntities, (_: RootState, rowId: string) => rowId],
  (rows, cells, rowId) => {
    const row = rows[rowId];
    if (!row) return null;
    const rowCells = row.cellIds.map(cellId => cells[cellId]);
    return {
      ...row,
      cells: rowCells,
    };
  }
);

export const selectVariants = createSelector(
  [selectTemplate],
  (template) => template.variants
);

export const selectSelectedCell = createSelector(
  [selectTemplate],
  (template) => template.selectedCell
);

export const selectFormulaMode = createSelector(
  [selectTemplate],
  (template) => template.formulaMode
);

export const selectSaving = createSelector(
  [selectTemplate],
  (template) => template.saving
);

export const selectTemplateSaved = createSelector(
  [selectTemplate],
  (template) => template.templateSaved
);

export const selectRowCount = createSelector(
  [selectRowOrder],
  (rowOrder) => rowOrder.length
);

export const selectColumnCount = createSelector(
  [selectColumns],
  (columns) => columns.length
);

export const selectCellById = createSelector(
  [selectCellsEntities, (_: RootState, cellId: string) => cellId],
  (cells, cellId) => cells[cellId]
);

export const selectSelectedRow = createSelector(
  [selectRowsEntities, selectSelectedCell],
  (rows, selectedCell) => selectedCell ? rows[selectedCell.rowId] : null
);

export const selectSelectedCellData = createSelector(
  [selectCellsEntities, selectSelectedCell],
  (cells, selectedCell) => {
    if (!selectedCell) return null;
    return cells[selectedCell.cellId] || null;
  }
);

export const selectSelectedColumn = createSelector(
  [selectColumns, selectSelectedRow, selectCellsEntities, selectSelectedCell],
  (columns, row, cells, selectedCell) => {
    if (!row || !selectedCell) return null;
    const cellIndex = row.cellIds.indexOf(selectedCell.cellId);
    return cellIndex >= 0 ? columns[cellIndex] : null;
  }
);

// Optimized: Build span map once and cache it
const buildSpanMapOptimized = createSelector(
  [selectRowOrder, selectRowsEntities, selectCellsEntities],
  (rowOrder, rows, cells) => {
    const spanMap = new Map<string, { colspan: number; rowspan: number; rowIndex: number; cellIndex: number }>();
    
    for (let rowIndex = 0; rowIndex < rowOrder.length; rowIndex++) {
      const rowId = rowOrder[rowIndex];
      const row = rows[rowId];
      
      if (row.rowType === "DYNAMIC") continue;
      
      for (let cellIndex = 0; cellIndex < row.cellIds.length; cellIndex++) {
        const cellId = row.cellIds[cellIndex];
        const cell = cells[cellId];
        
        if (!cell) continue;
        
        const colspan = cell.render?.colspan || 1;
        const rowspan = cell.render?.rowspan || 1;
        
        if (colspan > 1 || rowspan > 1) {
          spanMap.set(`${rowId}-${cellId}`, { colspan, rowspan, rowIndex, cellIndex });
        }
      }
    }
    
    return spanMap;
  }
);

// Optimized: Use the cached span map
export const selectHiddenCells = createSelector(
  [selectRowOrder, selectRowsEntities, buildSpanMapOptimized],
  (rowOrder, rows, spanMap) => {
    const hidden = new Set<string>();
    
    // Iterate through cells with spans only (much faster)
    spanMap.forEach((span, key) => {
      const [rowId, cellId] = key.split('-');
      const { colspan, rowspan, rowIndex, cellIndex } = span;
      const row = rows[rowId];
      
      // Hide cells affected by colspan
      for (let c = 1; c < colspan; c++) {
        const hiddenCellId = row.cellIds[cellIndex + c];
        if (hiddenCellId) {
          hidden.add(`${rowId}-${hiddenCellId}`);
        }
      }
      
      // Hide cells affected by rowspan
      for (let r = 1; r < rowspan; r++) {
        const targetRowId = rowOrder[rowIndex + r];
        if (!targetRowId) continue;
        
        const targetRow = rows[targetRowId];
        if (!targetRow || targetRow.rowType === "DYNAMIC") continue;
        
        for (let c = 0; c < colspan; c++) {
          const hiddenCellId = targetRow.cellIds[cellIndex + c];
          if (hiddenCellId) {
            hidden.add(`${targetRowId}-${hiddenCellId}`);
          }
        }
      }
    });
    
    return hidden;
  }
);

export const selectTableNames = createSelector(
  [selectRowsEntities, selectCellsEntities],
  (rows, cells) => {
    const tables = new Set<string>();
    
    Object.values(rows).forEach((row) => {
      row.cellIds.forEach((cellId) => {
        const cell = cells[cellId];
        if (cell?.source?.table) {
          tables.add(cell.source.table);
        }
      });
      
      if (row.dynamicConfig?.table) {
        tables.add(row.dynamicConfig.table);
      }
    });
    
    return Array.from(tables);
  }
);

export const selectDynamicRowIds = createSelector(
  [selectRowsEntities],
  (rows) => Object.values(rows)
    .filter((row) => row.rowType === "DYNAMIC")
    .map((row) => row.id)
);

export const selectExistingRowIds = createSelector(
  [selectRowOrder],
  (rowOrder) => rowOrder
);

export const selectTemplateForExport = createSelector(
  [selectTemplateMeta, selectReportMeta, selectColumns, selectRows, selectVariants],
  (templateMeta, reportMeta, columns, rows, variants) => ({
    templateMeta,
    reportMeta,
    reportData: { columns, rows },
    variants,
  })
);

export const selectTemplateColumns = createSelector(
  [selectColumns],
  (columns) => columns.map((col) => ({ id: col.id, name: col.name }))
);

export const selectRowHeights = createSelector(
  [selectTemplate],
  (template) => template.rowHeights
);

export const selectRowHeight = createSelector(
  [selectRowsEntities, (_: RootState, rowId: string) => rowId],
  (rows, rowId) => rows[rowId]?.height || 60
);
