import { configureStore } from '@reduxjs/toolkit';
import clientReducer from './slices/clientSlice';
import adminReducer from './slices/adminSlice';
import driverReducer from './slices/driverSlice';

const store = configureStore({
  reducer: {
    client: clientReducer,
    admin: adminReducer,
    driver: driverReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;