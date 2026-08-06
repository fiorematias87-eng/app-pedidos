import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, Phone, Smartphone, Truck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosService } from '../services/pedidos.service';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import type { Pedido, Repartidor } from '../types/delivery';
import EmptyState from '../components/common/EmptyState';

export default function DeliveryPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [tab, setTab] = useState<'mine' | 'kitchen' | 'peers'>('mine');

  useEffect(() => {
    const load = async () => {
      const [drivers, pedidos] = await Promise.all([pedidosService.getRepartidores(), pedidosService.getPedidos()]);
      setRepartidores(drivers);
      setOrders(pedidos);
        if (drivers.length > 0) {
          // load persisted driver selection if any
          const persisted = localStorage.getItem('delivery_driver_id');
          if (persisted && drivers.find((d) => d.id === persisted)) {
            setSelectedDriverId(persisted);
          } else {
            setSelectedDriverId(drivers[0].id);
          }
        }
    };

    void load();

    const channel = pedidosService.subscribeToOrders((pedido, eventType) => {
      setOrders((prev) => {
        const exists = prev.find((item) => item.id === pedido.id);
        if (eventType === 'DELETE') {
          return prev.filter((item) => item.id !== pedido.id);
        }
        if (!exists) {
          return [pedido, ...prev];
        }
        return prev.map((item) => (item.id === pedido.id ? pedido : item));
      });
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const kitchenCount = useMemo(
    () => orders.filter((order) => order.estado === 'en_cocina' || order.estado === 'en_preparacion').length,
    [orders]
  );
  const assignedOrders = useMemo(
    () => orders.filter((order) => order.estado === 'en_camino' && (selectedDriverId ? order.repartidor_id === selectedDriverId : true)),
    [orders, selectedDriverId]
  );
  const availableOrders = useMemo(
    () => orders.filter(
      (order) =>
        (order.estado === 'pendiente' || order.estado === 'en_preparacion') &&
        !order.repartidor_id
    ),
    [orders]
  );
  const selectedDriver = repartidores.find((driver) => driver.id === selectedDriverId);

  useEffect(() => {
    // persist selected driver
    if (selectedDriverId) {
      localStorage.setItem('delivery_driver_id', selectedDriverId);
    }
  }, [selectedDriverId]);

  const handleDelivery = async (order: Pedido) => {
    await pedidosService.updatePedido(order.id, { estado: 'entregado', updated_at: new Date().toISOString() });
  };

  const handleTakeOrder = async (order: Pedido) => {
    if (!selectedDriverId) {
      toast.error('Seleccioná primero un repartidor');
      return;
    }

    await pedidosService.updatePedido(order.id, {
      repartidor_id: selectedDriverId,
      estado: 'en_camino',
      updated_at: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 p-4">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-lg shadow-slate-950/50">
          <div className="mb-3">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">Repartidor</p>
            <h1 className="mt-1 text-xl font-bold text-white">
              👋 Hola, {selectedDriver?.nombre || 'Selecciona un repartidor'}
            </h1>
          </div>

          <select
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-cyan-500"
          >
            <option value="">-- Selecciona repartidor --</option>
            {repartidores.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <div className="flex gap-2">
            <button onClick={() => setTab('mine')} className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${tab === 'mine' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              Mis Pedidos
            </button>
            <button onClick={() => setTab('kitchen')} className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${tab === 'kitchen' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              Monitor de Cocina
            </button>
            <button onClick={() => setTab('peers')} className={`flex-1 rounded-2xl px-3 py-2 text-sm font-semibold ${tab === 'peers' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
              Compañeros
            </button>
          </div>

          <div className="mt-4">
            {tab === 'mine' ? (
              <div className="space-y-3">
                {assignedOrders.length ? (
                  assignedOrders.map((order, idx) => (
                    <div key={order.id} className="overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-900/80 shadow-lg transition hover:border-cyan-600 hover:shadow-cyan-500/20">
                      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-cyan-600 text-xs font-bold text-white">{idx + 1}</span>
                          <span className="text-sm font-bold text-slate-300">Pedido #{order.id?.slice(0, 8)}</span>
                        </div>
                      </div>

                      <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white break-words">{order.cliente_direccion}</p>
                            <div className="mt-2 flex gap-2">
                              <button onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.cliente_direccion)}`, '_blank')} className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white">🗺️ Abrir Maps</button>
                              <button onClick={() => { void handleDelivery(order); }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">✅ Marcar Entregado</button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-slate-950/70 text-sm text-slate-400 max-h-24 overflow-y-auto">
                        <p className="text-xs uppercase tracking-[0.1em] text-slate-500 mb-2">📦 Productos</p>
                        <div className="space-y-1">
                          {order.items.map((p, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <span>{p.cantidad}× {p.nombre}</span>
                              <span className="text-xs text-slate-500">{formatCurrency(p.precio * p.cantidad)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border-2 border-dashed border-slate-700 bg-slate-950/70 p-8 text-center">
                    <Truck className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">Sin pedidos asignados</p>
                    <p className="mt-1 text-xs text-slate-500">Los pedidos aparecerán aquí cuando estén en camino.</p>
                  </div>
                )}
              </div>
            ) : tab === 'kitchen' ? (
              <div className="space-y-3">
                {orders.filter(o => o.estado === 'pendiente' || o.estado === 'en_preparacion').map((order) => (
                  <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">#{order.id?.slice(0,8)} · {order.cliente_nombre}</p>
                        <p className="text-sm font-semibold text-white">{order.cliente_direccion || 'Retiro'}</p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        <p>{order.estado}</p>
                        <p className="font-bold text-white">{formatCurrency(order.total)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {repartidores.map((driver) => {
                  const assigned = orders.filter(o => o.repartidor_id === driver.id && o.estado === 'en_camino');
                  return (
                    <div key={driver.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{driver.nombre}</p>
                        <p className="text-xs text-slate-400">Asignados: {assigned.length}</p>
                      </div>
                      <div className="text-xs text-slate-400">{assigned.slice(0,3).map(a => <div key={a.id}>#{a.id?.slice(0,6)} {formatCurrency(a.total)}</div>)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 pb-4">
          <p>Última actualización: {new Date().toLocaleTimeString('es-AR')}</p>
        </div>
      </div>
    </div>
  );
}
