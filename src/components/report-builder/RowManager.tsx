import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Settings } from "lucide-react";
import { RowEditor } from "./RowEditor";
import { Badge } from "@/components/ui/badge";

interface RowManagerProps {
  rows: any[];
  columns: any[];
  onChange: (rows: any[]) => void;
}

export const RowManager = ({ rows, columns, onChange }: RowManagerProps) => {
  const [editingRow, setEditingRow] = useState<number | null>(null);

  const addRow = (rowType: string) => {
    const newRow: any = {
      rowType,
      cells: [],
    };
    
    if (rowType === "DYNAMIC") {
      newRow.dynamicConfig = {
        type: "DB_LIST",
        table: "",
        select: [],
        filters: {},
        orderby: "",
        limit: 100,
      };
    }
    
    onChange([...rows, newRow]);
    setEditingRow(rows.length);
  };

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, updatedRow: any) => {
    const newRows = [...rows];
    newRows[index] = updatedRow;
    onChange(newRows);
  };

  const getRowTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HEADER: "bg-primary text-primary-foreground",
      DATA: "bg-accent text-accent-foreground",
      SEPARATOR: "bg-secondary text-secondary-foreground",
      DYNAMIC: "bg-success text-success-foreground",
      FOOTER: "bg-muted text-muted-foreground",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Report Rows</h3>
        <div className="flex gap-2">
          <Button onClick={() => addRow("HEADER")} size="sm" variant="outline">
            Header
          </Button>
          <Button onClick={() => addRow("DATA")} size="sm" variant="outline">
            Data
          </Button>
          <Button onClick={() => addRow("SEPARATOR")} size="sm" variant="outline">
            Separator
          </Button>
          <Button onClick={() => addRow("DYNAMIC")} size="sm" variant="outline">
            Dynamic
          </Button>
          <Button onClick={() => addRow("FOOTER")} size="sm" variant="outline">
            Footer
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <p className="text-muted-foreground mb-4">No rows yet. Add your first row to build the report.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Button onClick={() => addRow("HEADER")} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Row
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="p-4 flex items-center gap-3 bg-muted/30">
                <Badge className={getRowTypeColor(row.rowType)}>{row.rowType}</Badge>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {row.rowType === "DYNAMIC" 
                      ? `Dynamic rows from ${row.dynamicConfig?.table || "..."}`
                      : `${row.cells?.length || 0} cells`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingRow(index === editingRow ? null : index)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(index)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {editingRow === index && (
                <div className="border-t border-border">
                  <RowEditor
                    row={row}
                    columns={columns}
                    onChange={(updatedRow) => updateRow(index, updatedRow)}
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
