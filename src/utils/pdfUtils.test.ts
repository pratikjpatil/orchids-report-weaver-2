import { describe, it, expect } from 'vitest';
import { formatCellValue, calculateColumnWidth } from './pdfUtils';
import type { Cell } from '@/store/templateSlice';

describe('pdfUtils', () => {
  describe('formatCellValue', () => {
    it('should return empty string for undefined value', () => {
      const cell: Cell = { columnId: 'col-1' };
      expect(formatCellValue(cell)).toBe('');
    });

    it('should return text value as-is', () => {
      const cell: Cell = { columnId: 'col-1', value: 'Hello World', type: 'text' };
      expect(formatCellValue(cell)).toBe('Hello World');
    });

    it('should format number values', () => {
      const cell: Cell = { columnId: 'col-1', value: '1234.56', type: 'number' };
      expect(formatCellValue(cell)).toBe('1234.56');
    });

    it('should format db_sum with table and column', () => {
      const cell: Cell = {
        columnId: 'col-1',
        type: 'db_sum',
        source: { table: 'sales', column: 'amount' },
      };
      expect(formatCellValue(cell)).toBe('DB_SUM(sales.amount)');
    });

    it('should format db_sum with table only', () => {
      const cell: Cell = {
        columnId: 'col-1',
        type: 'db_sum',
        source: { table: 'sales' },
      };
      expect(formatCellValue(cell)).toBe('DB_SUM(sales)');
    });

    it('should format db_sum with column only', () => {
      const cell: Cell = {
        columnId: 'col-1',
        type: 'db_sum',
        source: { column: 'amount' },
      };
      expect(formatCellValue(cell)).toBe('DB_SUM(amount)');
    });

    it('should return DB_SUM() for db_sum without source', () => {
      const cell: Cell = {
        columnId: 'col-1',
        type: 'db_sum',
      };
      expect(formatCellValue(cell)).toBe('DB_SUM()');
    });

    it('should handle cell with value and type', () => {
      const cell: Cell = {
        columnId: 'col-1',
        value: '123',
        type: 'number',
      };
      expect(formatCellValue(cell)).toBe('123');
    });
  });

  describe('calculateColumnWidth', () => {
    it('should return default width for undefined', () => {
      expect(calculateColumnWidth(undefined)).toBe(100);
    });

    it('should return specified width', () => {
      expect(calculateColumnWidth(150)).toBe(150);
    });

    it('should return minimum width for very small values', () => {
      expect(calculateColumnWidth(10)).toBe(10);
    });

    it('should handle large widths', () => {
      expect(calculateColumnWidth(500)).toBe(500);
    });

    it('should handle zero width', () => {
      expect(calculateColumnWidth(0)).toBe(0);
    });

    it('should handle negative width', () => {
      expect(calculateColumnWidth(-50)).toBe(-50);
    });
  });
});
