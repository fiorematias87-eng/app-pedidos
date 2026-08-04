import { RootState } from '../index';

// Selectors for accessing client-related state
export const selectClientData = (state: RootState) => state.client.data;
export const selectClientLoading = (state: RootState) => state.client.loading;
export const selectClientError = (state: RootState) => state.client.error;

// Selectors for accessing admin-related state
export const selectAdminData = (state: RootState) => state.admin.data;
export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;

// Selectors for accessing driver-related state
export const selectDriverData = (state: RootState) => state.driver.data;
export const selectDriverLoading = (state: RootState) => state.driver.loading;
export const selectDriverError = (state: RootState) => state.driver.error;