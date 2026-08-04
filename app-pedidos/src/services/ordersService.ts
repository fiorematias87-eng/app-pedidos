import { supabase } from './supabaseClient';
import { Pedido } from '../types/delivery';

// Create a new order
export const createOrder = async (order: Pedido) => {
    const { data, error } = await supabase
        .from('orders')
        .insert([order]);

    if (error) throw new Error(error.message);
    return data;
};

// Read all orders
export const getOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select('*');

    if (error) throw new Error(error.message);
    return data;
};

// Update an existing order
export const updateOrder = async (id: string, updates: Partial<Pedido>) => {
    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
};

// Delete an order
export const deleteOrder = async (id: string) => {
    const { data, error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return data;
};