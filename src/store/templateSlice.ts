import { createSlice, PayloadAction, nanoid } from "@reduxjs/toolkit";
import { produce } from "immer";

export interface CellFormat {
  type?: "none" | "currency" | "number" | "date" | "percentage";
  currencySymbol?: string;
  decimals?: number;
  thousandSeparator?: boolean;
  outputFormat?: string;
  bgColor?: string;
}

export interface CellRender {
  bold?: boolean;
  align?: "left" | "center" | "right";
  colspan?: number;
  rowspan?: number;
}

export interface CellSource {
  table?: string;
  column?: string;
  filters?: Record<string, FilterCondition[]>;
}

export interface FilterCondition {
  op: string;
  value: string | string[] | null;
}

export interface Cell {
  id: string;
  type: string;
  value?: string;
  expression?: string;
  variables?: Record<string, string>;
  source?: CellSource;
  render?: CellRender;
  format?: CellFormat;
}

export interface DynamicConfig {
  type: string;
  table: string;
  select: string[];
  filters: Record<string, FilterCondition[]>;
  columnMappings: { templateColumnId: string; dbColumn: string }[];
  orderby?: string;
  limit?: number;
}

export interface Row {
  id: string;
  rowType: "HEADER" | "DATA" | "SEPARATOR" | "DYNAMIC" | "FOOTER";
  cellIds: string[];
  dynamicConfig?: DynamicConfig;
  height?: number;
}

export interface ColumnFormat {
  width?: number;
  relativeWidth?: number;
  type?: "none" | "currency" | "number" | "date" | "percentage";
  currencySymbol?: string;
  decimals?: number;
  thousandSeparator?: boolean;
  outputFormat?: string;
  align?: "left" | "center" | "right";
  boldCondition?: string;
}

export const PDF_WIDTH_MULTIPLIER = 0.75;
export const DEFAULT_RELATIVE_WIDTH = 1;

export interface Column {
  id: string;
  name: string;
  format?: ColumnFormat;
}

export interface TemplateMeta {
  templateId: string;
  version: number;
  pageSize: string;
  pageOrientation: string;
  description?: string;
}

export interface ReportMeta {
  reportName: string;
  reportId: string;
  extras: { name: string; value: string }[];
}

export interface Param {
  paramName: string;
  label: string;
  paramType: "STRING" | "DATE" | "NUMBER" | "BOOLEAN";
  required: boolean;
  multiValued: boolean;
  uiHint: string;
}

export interface FilterRule {
  scopeType: "ALL_DB" | "TABLE" | "DYNAMIC_TABLE";
  scopeValue?: string;
  paramName: string;
  dbColumn: string;
  operator: string;
}

export interface Variant {
  variantCode: string;
  variantName: string;
  description: string;
  params: Param[];
  filterRules: FilterRule[];
}

export interface TemplateState {
  templateMeta: TemplateMeta;
  reportMeta: ReportMeta;
  columns: Column[];
  rowOrder: string[];
  rows: Record<string, Row>;
  cells: Record<string, Cell>;
  variants: Variant[];
  selectedCell: { rowId: string; cellId: string } | null;
  formulaMode: boolean;
  templateSaved: boolean;
  saving: boolean;
  rowHeights: Record<string, number>;
}

