import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import undoable from "redux-undo";
import templateReducer from "./templateSlice";
import configReducer from "./configSlice";

const undoableTemplateReducer = undoable(templateReducer, {
  limit: 50,
  filter: (action) => {
    const undoableActions = [
      "template/updateCell",
      "template/updateCellRender",
      "template/updateCellFormat",
      "template/updateCellSource",
      "template/addColumn",
      "template/removeColumn",
      "template/updateColumn",
      "template/updateColumnFormat",
      "template/addRow",
      "template/removeRow",
      "template/updateRow",
      "template/reorderRows",
      "template/updateDynamicConfig",
      "template/setRowHeight",
    ];
    return undoableActions.includes(action.type);
  },
});

export const store = configureStore({
  reducer: {
    template: undoableTemplateReducer,
    config: configReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
