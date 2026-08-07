import { supabase } from '../lib/supabase';
import type { Categoria, Pedido, Producto, Repartidor, TiendaConfig } from '../types/delivery';

const normalizePedidoEstado = (estado?: string | null) => {
  switch (estado) {
    case 'en_preparacion':
      return 'en_preparacion';
    case 'en_cocina':
      return 'en_preparacion';
    case 'completado':
      return 'completado';
    case 'entregado':
      return 'completado';
    case 'pendiente':
    case 'en_camino':
      return estado;
    default:
      return 'pendiente';
  }
};

const normalizePedidoItems = (pedido: Partial<Pedido> | null, productosGlobal: Producto[] = []) => {
  const rawItems = Array.isArray((pedido as any)?.items)
    ? (pedido as any).items
    : Array.isArray((pedido as any)?.productos)
      ? (pedido as any).productos
      : [];

  return rawItems.map((item: any) => {
    let foto = item?.imagen_url || item?.imagen || item?.foto || item?.img || item?.producto?.imagen_url || item?.producto?.imagen || item?.producto?.foto || item?.producto?.image || null;

    if (!foto && productosGlobal.length) {
      const nombreItem = String(item?.nombre || '').trim().toLowerCase();
      const productoId = item?.producto_id || item?.producto?.id || item?.id;
      const productoEncontrado = productosGlobal.find((producto) => {
        if (productoId && producto.id === productoId) return true;
        return producto.nombre?.toLowerCase().trim() === nombreItem;
      });

      if (productoEncontrado) {
        foto = productoEncontrado.imagen_url || (productoEncontrado as any).imagen || (productoEncontrado as any).foto || (productoEncontrado as any).image || null;
      }
    }

    return {
      ...item,
      imagen_url: foto || null,
    };
  });
};

const normalizePedido = (pedido: Partial<Pedido> | null, productosGlobal: Producto[] = []) => {
  if (!pedido) return null;
  return {
    ...pedido,
    items: normalizePedidoItems(pedido, productosGlobal),
    estado: normalizePedidoEstado(pedido.estado as string | null),
  } as Pedido;
};

const PEDIDO_DB_COLUMNS = new Set([
  'id',
  'cliente_nombre',
  'cliente_telefono',
  'cliente_direccion',
  'items',
  'subtotal',
  'costo_envio',
  'total',
  'estado',
  'repartidor_id',
  'notas',
  'metodo_entrega',
  'metodo_pago',
  'paga_con',
  'created_at',
  'lat',
  'lng',
]);

