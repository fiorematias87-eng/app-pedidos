import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Pedido } from '../types/delivery';

const useRealtimeOrders = () => {
    const [orders, setOrders] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            const { data, error } = await supabase
                .from('orders')
                .select('*');

            if (error) {
                setError(error.message);
            } else {
                setOrders(data);
            }
            setLoading(false);
        };

        fetchOrders();

        const subscription = supabase
            .from('orders')
            .on('INSERT', payload => {
                setOrders(prevOrders => [...prevOrders, payload.new]);
            })
            .on('UPDATE', payload => {
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.id === payload.new.id ? payload.new : order
                    )
                );
            })
            .on('DELETE', payload => {
                setOrders(prevOrders => 
                    prevOrders.filter(order => order.id !== payload.old.id)
                );
            })
            .subscribe();

        return () => {
            supabase.removeSubscription(subscription);
        };
    }, []);

    return { orders, loading, error };
};

export default useRealtimeOrders;