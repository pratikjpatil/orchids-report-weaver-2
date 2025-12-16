import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
  cells: Cell[];
  dynamicConfig?: DynamicConfig;
}

export interface ColumnFormat {
  width?: number;
  type?: "none" | "currency" | "number" | "date" | "percentage";
  currencySymbol?: string;
  decimals?: number;
  thousandSeparator?: boolean;
  outputFormat?: string;
  align?: "left" | "center" | "right";
  boldCondition?: string;
}

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
  rows: Row[];
  variants: Variant[];
  selectedCell: { rowIndex: number; cellIndex: number } | null;
  formulaMode: boolean;
  templateSaved: boolean;
  saving: boolean;
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
  rows: [],
  variants: [],
  selectedCell: null,
  formulaMode: false,
  templateSaved: false,
  saving: false,
};

const templateSlice = createSlice({
  name: "template",
  initialState,
  reducers: {
    setTemplate: (state, action: PayloadAction<{
      templateMeta: TemplateMeta;
      reportMeta: ReportMeta;
      reportData: { columns: Column[]; rows: Row[] };
      variants: Variant[];
    }>) => {
      state.templateMeta = action.payload.templateMeta;
      state.reportMeta = action.payload.reportMeta;
      state.columns = action.payload.reportData.columns;
      state.rows = action.payload.reportData.rows;
      state.variants = action.payload.variants;
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
        format: { width: 150 },
      };
      state.columns.push(newColumn);
      state.rows.forEach((row) => {
        if (row.rowType !== "DYNAMIC") {
          row.cells.push({ type: "TEXT", value: "" });
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
      state.rows.forEach((row) => {
        if (row.rowType !== "DYNAMIC") {
          row.cells = row.cells.filter((_, i) => i !== index);
        }
      });
    },

    addRow: (state, action: PayloadAction<{ row: Row; insertAt?: number }>) => {
      const { row, insertAt } = action.payload;
      if (insertAt !== undefined) {
        state.rows.splice(insertAt, 0, row);
      } else {
        state.rows.push(row);
      }
    },

    updateRow: (state, action: PayloadAction<{ index: number; row: Partial<Row> }>) => {
      const { index, row } = action.payload;
      if (state.rows[index]) {
        state.rows[index] = { ...state.rows[index], ...row };
      }
    },

    removeRow: (state, action: PayloadAction<{ rowId: string }>) => {
      state.rows = state.rows.filter((r) => r.id !== action.payload.rowId);
    },

    reorderRows: (state, action: PayloadAction<{ fromIndex: number; toIndex: number }>) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.rows.splice(fromIndex, 1);
      state.rows.splice(toIndex, 0, removed);
    },

    updateCell: (state, action: PayloadAction<{
      rowIndex: number;
      cellIndex: number;
      cell: Partial<Cell>;
    }>) => {
      const { rowIndex, cellIndex, cell } = action.payload;
      if (state.rows[rowIndex]?.cells?.[cellIndex]) {
        state.rows[rowIndex].cells[cellIndex] = {
          ...state.rows[rowIndex].cells[cellIndex],
          ...cell,
        };
      }
    },

    updateCellRender: (state, action: PayloadAction<{
      rowIndex: number;
      cellIndex: number;
      render: Partial<CellRender>;
    }>) => {
      const { rowIndex, cellIndex, render } = action.payload;
      if (state.rows[rowIndex]?.cells?.[cellIndex]) {
        state.rows[rowIndex].cells[cellIndex].render = {
          ...state.rows[rowIndex].cells[cellIndex].render,
          ...render,
        };
      }
    },

    updateCellFormat: (state, action: PayloadAction<{
      rowIndex: number;
      cellIndex: number;
      format: Partial<CellFormat>;
    }>) => {
      const { rowIndex, cellIndex, format } = action.payload;
      if (state.rows[rowIndex]?.cells?.[cellIndex]) {
        state.rows[rowIndex].cells[cellIndex].format = {
          ...state.rows[rowIndex].cells[cellIndex].format,
          ...format,
        };
      }
    },

    updateCellSource: (state, action: PayloadAction<{
      rowIndex: number;
      cellIndex: number;
      source: Partial<CellSource>;
    }>) => {
      const { rowIndex, cellIndex, source } = action.payload;
      if (state.rows[rowIndex]?.cells?.[cellIndex]) {
        state.rows[rowIndex].cells[cellIndex].source = {
          ...state.rows[rowIndex].cells[cellIndex].source,
          ...source,
        };
      }
    },

    updateDynamicConfig: (state, action: PayloadAction<{
      rowIndex: number;
      config: Partial<DynamicConfig>;
    }>) => {
      const { rowIndex, config } = action.payload;
      if (state.rows[rowIndex]) {
        state.rows[rowIndex].dynamicConfig = {
          ...state.rows[rowIndex].dynamicConfig,
          ...config,
        } as DynamicConfig;
      }
    },

    setSelectedCell: (state, action: PayloadAction<{ rowIndex: number; cellIndex: number } | null>) => {
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
  resetTemplate,
} = templateSlice.actions;

export default templateSlice.reducer;
