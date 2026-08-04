import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { EstadoPedido } from '../../types/delivery';

interface DeliveryState {
    deliveries: Array<{
        id: string;
        customerName: string;
        status: EstadoPedido;
        notes: string;
        location: {
            latitude: number;
            longitude: number;
        };
    }>;
    loading: boolean;
}

const initialState: DeliveryState = {
    deliveries: [],
    loading: false,
};

const driverSlice = createSlice({
    name: 'driver',
    initialState,
    reducers: {
        setDeliveries(state, action: PayloadAction<Array<DeliveryState['deliveries'][number]>>) {
            state.deliveries = action.payload;
        },
        addDelivery(state, action: PayloadAction<DeliveryState['deliveries'][number]>) {
            state.deliveries.push(action.payload);
        },
        updateDeliveryStatus(state, action: PayloadAction<{ id: string; status: EstadoPedido }>) {
            const delivery = state.deliveries.find(del => del.id === action.payload.id);
            if (delivery) {
                delivery.status = action.payload.status;
            }
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
    },
});

export const { setDeliveries, addDelivery, updateDeliveryStatus, setLoading } = driverSlice.actions;

export default driverSlice.reducer;