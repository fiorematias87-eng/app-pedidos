import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
    dashboardData: any; // Replace 'any' with the appropriate type
    fleetData: any; // Replace 'any' with the appropriate type
}

const initialState: AdminState = {
    dashboardData: null,
    fleetData: null,
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setDashboardData(state, action: PayloadAction<any>) { // Replace 'any' with the appropriate type
            state.dashboardData = action.payload;
        },
        setFleetData(state, action: PayloadAction<any>) { // Replace 'any' with the appropriate type
            state.fleetData = action.payload;
        },
        clearAdminData(state) {
            state.dashboardData = null;
            state.fleetData = null;
        },
    },
});

export const { setDashboardData, setFleetData, clearAdminData } = adminSlice.actions;

export default adminSlice.reducer;