// API service for template builder

export interface TableColumn {
  columnId: number;
  columnName: string;
  label: string;
  dataType: string | null;
  selectable: "Y" | "N";
  filterable: "Y" | "N";
  aggFuncs: string;
}

export interface TableConfig {
  tableId: number;
  tableName: string;
  label: string;
  columns: TableColumn[];
}

export interface Variant {
  variantCode: string;
  variantName: string;
  description: string;
  params: {
    paramName: string;
    label: string;
    paramType: string;
    required: boolean;
    multiValued: boolean;
    uiHint: string;
  }[];
  filterRules: {
    scopeType: "ALL_DB" | "TABLE" | "DYNAMIC_TABLE";
    scopeValue?: string;
    paramName: string;
    dbColumn: string;
    operator: string;
  }[];
}

export interface Template {
  templateMeta: {
    templateId: string;
    version: string;
    description?: string;
    pageSize: string;
    pageOrientation: string;
    headerLayout?: string;
  };
  reportMeta: {
    reportName: string;
    reportId: string;
    extras: { name: string; value: string }[];
  };
  reportData: {
    columns: any[];
    rows: any[];
  };
}

export interface SaveTemplatePayload {
  template: {
    templateMeta: any;
    reportMeta: any;
    reportData: any;
  };
  variants: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/F1";

// Fetch table configurations
export const fetchTableConfigs = async (): Promise<TableConfig[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/allowed-tables/tables`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to fetch table configs");
    return await response.json();
  } catch (error) {
    console.error("Error fetching table configs:", error);

  }
};

// Fetch existing template
export const fetchTemplate = async (
  templateId: string
): Promise<{ template: Template; variants: Variant[] } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`);
    if (!response.ok) throw new Error("Failed to fetch template");
    return await response.json();
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
};

// Save template
export const saveTemplate = async (
  payload: SaveTemplatePayload
): Promise<{ success: boolean; templateId?: string; error?: string }> => {
  try {
    console.log("template in payload ::", payload);
    const response = await fetch(`${API_BASE_URL}/api/templates/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error("Failed to save template");
    const data = await response.json();
    return { success: true, templateId: data.templateId };
  } catch (error) {
    console.error("Error saving template:", error);
    return { success: false, error: (error as Error).message };
  }
};

// Save variants (requires template to be saved first)
export const saveVariants = async (
  templateId: string,
  variants: Variant[]
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/templates/${templateId}/variants`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variants }),
      }
    );
    if (!response.ok) throw new Error("Failed to save variants");
    return { success: true };
  } catch (error) {
    console.error("Error saving variants:", error);
    return { success: false, error: (error as Error).message };
  }
};