const initialState: TemplateState = {
  templateMeta: {
    templateId: "",
    version: 1,
    pageSize: "A4",
    pageOrientation: "portrait",
  },
  reportMeta: {
    reportName: "",
    reportId: "",
    extras: [
      { name: "Report Date", value: new Date().toISOString().split("T")[0] },
    ],
  },
  columns: [],
  rowOrder: [],
  rows: {},
  cells: {},
  variants: [],
  selectedCell: null,
  formulaMode: false,
  templateSaved: false,
  saving: false,
  rowHeights: {},
};

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    setTemplate: (state, action: PayloadAction<{
      templateMeta: TemplateMeta;
      reportMeta: ReportMeta;
      reportData: { columns: Column[]; rows: any[] };
      variants: Variant[];
    }>) => {
      const { templateMeta, reportMeta, reportData, variants } = action.payload;
      
      state.templateMeta = templateMeta;
      state.reportMeta = reportMeta;
      state.columns = reportData.columns;
      state.variants = variants;
      
      const newCells: Record<string, Cell> = {};
      const newRows: Record<string, Row> = {};
      const newRowOrder: string[] = [];
      
      reportData.rows.forEach((row: any) => {
        const rowId = row.id;
        newRowOrder.push(rowId);
        
        const cellIds: string[] = [];
        if (row.rowType !== "DYNAMIC" && row.cells) {
          row.cells.forEach((cell: any) => {
            const cellId = cell.id || nanoid();
            cellIds.push(cellId);
            newCells[cellId] = { ...cell, id: cellId };
          });
        }
        
        newRows[rowId] = {
          id: rowId,
          rowType: row.rowType,
          cellIds,
          dynamicConfig: row.dynamicConfig,
          height: row.height || 60,
        };
      });
      
      state.cells = newCells;
      state.rows = newRows;
      state.rowOrder = newRowOrder;
    },

    setTemplateMeta: (state, action: PayloadAction<Partial<TemplateMeta>>) => {
      state.templateMeta = { ...state.templateMeta, ...action.payload };
    },

    setReportMeta: (state, action: PayloadAction<Partial<ReportMeta>>) => {
      state.reportMeta = { ...state.reportMeta, ...action.payload };
    },

      addColumn: (state) => {
        const newColumn: Column = {
          id: `C__${state.columns.length + 1}`,
          name: `Column ${state.columns.length + 1}`,
          format: { width: 150, relativeWidth: DEFAULT_RELATIVE_WIDTH },
        };
        state.columns.push(newColumn);
      
      state.rowOrder.forEach((rowId) => {
        const row = state.rows[rowId];
        if (row.rowType !== "DYNAMIC") {
          const newCellId = nanoid();
          row.cellIds.push(newCellId);
          state.cells[newCellId] = {
            id: newCellId,
            type: "TEXT",
            value: "",
          };
        }
      });
    },

    updateColumn: (state, action: PayloadAction<{ index: number; column: Partial<Column> }>) => {
      const { index, column } = action.payload;
      if (state.columns[index]) {
        state.columns[index] = { ...state.columns[index], ...column };
      }
    },

    updateColumnFormat: (state, action: PayloadAction<{ index: number; format: Partial<ColumnFormat> }>) => {
      const { index, format } = action.payload;
      if (state.columns[index]) {
        state.columns[index].format = { ...state.columns[index].format, ...format };
      }
    },

    removeColumn: (state, action: PayloadAction<{ colId: string; index: number }>) => {
      const { colId, index } = action.payload;
      state.columns = state.columns.filter((c) => c.id !== colId);
      
      state.rowOrder.forEach((rowId) => {
        const row = state.rows[rowId];
        if (row.rowType !== "DYNAMIC" && row.cellIds.length > index) {
          const removedCellId = row.cellIds[index];
          delete state.cells[removedCellId];
          row.cellIds.splice(index, 1);
        }
      });
    },

    addRow: (state, action: PayloadAction<{ row: any; insertAt?: number }>) => {
      const { row, insertAt } = action.payload;
      const rowId = row.id;
      
      const cellIds: string[] = [];
      if (row.rowType !== "DYNAMIC") {
        state.columns.forEach(() => {
          const cellId = nanoid();
          cellIds.push(cellId);
          state.cells[cellId] = {
            id: cellId,
            type: "TEXT",
            value: "",
          };
        });
      }
      
      state.rows[rowId] = {
        id: rowId,
        rowType: row.rowType,
        cellIds,
        dynamicConfig: row.dynamicConfig,
        height: 60,
      };
      
      if (insertAt !== undefined) {
        state.rowOrder.splice(insertAt, 0, rowId);
      } else {
        state.rowOrder.push(rowId);
      }
    },

    updateRow: (state, action: PayloadAction<{ rowId: string; row: Partial<Row> }>) => {
      const { rowId, row } = action.payload;
      if (state.rows[rowId]) {
        state.rows[rowId] = { ...state.rows[rowId], ...row };
      }
    },

    removeRow: (state, action: PayloadAction<{ rowId: string }>) => {
      const { rowId } = action.payload;
      const row = state.rows[rowId];
      
      if (row) {
        row.cellIds.forEach((cellId) => {
          delete state.cells[cellId];
        });
        delete state.rows[rowId];
        delete state.rowHeights[rowId];
        state.rowOrder = state.rowOrder.filter((id) => id !== rowId);
      }
    },

    reorderRows: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.rowOrder.splice(fromIndex, 1);
      state.rowOrder.splice(toIndex, 0, removed);
    },

    updateCell: (state, action: PayloadAction<{
      cellId: string;
      cell: Partial<Cell>;
    }>) => {
      const { cellId, cell } = action.payload;
      if (state.cells[cellId]) {
        state.cells[cellId] = { ...state.cells[cellId], ...cell };
      }
    },

    updateCellRender: (state, action: PayloadAction<{
      cellId: string;
      render: Partial<CellRender>;
    }>) => {
      const { cellId, render } = action.payload;
      if (state.cells[cellId]) {
        state.cells[cellId].render = {
          ...state.cells[cellId].render,
          ...render,
        };
      }
    },

    updateCellFormat: (state, action: PayloadAction<{
      cellId: string;
      format: Partial<CellFormat>;
    }>) => {
      const { cellId, format } = action.payload;
      if (state.cells[cellId]) {
        state.cells[cellId].format = {
          ...state.cells[cellId].format,
          ...format,
        };
      }
    },

    updateCellSource: (state, action: PayloadAction<{
      cellId: string;
      source: Partial<CellSource>;
    }>) => {
      const { cellId, source } = action.payload;
      if (state.cells[cellId]) {
        state.cells[cellId].source = {
          ...state.cells[cellId].source,
          ...source,
        };
      }
    },

    updateDynamicConfig: (state, action: PayloadAction<{
      rowId: string;
      config: Partial<DynamicConfig>;
    }>) => {
      const { rowId, config } = action.payload;
      if (state.rows[rowId]) {
        state.rows[rowId].dynamicConfig = {
          ...state.rows[rowId].dynamicConfig,
          ...config,
        } as DynamicConfig;
      }
    },

    setSelectedCell: (state, action: PayloadAction<{ rowId: string; cellId: string } | null>) => {
      state.selectedCell = action.payload;
    },

    setFormulaMode: (state, action: PayloadAction<boolean>) => {
      state.formulaMode = action.payload;
    },

    setVariants: (state, action: PayloadAction<Variant[]>) => {
      state.variants = action.payload;
    },

    addVariant: (state, action: PayloadAction<Variant>) => {
      state.variants.push(action.payload);
    },

    updateVariant: (state, action: PayloadAction<{ index: number; variant: Variant }>) => {
      const { index, variant } = action.payload;
      if (state.variants[index]) {
        state.variants[index] = variant;
      }
    },

    removeVariant: (state, action: PayloadAction<number>) => {
      state.variants.splice(action.payload, 1);
    },

    setSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },

    setTemplateSaved: (state, action: PayloadAction<boolean>) => {
      state.templateSaved = action.payload;
    },

    setRowHeight: (state, action: PayloadAction<{ rowId: string; height: number }>) => {
      const { rowId, height } = action.payload;
      state.rowHeights[rowId] = height;
      if (state.rows[rowId]) {
        state.rows[rowId].height = height;
      }
    },

    resetTemplate: () => initialState,
  },
});

export const {
  setTemplate,
  setTemplateMeta,
  setReportMeta,
  addColumn,
  updateColumn,
  updateColumnFormat,
  removeColumn,
  addRow,
  updateRow,
  removeRow,
  reorderRows,
  updateCell,
  updateCellRender,
  updateCellFormat,
  updateCellSource,
  updateDynamicConfig,
  setSelectedCell,
  setFormulaMode,
  setVariants,
  addVariant,
  updateVariant,
  removeVariant,
  setSaving,
  setTemplateSaved,
  setRowHeight,
  resetTemplate,
} = templateSlice.actions;

export default templateSlice.reducer;
