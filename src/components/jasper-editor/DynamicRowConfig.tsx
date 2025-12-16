import { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Autocomplete from "@mui/material/Autocomplete";
import Alert from "@mui/material/Alert";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FilterBuilder } from "./FilterBuilder";
import { useConfig } from "@/contexts/ConfigContext";

interface ColumnMapping {
  templateColumnId: string;
  dbColumn: string;
}

interface DynamicRowConfigProps {
  dynamicConfig: any;
  templateColumns: { id: string; name: string }[];
  onConfigChange: (config: any) => void;
}

export const DynamicRowConfig = ({
  dynamicConfig,
  templateColumns,
  onConfigChange,
}: DynamicRowConfigProps) => {
  const { tableConfigs, getSelectableColumns, loading } = useConfig();
  const [selectedTableValue, setSelectedTableValue] = useState<string | null>(null);
  const [mappingsExpanded, setMappingsExpanded] = useState(false);

  useEffect(() => {
    setSelectedTableValue(dynamicConfig.table || null);
  }, [dynamicConfig.table]);

  const updateConfig = (updates: Record<string, any>) => {
    onConfigChange({ ...dynamicConfig, ...updates });
  };

  const selectableColumns = selectedTableValue ? getSelectableColumns(selectedTableValue) : [];

  const getColumnMappings = (): ColumnMapping[] => {
    if (dynamicConfig.columnMappings && Array.isArray(dynamicConfig.columnMappings)) {
      const existingMappings = dynamicConfig.columnMappings as ColumnMapping[];
      const existingIds = existingMappings.map(m => m.templateColumnId);
      
      const newMappings = [...existingMappings];
      templateColumns.forEach(col => {
        if (!existingIds.includes(col.id)) {
          newMappings.push({ templateColumnId: col.id, dbColumn: "" });
        }
      });
      
      return newMappings;
    }
    return templateColumns.map(col => ({ templateColumnId: col.id, dbColumn: "" }));
  };

  const columnMappings = getColumnMappings();

  const handleTableChange = (newTableName: string | null) => {
    setSelectedTableValue(newTableName);
    
    const resetMappings = templateColumns.map(col => ({ 
      templateColumnId: col.id, 
      dbColumn: "" 
    }));
    
    updateConfig({
      table: newTableName || "",
      columnMappings: resetMappings,
      select: [],
    });
  };

  const handleColumnMappingChange = (templateColumnId: string, dbColumn: string | null) => {
    const newMappings = columnMappings.map(mapping =>
      mapping.templateColumnId === templateColumnId
        ? { ...mapping, dbColumn: dbColumn || "" }
        : mapping
    );

    const selectedDbColumns = newMappings
      .filter(m => m.dbColumn)
      .map(m => m.dbColumn);

    updateConfig({
      columnMappings: newMappings,
      select: selectedDbColumns,
    });
  };

  const getDbColumnForTemplate = (templateColumnId: string): string => {
    const mapping = columnMappings.find(m => m.templateColumnId === templateColumnId);
    return mapping?.dbColumn || "";
  };

  const mappedColumnsCount = columnMappings.filter(m => m.dbColumn).length;
  const hasValidationError = selectedTableValue && templateColumns.length > 0 && mappedColumnsCount === 0;

  const tableOptions = tableConfigs.map(t => ({
    value: t.tableName,
    label: `${t.tableName} (${t.label})`,
  }));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="caption" fontWeight={600} color="text.secondary">
        DYNAMIC ROW CONFIGURATION
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={dynamicConfig.type || "DB_LIST"}
          onChange={(e) => updateConfig({ type: e.target.value })}
          label="Type"
        >
          <MenuItem value="DB_LIST">Database List</MenuItem>
        </Select>
      </FormControl>

      <Autocomplete
        size="small"
        options={tableOptions}
        value={tableOptions.find(opt => opt.value === selectedTableValue) || null}
        onChange={(_, newValue) => handleTableChange(newValue?.value || null)}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        loading={loading}
        renderInput={(params) => (
          <TextField 
            {...params} 
            label="Table" 
            placeholder="Select table..."
          />
        )}
        fullWidth
      />

      {selectedTableValue && (
        <>
          {/* Collapsible Column Mappings */}
          <Accordion 
            expanded={mappingsExpanded} 
            onChange={() => setMappingsExpanded(!mappingsExpanded)}
            sx={{ 
              bgcolor: "#f5f5f5",
              '&:before': { display: 'none' },
              boxShadow: 'none',
              border: '1px solid #e0e0e0',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  COLUMN MAPPINGS
                </Typography>
                <Chip 
                  label={`${mappedColumnsCount}/${templateColumns.length}`} 
                  size="small" 
                  color={mappedColumnsCount > 0 ? "success" : "default"}
                  sx={{ height: 20, fontSize: '0.7rem' }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
                Map template columns to database columns
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {templateColumns.map((templateCol) => {
                  const currentDbColumn = getDbColumnForTemplate(templateCol.id);
                  const columnOptions = [
                    { value: "", label: "(Empty)" },
                    ...selectableColumns.map(col => ({ value: col, label: col }))
                  ];
                  const currentOption = columnOptions.find(opt => opt.value === currentDbColumn) || columnOptions[0];

                  return (
                    <Box
                      key={templateCol.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 0.75,
                        bgcolor: "background.paper",
                        borderRadius: 1,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Box sx={{ flex: '0 0 90px', overflow: 'hidden' }}>
                        <Typography variant="caption" fontWeight={500} noWrap title={templateCol.name}>
                          {templateCol.name}
                        </Typography>
                      </Box>

                      <Typography variant="caption" color="text.secondary">→</Typography>

                      <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                        <Select
                          value={currentOption.value}
                          onChange={(e) => handleColumnMappingChange(templateCol.id, e.target.value || "")}
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {columnOptions.map(opt => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem' }}>
                              {opt.value === "" ? <em>Empty</em> : opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  );
                })}
              </Box>

              {hasValidationError && (
                <Alert severity="warning" sx={{ mt: 1.5, py: 0.5 }}>
                  Map at least one column
                </Alert>
              )}
            </AccordionDetails>
          </Accordion>

          <FilterBuilder
            filters={dynamicConfig.filters || {}}
            onFiltersChange={(filters) => updateConfig({ filters })}
            tableName={selectedTableValue}
          />

          <TextField
            label="Order By"
            size="small"
            value={dynamicConfig.orderby || ""}
            onChange={(e) => updateConfig({ orderby: e.target.value })}
            placeholder="e.g., BALANCE_DATE DESC"
            fullWidth
          />

          <TextField
            label="Limit"
            type="number"
            size="small"
            value={dynamicConfig.limit || ""}
            onChange={(e) => updateConfig({ limit: parseInt(e.target.value) || "" })}
            placeholder="e.g., 100"
            fullWidth
          />
        </>
      )}

      <Box sx={{ p: 1, bgcolor: "#e3f2fd", borderRadius: 1 }}>
        <Typography variant="caption" color="primary.dark">
          <strong>Note:</strong> Dynamic rows generate multiple rows from query results.
        </Typography>
      </Box>
    </Box>
  );
};
