import { supabase } from '../lib/supabase';
import type { Categoria, Pedido, Producto, Repartidor, TiendaConfig } from '../types/delivery';

export const pedidosService = {
  async getStoreConfig() {
    const { data, error } = await supabase
      .from('tienda_config')
      .select('*')
      .eq('id', 'store')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as TiendaConfig | null;
  },

  subscribeToStoreConfig(callback: (config: TiendaConfig) => void) {
    const channel = supabase.channel('store-config-realtime');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tienda_config', filter: 'id=eq.store' },
      (payload) => {
        if (payload.new) {
          callback(payload.new as TiendaConfig);
        }
      }
    );

    channel.subscribe();
    return channel;
  },

  subscribeToPublicAll(handlers: {
    storeConfig?: (config: TiendaConfig) => void;
    categories?: () => void;
    products?: () => void;
  }) {
    const channel = supabase.channel('public:all');

    if (handlers.storeConfig) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tienda_config', filter: 'id=eq.store' },
        (payload) => {
          if (payload.new) {
            handlers.storeConfig?.(payload.new as TiendaConfig);
          }
        }
      );
    }

    if (handlers.categories) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'categorias' }, () => {
        handlers.categories?.();
      });
    }

    if (handlers.products) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: 'productos' }, () => {
        handlers.products?.();
      });
    }

    channel.subscribe();
    return channel;
  },

  async upsertStoreConfig(config: Partial<TiendaConfig>) {
    const { data, error } = await supabase
      .from('tienda_config')
      .upsert({ id: 'store', ...config }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data as TiendaConfig;
  },

  async getCategories() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('orden', { ascending: true });

    if (error) throw error;
    return data as Categoria[];
  },

  async createCategory(category: Partial<Categoria>) {
    const { data, error } = await supabase.from('categorias').insert(category).select().single();
    if (error) throw error;
    return data as Categoria;
  },

  async updateCategory(id: string, updates: Partial<Categoria>) {
    const { data, error } = await supabase.from('categorias').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Categoria;
  },

  async deleteCategory(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
  },

  async getProducts() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Producto[];
  },

  async createProduct(product: Partial<Producto>) {
    const { data, error } = await supabase.from('productos').insert(product).select().single();
    if (error) throw error;
    return data as Producto;
  },

  async updateProduct(id: string, updates: Partial<Producto>) {
    const { data, error } = await supabase.from('productos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Producto;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (error) throw error;
  },

  async getRepartidores() {
    const { data, error } = await supabase.from('repartidores').select('*').order('nombre', { ascending: true });
    if (error) throw error;
    return data as Repartidor[];
  },

  async createRepartidor(repartidor: Partial<Repartidor>) {
    const { data, error } = await supabase.from('repartidores').insert(repartidor).select().single();
    if (error) throw error;
    return data as Repartidor;
  },

  async updateRepartidor(id: string, updates: Partial<Repartidor>) {
    const { data, error } = await supabase.from('repartidores').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Repartidor;
  },

  async deleteRepartidor(id: string) {
    const { error } = await supabase.from('repartidores').delete().eq('id', id);
    if (error) throw error;
  },

  async getPedidos() {
    const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Pedido[];
  },

  async getPedido(id: string) {
    const { data, error } = await supabase.from('pedidos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Pedido | null;
  },

  async createPedido(pedido: Partial<Pedido>) {
    const { data, error } = await supabase.from('pedidos').insert(pedido).select().single();
    if (error) throw error;
    return data as Pedido;
  },

  async updatePedido(id: string, updates: Partial<Pedido>) {
    const { data, error } = await supabase.from('pedidos').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data as Pedido;
  },

  subscribeToOrders(callback: (pedido: Pedido, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    // Use a stable channel name shared across admin and delivery
    const channel = supabase.channel('pedidos_updates');

    channel.on(
      'postgres_changes',
      { event: ['INSERT', 'UPDATE', 'DELETE'], schema: 'public', table: 'pedidos' },
      (payload) => {
        const eventType = (payload.eventType || payload.type) as 'INSERT' | 'UPDATE' | 'DELETE';
        const next = payload.new ?? payload.old;
        if (next) {
          callback(next as Pedido, eventType);
        }
      }
    );

    channel.subscribe();
    return channel;
  },

  subscribeToOrder(orderId: string, callback: (pedido: Pedido) => void) {
    const channel = supabase.channel(`pedido-${orderId}`);

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pedidos', filter: `id=eq.${orderId}` },
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
