import { supabase } from '../lib/supabase';
import type { Pedido } from '../types/delivery';

export const pedidosService = {
  async getPedidos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Pedido[];
  },

  async createPedido(pedido: Partial<Pedido>) {
    const { data, error } = await supabase
      .from('pedidos')
      .insert(pedido)
      .select()
      .single();

    if (error) throw error;
    return data as Pedido;
  },

  async updatePedido(id: string, updates: Partial<Pedido>) {
    const { data, error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Pedido;
  },

  subscribe(callback: (pedido: Pedido) => void) {
    const channel = supabase.channel('pedidos-realtime');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pedidos' },
      (payload) => {
        const next = payload.new ?? payload.old;
        if (next) {
          callback(next as Pedido);
        }
      }
    );

    channel.subscribe();
    return channel;
  },
};
