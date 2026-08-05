import React, { useEffect, useState } from 'react';
import { CheckCircle2, MapPin, Phone, Smartphone, Truck } from 'lucide-react';
import { pedidosService } from '../services/pedidos.service';
import { supabase } from '../lib/supabase';
import type { Pedido } from '../types/delivery';
import EmptyState from '../components/common/EmptyState';

export default function DeliveryPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);

  useEffect(() => {
    const load = async () => {
      const pedidos = await pedidosService.getPedidos();
      setOrders(pedidos.filter((pedido) => pedido.estado === 'en_camino'));
    };

    load();

    const channel = supabase.channel('delivery-realtime');
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' }, (payload) => {
      const pedido = payload.new as Pedido;
      if (pedido.estado === 'en_camino' || pedido.estado === 'entregado') {
        setOrders((prev) => {
          const filtered = prev.filter((item) => item.id !== pedido.id);
          return pedido.estado === 'en_camino' ? [pedido, ...filtered] : filtered;
        });
      }
    });
    channel.subscribe();

    return () => channel.unsubscribe();
  }, []);

  const handleDelivery = async (order: Pedido) => {
    await pedidosService.updatePedido(order.id, { estado: 'entregado', updated_at: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-emerald-400" />
            <h1 className="text-xl font-semibold">Vista Repartidor</h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">Comandas asignadas y acciones rápidas</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {orders.length ? orders.map((order) => (
          <section key={order.id} className="mb-4 rounded-3xl border border-slate-800 bg-slate-900 p-4 shadow-xl shadow-slate-950/30">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{order.cliente_nombre}</h2>
                <p className="mt-1 text-sm text-slate-400">{order.cliente_direccion}</p>
              </div>
              <span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs text-violet-300">En camino</span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
              <div className="flex items-center gap-2 text-sm text-slate-300"><Phone className="h-4 w-4 text-sky-400" /><span>{order.cliente_telefono || 'Sin teléfono'}</span></div>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-300"><MapPin className="h-4 w-4 text-emerald-400" /><span>Ruta lista para entregar</span></div>
              {order.notas ? <div className="mt-3 rounded-xl bg-slate-800 p-3 text-sm text-slate-300">{order.notas}</div> : null}
              <div className="mt-3 space-y-1 text-sm text-slate-400">
                {order.productos.map((producto, index) => <p key={`${order.id}-${index}`}>{producto.cantidad}x {producto.nombre}</p>)}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.cliente_direccion)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4" />Abrir Maps</a>
              <a href={`https://wa.me/${order.cliente_telefono || ''}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-sm font-semibold text-white"><Smartphone className="h-4 w-4" />WhatsApp</a>
              <button onClick={() => handleDelivery(order)} className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 className="h-4 w-4" />Marcar entregado</button>
            </div>
          </section>
        )) : <EmptyState title="Sin entregas activas" description="Los pedidos asignados aparecerán aquí en tiempo real." />}
      </main>
    </div>
  );
}
