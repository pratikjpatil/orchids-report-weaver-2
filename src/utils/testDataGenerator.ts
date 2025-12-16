import { Row } from "@/store/templateSlice";

export function generateTestRows(count: number, columnCount: number): Row[] {
  const rows: Row[] = [];
  
  for (let i = 0; i < count; i++) {
    const rowType = i === 0 ? "HEADER" : i === count - 1 ? "FOOTER" : "DATA";
    
    rows.push({
      id: `R__${i + 1}`,
      rowType: rowType as Row["rowType"],
      cells: Array.from({ length: columnCount }, (_, colIndex) => ({
        type: "TEXT",
        value: rowType === "HEADER" 
          ? `Header ${colIndex + 1}` 
          : rowType === "FOOTER"
          ? `Footer ${colIndex + 1}`
          : `Row ${i + 1} Col ${colIndex + 1}`,
      })),
    });
  }
  
  return rows;
}

export function generateBulkTestData(rowCount: number = 10000) {
  return {
    templateMeta: {
      templateId: "test-template",
      version: 1,
      pageSize: "A4",
      pageOrientation: "portrait",
      description: `Performance test template with ${rowCount} rows`,
    },
    reportMeta: {
      reportName: `Performance Test Report (${rowCount} rows)`,
      reportId: "perf-test-001",
      extras: [
        { name: "Test Date", value: new Date().toISOString().split("T")[0] },
        { name: "Row Count", value: rowCount.toString() },
      ],
    },
    reportData: {
      columns: [
        { id: "C__1", name: "ID", format: { width: 100, align: "center" as const } },
        { id: "C__2", name: "Name", format: { width: 200 } },
        { id: "C__3", name: "Value", format: { width: 150, align: "right" as const, type: "number" as const } },
        { id: "C__4", name: "Status", format: { width: 120 } },
        { id: "C__5", name: "Date", format: { width: 150, type: "date" as const } },
      ],
      rows: generateTestRows(rowCount, 5),
    },
    variants: [],
  };
}
