import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";

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

export const selectRows = createSelector(
  [selectTemplate],
  (template) => template.rows
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
  [selectRows],
  (rows) => rows.length
);

export const selectColumnCount = createSelector(
  [selectColumns],
  (columns) => columns.length
);

export const selectRowById = createSelector(
  [selectRows, (_: RootState, rowIndex: number) => rowIndex],
  (rows, rowIndex) => rows[rowIndex]
);

export const selectColumnById = createSelector(
  [selectColumns, (_: RootState, colIndex: number) => colIndex],
  (columns, colIndex) => columns[colIndex]
);

export const selectCellByPosition = createSelector(
  [
    selectRows,
    (_: RootState, rowIndex: number) => rowIndex,
    (_: RootState, __: number, cellIndex: number) => cellIndex,
  ],
  (rows, rowIndex, cellIndex) => rows[rowIndex]?.cells?.[cellIndex]
);

export const selectSelectedRow = createSelector(
  [selectRows, selectSelectedCell],
  (rows, selectedCell) => selectedCell ? rows[selectedCell.rowIndex] : null
);

export const selectSelectedCellData = createSelector(
  [selectSelectedRow, selectSelectedCell],
  (row, selectedCell) => {
    if (!row || !selectedCell || selectedCell.cellIndex < 0) return null;
    return row.cells?.[selectedCell.cellIndex] || null;
  }
);

export const selectSelectedColumn = createSelector(
  [selectColumns, selectSelectedCell],
  (columns, selectedCell) => selectedCell ? columns[selectedCell.cellIndex] : null
);

export const selectHiddenCells = createSelector(
  [selectRows],
  (rows) => {
    const hidden = new Set<string>();
    rows.forEach((row, rowIndex) => {
      if (row.rowType === "DYNAMIC") return;
      row.cells?.forEach((cell, cellIndex) => {
        const colspan = cell.render?.colspan || 1;
        const rowspan = cell.render?.rowspan || 1;
        for (let c = 1; c < colspan; c++) {
          hidden.add(`${rowIndex}-${cellIndex + c}`);
        }
        for (let r = 1; r < rowspan; r++) {
          for (let c = 0; c < colspan; c++) {
            hidden.add(`${rowIndex + r}-${cellIndex + c}`);
          }
        }
      });
    });
    return hidden;
  }
);

export const selectTableNames = createSelector(
  [selectRows],
  (rows) => {
    const tables = new Set<string>();
    rows.forEach((row) => {
      row.cells?.forEach((cell) => {
        if (cell.source?.table) {
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
  [selectRows],
  (rows) => rows.filter((row) => row.rowType === "DYNAMIC").map((row) => row.id)
);

export const selectExistingRowIds = createSelector(
  [selectRows],
  (rows) => rows.map((row) => row.id)
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
