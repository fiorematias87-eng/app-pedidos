import { configureStore } from '@reduxjs/toolkit';
import adminReducer from './slices/adminSlice';
import clientReducer from './slices/clientSlice';
import driverReducer from './slices/driverSlice';

const store = configureStore({
  reducer: {
    admin: adminReducer,
    client: clientReducer,
    driver: driverReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;