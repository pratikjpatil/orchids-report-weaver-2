import type { Column } from "@/store/templateSlice";

export const PDF_USER_UNITS_PER_INCH = 72;

export const DEFAULT_PAGE_WIDTHS = {
  A4_PORTRAIT: 595 - 72,
  A4_LANDSCAPE: 842 - 72, 
  LETTER_PORTRAIT: 612 - 72,
  LETTER_LANDSCAPE: 792 - 72,
} as const;

export function calculatePDFColumnWidths(
  columns: Column[],
  pageSize: string = "A4",
  orientation: string = "portrait"
): number[] {
  const totalRelativeWidth = columns.reduce(
    (sum, col) => sum + (col.format?.relativeWidth || 1),
    0
  );

  const pageKey = `${pageSize.toUpperCase()}_${orientation.toUpperCase()}` as keyof typeof DEFAULT_PAGE_WIDTHS;
  const availableWidth = DEFAULT_PAGE_WIDTHS[pageKey] || DEFAULT_PAGE_WIDTHS.A4_PORTRAIT;

  return columns.map((col) => {
    const relativeWidth = col.format?.relativeWidth || 1;
    const calculatedWidth = Math.floor(
      (relativeWidth / totalRelativeWidth) * availableWidth
    );
    return calculatedWidth;
  });
}

export function getITextPDFRelativeWidths(columns: Column[]): number[] {
  return columns.map((col) => col.format?.relativeWidth || 1);
}
