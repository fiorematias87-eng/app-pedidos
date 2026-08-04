import React, { useEffect, useState } from 'react';
import { pedidosService } from '../services/pedidos.service';
import type { Pedido } from '../types/delivery';

export default function DeliveryPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);

  useEffect(() => {
    const load = async () => {
      const pedidos = await pedidosService.getPedidos();
      setOrders(pedidos.filter((pedido) => pedido.estado === 'en_camino'));
    };

    load();

    const channel = pedidosService.subscribe((pedido) => {
      if (pedido.estado === 'en_camino') {
        setOrders((prev) => {
          const filtered = prev.filter((item) => item.id !== pedido.id);
          return [pedido, ...filtered];
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto max-w-5xl px-6 py-4">
          <h1 className="text-xl font-semibold">Delivery / Repartidor</h1>
          <p className="text-sm text-slate-400">Vista móvil para despacho en ruta</p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4">
        {orders.map((order) => (
          <section
            key={order.id}
            className="mb-3 rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">{order.cliente}</h2>
                <p className="text-sm text-slate-400">{order.direccion}</p>
              </div>
              <span className="rounded-full bg-amber-600 px-2 py-1 text-xs">
                {order.estado}
              </span>
            </div>

            <div className="mt-3 flex gap-2">
              <a
                href={`https://maps.google.com/?q=${order.lat ?? 0},${order.lng ?? 0}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium"
              >
                📍 Navegar en Google Maps
              </a>
              <button className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium">
                💬 WhatsApp
              </button>
            </div>

            {order.notasAdmin && (
              <p className="mt-3 rounded-lg bg-slate-800 p-3 text-sm text-slate-300">
                {order.notasAdmin}
              </p>
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
