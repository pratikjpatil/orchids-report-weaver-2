import { describe, it, expect } from 'vitest';
import { selectTemplateForExport, selectCanUndo, selectCanRedo } from './selectors';
import type { RootState } from './store';
import type { TemplateState } from './templateSlice';

describe('selectors', () => {
  const createMockState = (template: Partial<TemplateState> = {}): RootState => ({
    template: {
      templateMeta: { id: '', name: 'Test Template', version: '1.0' },
      reportMeta: {
        description: '',
        orientation: 'portrait',
        paperSize: 'A4',
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20,
      },
      columns: [
        { id: 'col-1', name: 'Column 1', format: { width: 100, alignment: 'left' } },
      ],
      rows: [{ id: 'row-1', cells: [{ columnId: 'col-1', value: 'Test' }] }],
      selectedCell: null,
      variants: [],
      history: {
        past: [],
        present: null,
        future: [],
      },
      ...template,
    },
  });

  describe('selectTemplateForExport', () => {
    it('should export template in correct format', () => {
      const state = createMockState();
      const exported = selectTemplateForExport(state);

      expect(exported).toHaveProperty('template');
      expect(exported).toHaveProperty('variants');
      expect(exported.template).toHaveProperty('templateMeta');
      expect(exported.template).toHaveProperty('reportMeta');
      expect(exported.template).toHaveProperty('reportData');
    });

    it('should format columns correctly', () => {
      const state = createMockState();
      const exported = selectTemplateForExport(state);

      expect(exported.template.reportData.columns).toHaveLength(1);
      expect(exported.template.reportData.columns[0]).toEqual({
        id: 'col-1',
        name: 'Column 1',
        format: { width: 100, alignment: 'left' },
      });
    });

    it('should format cells correctly', () => {
      const state = createMockState({
        rows: [
          {
            id: 'row-1',
            cells: [
              {
                columnId: 'col-1',
                value: 'Test Value',
                type: 'text',
                format: { bold: true, italic: false },
              },
            ],
          },
        ],
      });
      const exported = selectTemplateForExport(state);

      expect(exported.template.reportData.rows).toHaveLength(1);
      const cell = exported.template.reportData.rows[0].cells[0];
      expect(cell).not.toHaveProperty('id');
      expect(cell.value).toBe('Test Value');
      expect(cell.type).toBe('text');
      expect(cell.format).toEqual({ bold: true });
    });

    it('should exclude undefined and default cell values', () => {
      const state = createMockState({
        rows: [
          {
            id: 'row-1',
            cells: [{ columnId: 'col-1' }],
          },
        ],
      });
      const exported = selectTemplateForExport(state);

      const cell = exported.template.reportData.rows[0].cells[0];
      expect(cell).not.toHaveProperty('value');
      expect(cell).not.toHaveProperty('format');
      expect(cell).not.toHaveProperty('type');
    });

    it('should handle db_sum cells with source', () => {
      const state = createMockState({
        rows: [
          {
            id: 'row-1',
            cells: [
              {
                columnId: 'col-1',
                type: 'db_sum',
                source: { table: 'sales', column: 'amount' },
              },
            ],
          },
        ],
      });
      const exported = selectTemplateForExport(state);

      const cell = exported.template.reportData.rows[0].cells[0];
      expect(cell.type).toBe('db_sum');
      expect(cell.source).toEqual({ table: 'sales', column: 'amount' });
    });

    it('should include variants', () => {
      const state = createMockState({
        variants: [{ id: 'var-1', name: 'Variant 1', description: 'Test variant' }],
      });
      const exported = selectTemplateForExport(state);

      expect(exported.variants).toHaveLength(1);
      expect(exported.variants[0].name).toBe('Variant 1');
    });
  });

  describe('selectCanUndo', () => {
    it('should return true when past history exists', () => {
      const state = createMockState({
        history: {
          past: [{ templateMeta: { id: '', name: 'Old', version: '1.0' } }],
          present: null,
          future: [],
        },
      });

      expect(selectCanUndo(state)).toBe(true);
    });

    it('should return false when no past history', () => {
      const state = createMockState({
        history: {
          past: [],
          present: null,
          future: [],
        },
      });

      expect(selectCanUndo(state)).toBe(false);
    });
  });

  describe('selectCanRedo', () => {
    it('should return true when future history exists', () => {
      const state = createMockState({
        history: {
          past: [],
          present: null,
          future: [{ templateMeta: { id: '', name: 'Future', version: '1.0' } }],
        },
      });

      expect(selectCanRedo(state)).toBe(true);
    });

    it('should return false when no future history', () => {
      const state = createMockState({
        history: {
          past: [],
          present: null,
          future: [],
        },
      });

      expect(selectCanRedo(state)).toBe(false);
    });
  });
});
