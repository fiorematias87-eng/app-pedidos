export const API_URL = process.env.REACT_APP_API_URL || 'https://api.example.com';
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://xyzcompany.supabase.co';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

export const ORDER_STATUSES = {
    PENDING: 'Pendiente',
    PREPARING: 'Preparando',
    ON_THE_WAY: 'En Camino',
    DELIVERED: 'Entregado',
};

export const DEFAULT_LOCATION = {
    latitude: 0,
    longitude: 0,
};

export const CART_STORAGE_KEY = 'delivery_cart';