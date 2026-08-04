import { supabase } from './supabaseClient';
import { Driver } from '../types/delivery';

// Create a new driver
export const createDriver = async (driver: Driver) => {
    const { data, error } = await supabase
        .from('drivers')
        .insert([driver]);

    if (error) throw new Error(error.message);
    return data;
};

// Get all drivers
export const getDrivers = async () => {
    const { data, error } = await supabase
        .from('drivers')
        .select('*');

    if (error) throw new Error(error.message);
    return data;
};

// Update a driver
export const updateDriver = async (driverId: string, updates: Partial<Driver>) => {
    const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', driverId);

    if (error) throw new Error(error.message);
    return data;
};

// Delete a driver
export const deleteDriver = async (driverId: string) => {
    const { data, error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

    if (error) throw new Error(error.message);
    return data;
};