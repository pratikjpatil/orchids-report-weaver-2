import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { TableConfig, fetchTableConfigs } from "@/services/api";

interface ConfigContextType {
  tableConfigs: TableConfig[];
  loading: boolean;
  error: string | null;
  refreshConfigs: () => Promise<void>;
  getTableByName: (tableName: string) => TableConfig | undefined;
  getSelectableColumns: (tableName: string) => string[];
  getFilterableColumns: (tableName: string) => string[];
  getAllowedAggFuncs: (tableName: string, columnName: string) => string[];
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [tableConfigs, setTableConfigs] = useState<TableConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const configs = await fetchTableConfigs();
      setTableConfigs(configs);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshConfigs();
  }, []);

  const getTableByName = (tableName: string) => {
    return tableConfigs.find((t) => t.tableName === tableName);
  };

  const getSelectableColumns = (tableName: string) => {
    const table = getTableByName(tableName);
    if (!table) return [];
    return table.columns.filter((c) => c.selectable === "Y").map((c) => c.columnName);
  };

  const getFilterableColumns = (tableName: string) => {
    const table = getTableByName(tableName);
    if (!table) return [];
    return table.columns.filter((c) => c.filterable === "Y").map((c) => c.columnName);
  };

  const getAllowedAggFuncs = (tableName: string, columnName: string) => {
    const table = getTableByName(tableName);
    if (!table) return [];
    const column = table.columns.find((c) => c.columnName === columnName);
    if (!column || !column.aggFuncs) return [];
    return column.aggFuncs.split(",").filter(Boolean);
  };

  return (
    <ConfigContext.Provider
      value={{
        tableConfigs,
        loading,
        error,
        refreshConfigs,
        getTableByName,
        getSelectableColumns,
        getFilterableColumns,
        getAllowedAggFuncs,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