const normalizePedidoPayload = (payload: Partial<Pedido>) => {
  const nextPayload: Partial<Pedido> = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (!PEDIDO_DB_COLUMNS.has(key)) {
      return;
    }

    if (key === 'estado') {
      (nextPayload as Partial<Pedido> & { estado?: Pedido['estado'] }).estado = normalizePedidoEstado(value as string | null) as Pedido['estado'];
      return;
    }

    (nextPayload as Record<string, unknown>)[key] = value;
  });

  return nextPayload;
};

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

  async getTodayMetrics() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('pedidos')
      .select('id,total,estado,metodo_pago')
      .gte('created_at', startOfToday.toISOString());

    if (error) throw error;

    const pedidos = (data || []) as Array<Pick<Pedido, 'id' | 'total' | 'estado' | 'metodo_pago'>>;
    const completed = pedidos.filter((pedido) => pedido.estado === 'completado');
    const ventasHoy = completed.reduce((sum, pedido) => sum + Number(pedido.total || 0), 0);
    const pedidosHoy = pedidos.length;
    const ticketPromedio = completed.length ? Math.round(ventasHoy / completed.length) : 0;

    const paymentBreakdown = ['efectivo', 'transferencia'].map((metodo) => {
      const methodOrders = pedidos.filter((pedido) => pedido.metodo_pago === metodo);
      return {
        metodo,
        count: methodOrders.length,
        total: methodOrders.reduce((sum, pedido) => sum + Number(pedido.total || 0), 0),
      };
    });

    return {
      ventasHoy,
      pedidosHoy,
      ticketPromedio,
      paymentBreakdown,
    };
  },

  async createRepartidor(repartidor: Partial<Repartidor>) {
    const { data, error } = await supabase.from('repartidores').insert(repartidor).select().single();
    if (error) throw error;
    return data as Repartidor;
  },

  async loginRepartidor(usuario: string, pin: string) {
    const { data, error } = await supabase
      .from('repartidores')
      .select('*')
      .eq('usuario', usuario.trim())
      .eq('pin', pin.trim())
      .maybeSingle();

    if (error) throw error;
    return data as Repartidor | null;
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
    const [{ data: pedidosData, error: pedidosError }, { data: productosData, error: productosError }] = await Promise.all([
      supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
      supabase.from('productos').select('*'),
    ]);

    if (pedidosError) throw pedidosError;
    if (productosError) throw productosError;

    const productos = (productosData || []) as Producto[];
    return (pedidosData || []).map((pedido) => normalizePedido(pedido as Partial<Pedido>, productos)) as Pedido[];
  },

  /**
   * Optimized fetch for Admin panel: load active orders (pendiente, en_preparacion, en_camino)
   * plus the most recent 50 completed orders. This keeps the payload small when there are
   * thousands of historical pedidos.
   */
  async getPedidosForAdmin() {
    const activeStates = ['pendiente', 'en_preparacion', 'en_camino', 'en_cocina'];
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [{ data: activeData, error: activeErr }, { data: deliveredData, error: deliveredErr }, { data: productosData, error: productosError }] = await Promise.all([
      supabase
        .from('pedidos')
        .select('*')
        .in('estado', activeStates)
        .order('created_at', { ascending: false }),
      supabase
        .from('pedidos')
        .select('*')
        .in('estado', ['completado', 'entregado'])
        .gte('created_at', startOfToday.toISOString())
        .order('created_at', { ascending: false })
        .limit(50),
      supabase.from('productos').select('*'),
    ]);

    if (activeErr) throw activeErr;
    if (deliveredErr) throw deliveredErr;
    if (productosError) throw productosError;

    const active = (activeData || []) as Pedido[];
    const delivered = (deliveredData || []) as Pedido[];
    const productos = (productosData || []) as Producto[];

    // merge keeping active first, and avoid duplicates
    const ids = new Set<string>();
    const merged: Pedido[] = [];

    active.forEach((p) => {
      if (p?.id) {
        ids.add(p.id);
      }
      merged.push(p as Pedido);
    });

    delivered.forEach((p) => {
      if (p?.id && !ids.has(p.id)) {
        merged.push(p as Pedido);
      }
    });

    return merged.map((pedido) => normalizePedido(pedido as Partial<Pedido>, productos)) as Pedido[];
  },

  async getPedido(id: string) {
    const [{ data: pedidoData, error: pedidoError }, { data: productosData, error: productosError }] = await Promise.all([
      supabase.from('pedidos').select('*').eq('id', id).maybeSingle(),
      supabase.from('productos').select('*'),
    ]);

    if (pedidoError) throw pedidoError;
    if (productosError) throw productosError;

    const productos = (productosData || []) as Producto[];
    return normalizePedido(pedidoData as Pedido | null, productos);
  },

  async createPedido(pedido: Partial<Pedido>) {
    const normalized = normalizePedidoPayload({ ...pedido, estado: 'pendiente' });
    const { data, error } = await supabase.from('pedidos').insert(normalized).select().single();
    if (error) throw error;
    return data as Pedido;
  },

  async updatePedido(id: string, updates: Partial<Pedido>) {
    const normalized = normalizePedidoPayload(updates);
    const { data, error } = await supabase.from('pedidos').update(normalized).eq('id', id).select().single();
    if (error) throw error;
    return data as Pedido;
  },

  subscribeToOrders(callback: (pedido: Pedido, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void) {
    const channel = supabase.channel('pedidos_updates');

    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pedidos' },
      (payload) => {
        const eventType = ((payload as any).eventType || (payload as any).type) as 'INSERT' | 'UPDATE' | 'DELETE';
        const nextRaw = payload.new ?? payload.old;
        const next = normalizePedido(nextRaw as Partial<Pedido> | null);
        if (next) {
          callback(next, eventType);
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
        const nextRaw = payload.new ?? payload.old;
        const next = normalizePedido(nextRaw as Partial<Pedido> | null);
        if (next) {
          callback(next);
        }
      }
    );

    channel.subscribe();
    return channel;
  },
};
