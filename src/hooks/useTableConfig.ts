import { useAppSelector } from "@/store";
import { TableConfig } from "@/services/api";

export const useTableConfig = () => {
  const { tableConfigs, loading, error } = useAppSelector((state) => state.config);

  const getTableByName = (tableName: string): TableConfig | undefined => {
    return tableConfigs.find((t) => t.tableName === tableName);
  };

  const getSelectableColumns = (tableName: string): string[] => {
    const table = getTableByName(tableName);
    if (!table) return [];
    return table.columns.filter((c) => c.selectable === "Y").map((c) => c.columnName);
  };

  const getFilterableColumns = (tableName: string): string[] => {
    const table = getTableByName(tableName);
    if (!table) return [];
    return table.columns.filter((c) => c.filterable === "Y").map((c) => c.columnName);
  };

  const getAllowedAggFuncs = (tableName: string, columnName: string): string[] => {
    const table = getTableByName(tableName);
    if (!table) return [];
    const column = table.columns.find((c) => c.columnName === columnName);
    if (!column || !column.aggFuncs) return [];
    return column.aggFuncs.split(",").filter(Boolean);
  };

  const getColumnDataType = (tableName: string, columnName: string): string | null => {
    const table = getTableByName(tableName);
    if (!table) return null;
    const column = table.columns.find((c) => c.columnName === columnName);
    return column?.dataType || null;
  };

  return {
    tableConfigs,
    loading,
    error,
    getTableByName,
    getSelectableColumns,
    getFilterableColumns,
    getAllowedAggFuncs,
    getColumnDataType,
  };
};
