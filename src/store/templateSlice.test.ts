import { describe, it, expect, beforeEach } from 'vitest';
import templateReducer, {
  setTemplateName,
  addColumn,
  removeColumn,
  updateColumn,
  addRow,
  removeRow,
  updateCell,
  setSelectedCell,
  clearSelectedCell,
  undo,
  redo,
  loadTemplate,
  type TemplateState,
  type Cell,
} from './templateSlice';

describe('templateSlice', () => {
  let initialState: TemplateState;

  beforeEach(() => {
    initialState = {
      templateMeta: { id: '', name: 'Untitled Template', version: '1.0' },
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
      rows: [{ id: 'row-1', cells: [{ columnId: 'col-1' }] }],
      selectedCell: null,
      variants: [],
      history: {
        past: [],
        present: null,
        future: [],
      },
    };
  });

  describe('Template metadata', () => {
    it('should set template name', () => {
      const state = templateReducer(initialState, setTemplateName('New Name'));
      expect(state.templateMeta.name).toBe('New Name');
    });
  });

  describe('Column operations', () => {
    it('should add a new column', () => {
      const state = templateReducer(initialState, addColumn());
      expect(state.columns).toHaveLength(2);
      expect(state.columns[1].name).toBe('Column 2');
    });

    it('should remove a column', () => {
      const stateWithTwoCols = templateReducer(initialState, addColumn());
      const state = templateReducer(stateWithTwoCols, removeColumn('col-2'));
      expect(state.columns).toHaveLength(1);
    });

    it('should not remove the last column', () => {
      const state = templateReducer(initialState, removeColumn('col-1'));
      expect(state.columns).toHaveLength(1);
    });

    it('should update column properties', () => {
      const state = templateReducer(
        initialState,
        updateColumn({ id: 'col-1', name: 'Updated Name', format: { width: 200 } })
      );
      expect(state.columns[0].name).toBe('Updated Name');
      expect(state.columns[0].format.width).toBe(200);
    });
  });

  describe('Row operations', () => {
    it('should add a new row', () => {
      const state = templateReducer(initialState, addRow());
      expect(state.rows).toHaveLength(2);
      expect(state.rows[1].id).toBe('row-2');
    });

    it('should remove a row', () => {
      const stateWithTwoRows = templateReducer(initialState, addRow());
      const state = templateReducer(stateWithTwoRows, removeRow('row-2'));
      expect(state.rows).toHaveLength(1);
    });

    it('should not remove the last row', () => {
      const state = templateReducer(initialState, removeRow('row-1'));
      expect(state.rows).toHaveLength(1);
    });

    it('should add cells for new columns in existing rows', () => {
      const state = templateReducer(initialState, addColumn());
      expect(state.rows[0].cells).toHaveLength(2);
      expect(state.rows[0].cells[1].columnId).toBe('col-2');
    });
  });

  describe('Cell operations', () => {
    it('should update cell properties', () => {
      const updates: Partial<Cell> = {
        value: 'Test Value',
        type: 'text',
        format: { bold: true },
      };
      const state = templateReducer(
        initialState,
        updateCell({ rowId: 'row-1', columnId: 'col-1', updates })
      );
      expect(state.rows[0].cells[0].value).toBe('Test Value');
      expect(state.rows[0].cells[0].type).toBe('text');
      expect(state.rows[0].cells[0].format?.bold).toBe(true);
    });

    it('should update cell with db_sum type and source', () => {
      const updates: Partial<Cell> = {
        type: 'db_sum',
        source: { table: 'sales', column: 'amount' },
      };
      const state = templateReducer(
        initialState,
        updateCell({ rowId: 'row-1', columnId: 'col-1', updates })
      );
      expect(state.rows[0].cells[0].type).toBe('db_sum');
      expect(state.rows[0].cells[0].source).toEqual({ table: 'sales', column: 'amount' });
    });
  });

  describe('Cell selection', () => {
    it('should set selected cell', () => {
      const state = templateReducer(
        initialState,
        setSelectedCell({ rowId: 'row-1', columnId: 'col-1' })
      );
      expect(state.selectedCell).toEqual({ rowId: 'row-1', columnId: 'col-1' });
    });

    it('should clear selected cell', () => {
      const stateWithSelection = templateReducer(
        initialState,
        setSelectedCell({ rowId: 'row-1', columnId: 'col-1' })
      );
      const state = templateReducer(stateWithSelection, clearSelectedCell());
      expect(state.selectedCell).toBeNull();
    });
  });

  describe('Undo/Redo', () => {
    it('should support undo', () => {
      const state1 = templateReducer(initialState, setTemplateName('Name 1'));
      const state2 = templateReducer(state1, setTemplateName('Name 2'));
      const undoneState = templateReducer(state2, undo());
      expect(undoneState.templateMeta.name).toBe('Name 1');
    });

    it('should support redo', () => {
      const state1 = templateReducer(initialState, setTemplateName('Name 1'));
      const state2 = templateReducer(state1, setTemplateName('Name 2'));
      const undoneState = templateReducer(state2, undo());
      const redoneState = templateReducer(undoneState, redo());
      expect(redoneState.templateMeta.name).toBe('Name 2');
    });

    it('should not undo beyond initial state', () => {
      const undoneState = templateReducer(initialState, undo());
      expect(undoneState).toEqual(initialState);
    });

    it('should not redo when no future states', () => {
      const redoneState = templateReducer(initialState, redo());
      expect(redoneState).toEqual(initialState);
    });
  });

  describe('Load template', () => {
    it('should load a complete template', () => {
      const templateData = {
        templateMeta: { id: 'test-1', name: 'Test Template', version: '2.0' },
        reportMeta: {
          description: 'Test description',
          orientation: 'landscape' as const,
          paperSize: 'A3' as const,
          marginTop: 30,
          marginBottom: 30,
          marginLeft: 30,
          marginRight: 30,
        },
        columns: [
          { id: 'col-a', name: 'Column A', format: { width: 150, alignment: 'center' as const } },
        ],
        rows: [{ id: 'row-a', cells: [{ columnId: 'col-a', value: 'Test' }] }],
        variants: [],
      };

      const state = templateReducer(initialState, loadTemplate(templateData));
      expect(state.templateMeta.name).toBe('Test Template');
      expect(state.reportMeta.orientation).toBe('landscape');
      expect(state.columns).toHaveLength(1);
      expect(state.columns[0].name).toBe('Column A');
      expect(state.rows[0].cells[0].value).toBe('Test');
    });
  });

  describe('History management', () => {
    it('should record history for undoable actions', () => {
      const state1 = templateReducer(initialState, setTemplateName('Name 1'));
      expect(state1.history.past).toHaveLength(1);
      
      const state2 = templateReducer(state1, addColumn());
      expect(state2.history.past).toHaveLength(2);
    });

    it('should clear future history on new actions', () => {
      const state1 = templateReducer(initialState, setTemplateName('Name 1'));
      const state2 = templateReducer(state1, setTemplateName('Name 2'));
      const undoneState = templateReducer(state2, undo());
      
      expect(undoneState.history.future).toHaveLength(1);
      
      const state3 = templateReducer(undoneState, setTemplateName('Name 3'));
      expect(state3.history.future).toHaveLength(0);
    });
  });
});
