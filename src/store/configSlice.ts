import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { TableConfig, fetchTableConfigs } from "@/services/api";

interface ConfigState {
  tableConfigs: TableConfig[];
  loading: boolean;
  error: string | null;
}

const initialState: ConfigState = {
  tableConfigs: [],
  loading: false,
  error: null,
};

export const loadTableConfigs = createAsyncThunk(
  "config/loadTableConfigs",
  async () => {
    const configs = await fetchTableConfigs();
    return configs;
  }
);

const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTableConfigs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadTableConfigs.fulfilled, (state, action: PayloadAction<TableConfig[]>) => {
        state.loading = false;
        state.tableConfigs = action.payload;
      })
      .addCase(loadTableConfigs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load table configs";
      });
  },
});

export const { clearError } = configSlice.actions;

export default configSlice.reducer;
