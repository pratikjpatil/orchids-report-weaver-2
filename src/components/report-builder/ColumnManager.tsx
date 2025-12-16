import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ColumnManagerProps {
  columns: any[];
  onChange: (columns: any[]) => void;
}

export const ColumnManager = ({ columns, onChange }: ColumnManagerProps) => {
  const [openColumns, setOpenColumns] = useState<Set<number>>(new Set());

  const addColumn = () => {
    const newColumn = {
      id: `C${columns.length + 1}`,
      name: "",
      format: {},
    };
    onChange([...columns, newColumn]);
    setOpenColumns(new Set([...openColumns, columns.length]));
  };

  const updateColumn = (index: number, field: string, value: any) => {
    const newColumns = [...columns];
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      newColumns[index] = {
        ...newColumns[index],
        [parent]: {
          ...newColumns[index][parent],
          [child]: value,
        },
      };
    } else {
      newColumns[index] = { ...newColumns[index], [field]: value };
    }
    onChange(newColumns);
  };

  const removeColumn = (index: number) => {
    onChange(columns.filter((_, i) => i !== index));
  };

  const toggleColumn = (index: number) => {
    const newOpen = new Set(openColumns);
    if (newOpen.has(index)) {
      newOpen.delete(index);
    } else {
      newOpen.add(index);
    }
    setOpenColumns(newOpen);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Report Columns</h3>
        <Button onClick={addColumn} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
      </div>

      {columns.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground">No columns yet. Add your first column to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {columns.map((column, index) => (
            <Collapsible key={index} open={openColumns.has(index)} onOpenChange={() => toggleColumn(index)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{column.name || "Unnamed Column"}</p>
                    <p className="text-sm text-muted-foreground">{column.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeColumn(index);
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="p-4 pt-0 space-y-4 border-t border-border">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Column ID</Label>
                        <Input
                          value={column.id}
                          onChange={(e) => updateColumn(index, "id", e.target.value)}
                          placeholder="e.g., C1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Column Name</Label>
                        <Input
                          value={column.name}
                          onChange={(e) => updateColumn(index, "name", e.target.value)}
                          placeholder="e.g., GL ID"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Format Type</Label>
                      <Select
                        value={column.format?.type || "none"}
                        onValueChange={(value) => updateColumn(index, "format.type", value === "none" ? undefined : value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {column.format?.type === "currency" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Currency Symbol</Label>
                          <Input
                            value={column.format.currencySymbol || ""}
                            onChange={(e) => updateColumn(index, "format.currencySymbol", e.target.value)}
                            placeholder="e.g., Rs. "
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Decimals</Label>
                          <Input
                            type="number"
                            value={column.format.decimals || 2}
                            onChange={(e) => updateColumn(index, "format.decimals", parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                    )}

                    {column.format?.type === "date" && (
                      <div className="space-y-2">
                        <Label>Output Format</Label>
                        <Input
                          value={column.format.outputFormat || ""}
                          onChange={(e) => updateColumn(index, "format.outputFormat", e.target.value)}
                          placeholder="e.g., dd-MMM-yyyy"
                        />
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
};
