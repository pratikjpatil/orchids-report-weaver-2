import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MetadataEditor } from "./MetadataEditor";
import { ColumnManager } from "./ColumnManager";
import { RowManager } from "./RowManager";
import { JsonPreview } from "./JsonPreview";
import { Settings, Columns, Rows, Code } from "lucide-react";

interface TemplateBuilderProps {
  onTemplateChange: (template: any) => void;
}

export const TemplateBuilder = ({ onTemplateChange }: TemplateBuilderProps) => {
  const [metadata, setMetadata] = useState({
    templateId: "",
    reportId: "",
    version: "v1",
    meta: {
      reportName: "",
      reportDate: new Date().toISOString().split("T")[0],
      circleCode: "",
      branchCode: "",
      pageSize: "A4",
      pageOrientation: "portrait",
    },
  });

  const [columns, setColumns] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);

  const updateTemplate = (updatedMetadata?: any, updatedColumns?: any[], updatedRows?: any[]) => {
    const template = {
      ...(updatedMetadata || metadata),
      columns: updatedColumns || columns,
      rows: updatedRows || rows,
    };
    onTemplateChange(template);
  };

  const handleMetadataChange = (newMetadata: any) => {
    setMetadata(newMetadata);
    updateTemplate(newMetadata, columns, rows);
  };

  const handleColumnsChange = (newColumns: any[]) => {
    setColumns(newColumns);
    updateTemplate(metadata, newColumns, rows);
  };

  const handleRowsChange = (newRows: any[]) => {
    setRows(newRows);
    updateTemplate(metadata, columns, newRows);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="shadow-medium">
          <Tabs defaultValue="metadata" className="w-full">
            <TabsList className="w-full grid grid-cols-4 rounded-t-lg rounded-b-none h-auto p-0 bg-muted/50">
              <TabsTrigger value="metadata" className="gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <Settings className="h-4 w-4" />
                Metadata
              </TabsTrigger>
              <TabsTrigger value="columns" className="gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <Columns className="h-4 w-4" />
                Columns
              </TabsTrigger>
              <TabsTrigger value="rows" className="gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <Rows className="h-4 w-4" />
                Rows
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2 py-3 data-[state=active]:bg-card data-[state=active]:shadow-soft">
                <Code className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="metadata" className="mt-0">
                <MetadataEditor metadata={metadata} onChange={handleMetadataChange} />
              </TabsContent>

              <TabsContent value="columns" className="mt-0">
                <ColumnManager columns={columns} onChange={handleColumnsChange} />
              </TabsContent>

              <TabsContent value="rows" className="mt-0">
                <RowManager rows={rows} columns={columns} onChange={handleRowsChange} />
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <JsonPreview
                  template={{
                    ...metadata,
                    columns,
                    rows,
                  }}
                />
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="p-6 shadow-medium sticky top-24">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Guide</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">1. Setup Metadata</h4>
              <p>Configure report name, page settings, and identifiers</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">2. Define Columns</h4>
              <p>Add columns with formatting rules (currency, date, etc.)</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">3. Build Rows</h4>
              <p>Create HEADER, DATA, DYNAMIC, SEPARATOR, or FOOTER rows</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">4. Export Template</h4>
              <p>Download JSON to use with Spring Boot backend</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
