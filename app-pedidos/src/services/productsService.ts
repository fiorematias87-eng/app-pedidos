import { supabase } from './supabaseClient';
import { Producto } from '../types/delivery';

export const fetchProducts = async (): Promise<Producto[]> => {
    const { data, error } = await supabase
        .from('productos')
        .select('*');

    if (error) {
        throw new Error(error.message);
    }

    return data as Producto[];
};

export const addProduct = async (product: Producto): Promise<Producto> => {
    const { data, error } = await supabase
        .from('productos')
        .insert([product])
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Producto;
};

export const updateProduct = async (id: string, updates: Partial<Producto>): Promise<Producto> => {
    const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as Producto;
};

export const deleteProduct = async (id: string): Promise<void> => {
    const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
};