import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ClientState {
  orders: Array<any>; // Replace 'any' with a specific type for orders
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  orders: [],
  loading: false,
  error: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    fetchOrdersStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess(state, action: PayloadAction<Array<any>>) { // Replace 'any' with a specific type for orders
      state.loading = false;
      state.orders = action.payload;
    },
    fetchOrdersFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  clearError,
} = clientSlice.actions;

export default clientSlice.reducer;