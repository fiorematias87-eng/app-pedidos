import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pedido } from '../../types/delivery';

interface AdminState {
  pedidos: Pedido[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminState = {
  pedidos: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    fetchPedidosStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchPedidosSuccess(state, action: PayloadAction<Pedido[]>) {
      state.loading = false;
      state.pedidos = action.payload;
    },
    fetchPedidosFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addPedido(state, action: PayloadAction<Pedido>) {
      state.pedidos.push(action.payload);
    },
    updatePedido(state, action: PayloadAction<Pedido>) {
      const index = state.pedidos.findIndex(pedido => pedido.id === action.payload.id);
      if (index !== -1) {
        state.pedidos[index] = action.payload;
      }
    },
    removePedido(state, action: PayloadAction<number>) {
      state.pedidos = state.pedidos.filter(pedido => pedido.id !== action.payload);
    },
  },
});

export const {
  fetchPedidosStart,
  fetchPedidosSuccess,
  fetchPedidosFailure,
  addPedido,
  updatePedido,
  removePedido,
} = adminSlice.actions;

export default adminSlice.reducer;