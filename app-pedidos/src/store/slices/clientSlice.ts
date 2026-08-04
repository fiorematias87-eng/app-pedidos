import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Pedido } from '../../types/delivery';

interface ClientState {
  cart: Pedido[];
  currentOrder: Pedido | null;
  loading: boolean;
  error: string | null;
}

const initialState: ClientState = {
  cart: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<Pedido>) {
      state.cart.push(action.payload);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.cart = state.cart.filter(item => item.id !== action.payload);
    },
    clearCart(state) {
      state.cart = [];
    },
    setCurrentOrder(state, action: PayloadAction<Pedido | null>) {
      state.currentOrder = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  clearCart,
  setCurrentOrder,
  setLoading,
  setError,
} = clientSlice.actions;

export default clientSlice.reducer;