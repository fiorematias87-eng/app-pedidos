import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DriverState {
    currentOrderId: string | null;
    deliveryStatus: string;
    location: {
        latitude: number;
        longitude: number;
    };
}

const initialState: DriverState = {
    currentOrderId: null,
    deliveryStatus: 'idle',
    location: {
        latitude: 0,
        longitude: 0,
    },
};

const driverSlice = createSlice({
    name: 'driver',
    initialState,
    reducers: {
        setCurrentOrderId(state, action: PayloadAction<string | null>) {
            state.currentOrderId = action.payload;
        },
        updateDeliveryStatus(state, action: PayloadAction<string>) {
            state.deliveryStatus = action.payload;
        },
        updateLocation(state, action: PayloadAction<{ latitude: number; longitude: number }>) {
            state.location = action.payload;
        },
    },
});

export const { setCurrentOrderId, updateDeliveryStatus, updateLocation } = driverSlice.actions;

export default driverSlice.reducer;