import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface RowEditorProps {
  row: any;
  columns: any[];
  onChange: (row: any) => void;
}

export const RowEditor = ({ row, columns, onChange }: RowEditorProps) => {
  const [activeTab, setActiveTab] = useState(row.rowType === "DYNAMIC" ? "dynamic" : "cells");

  const addCell = () => {
    const newRow = {
      ...row,
      cells: [
        ...(row.cells || []),
        {
          type: "TEXT",
          value: "",
        },
      ],
    };
    onChange(newRow);
  };

  const removeCell = (index: number) => {
    const newRow = {
      ...row,
      cells: row.cells.filter((_: any, i: number) => i !== index),
    };
    onChange(newRow);
  };

  const updateCell = (index: number, field: string, value: any) => {
    const newCells = [...(row.cells || [])];
    if (field.includes(".")) {
      const parts = field.split(".");
      let current = newCells[index];
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      newCells[index] = { ...newCells[index], [field]: value };
    }
    onChange({ ...row, cells: newCells });
  };

  const updateDynamicConfig = (field: string, value: any) => {
    const newRow = {
      ...row,
      dynamicConfig: {
        ...row.dynamicConfig,
        [field]: value,
      },
    };
    onChange(newRow);
  };

  return (
    <div className="p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {row.rowType !== "DYNAMIC" && <TabsTrigger value="cells">Cells</TabsTrigger>}
          {row.rowType === "DYNAMIC" && <TabsTrigger value="dynamic">Dynamic Config</TabsTrigger>}
        </TabsList>

        <TabsContent value="cells" className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Row Cells ({row.cells?.length || 0})</Label>
            <Button onClick={addCell} size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Cell
            </Button>
          </div>

          <div className="space-y-3">
            {(row.cells || []).map((cell: any, index: number) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Cell {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCell(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Cell Type</Label>
                  <Select value={cell.type} onValueChange={(value) => updateCell(index, "type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="DB_VALUE">DB Value</SelectItem>
                      <SelectItem value="DB_COUNT">DB Count</SelectItem>
                      <SelectItem value="DB_SUM">DB Sum</SelectItem>
                      <SelectItem value="DB_AVG">DB Average</SelectItem>
                      <SelectItem value="DB_MIN">DB Min</SelectItem>
                      <SelectItem value="DB_MAX">DB Max</SelectItem>
                      <SelectItem value="FORMULA">Formula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {cell.type === "TEXT" && (
                  <div className="space-y-2">
                    <Label>Text Value</Label>
                    <Input
                      value={cell.value || ""}
                      onChange={(e) => updateCell(index, "value", e.target.value)}
                      placeholder="Enter text"
                    />
                  </div>
                )}

                {(cell.type === "DB_VALUE" || cell.type === "DB_COUNT" || cell.type === "DB_SUM" || 
                  cell.type === "DB_AVG" || cell.type === "DB_MIN" || cell.type === "DB_MAX") && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Table</Label>
                      <Input
                        value={cell.source?.table || ""}
                        onChange={(e) => updateCell(index, "source.table", e.target.value)}
                        placeholder="e.g., GL_BALANCE"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Column</Label>
                      <Input
                        value={cell.source?.column || ""}
                        onChange={(e) => updateCell(index, "source.column", e.target.value)}
                        placeholder="e.g., BALANCE"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Filters (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(cell.source?.filters || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            updateCell(index, "source.filters", JSON.parse(e.target.value));
                          } catch {}
                        }}
                        placeholder='{"BRANCH_CODE": "10089"}'
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {cell.type === "FORMULA" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Expression</Label>
                      <Input
                        value={cell.expression || ""}
                        onChange={(e) => updateCell(index, "expression", e.target.value)}
                        placeholder="e.g., maxBal - minBal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Variables (JSON)</Label>
                      <Textarea
                        value={JSON.stringify(cell.variables || {}, null, 2)}
                        onChange={(e) => {
                          try {
                            updateCell(index, "variables", JSON.parse(e.target.value));
                          } catch {}
                        }}
                        placeholder='{"maxBal": {"type": "DB_MAX", "table": "GL_BALANCE", "column": "BALANCE"}}'
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <Label className="mb-2 block">Rendering</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`bold-${index}`}
                        checked={cell.render?.bold || false}
                        onCheckedChange={(checked) => updateCell(index, "render.bold", checked)}
                      />
                      <label htmlFor={`bold-${index}`} className="text-sm">Bold</label>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Align</Label>
                      <Select
                        value={cell.render?.align || "left"}
                        onValueChange={(value) => updateCell(index, "render.align", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Colspan</Label>
                      <Input
                        type="number"
                        value={cell.render?.colspan || 1}
                        onChange={(e) => updateCell(index, "render.colspan", parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Rowspan</Label>
                      <Input
                        type="number"
                        value={cell.render?.rowspan || 1}
                        onChange={(e) => updateCell(index, "render.rowspan", parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dynamic" className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Table</Label>
              <Input
                value={row.dynamicConfig?.table || ""}
                onChange={(e) => updateDynamicConfig("table", e.target.value)}
                placeholder="e.g., GL_BALANCE"
              />
            </div>

            <div className="space-y-2">
              <Label>Select Columns (comma-separated)</Label>
              <Input
                value={row.dynamicConfig?.select?.join(", ") || ""}
                onChange={(e) => updateDynamicConfig("select", e.target.value.split(",").map((s: string) => s.trim()))}
                placeholder="e.g., ID, BALANCE, CURRENCY"
              />
            </div>

            <div className="space-y-2">
              <Label>Filters (JSON)</Label>
              <Textarea
                value={JSON.stringify(row.dynamicConfig?.filters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    updateDynamicConfig("filters", JSON.parse(e.target.value));
                  } catch {}
                }}
                placeholder='{"BRANCH_CODE": "10089"}'
                className="font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Order By</Label>
                <Input
                  value={row.dynamicConfig?.orderby || ""}
                  onChange={(e) => updateDynamicConfig("orderby", e.target.value)}
                  placeholder="e.g., BALANCE_DATE DESC"
                />
              </div>
              <div className="space-y-2">
                <Label>Limit</Label>
                <Input
                  type="number"
                  value={row.dynamicConfig?.limit || 100}
                  onChange={(e) => updateDynamicConfig("limit", parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
