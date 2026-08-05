import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock3, MapPin, Truck } from 'lucide-react';
import { pedidosService } from '../services/pedidos.service';
import { supabase } from '../lib/supabase';
import type { Pedido } from '../types/delivery';

const steps = [
  { key: 'pendiente', label: 'Pendiente', icon: Clock3 },
  { key: 'preparando', label: 'En Preparación', icon: Circle },
  { key: 'en_camino', label: 'En Camino', icon: Truck },
  { key: 'entregado', label: 'Entregado', icon: CheckCircle2 },
] as const;

const statusOrder: Record<string, number> = {
  pendiente: 0,
  preparando: 1,
  en_camino: 2,
  entregado: 3,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

export default function PedidoTrackingPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<Pedido | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const load = async () => {
      const data = await pedidosService.getPedido(id);
      if (isMounted) setPedido(data);
    };
    void load();

    const channel = supabase.channel(`tracking-${id}`);
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos', filter: `id=eq.${id}` }, (payload) => {
      const next = payload.new ?? payload.old;
      if (next) setPedido(next as Pedido);
    });
    channel.subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [id]);

  const currentStep = useMemo(() => {
    if (!pedido) return 0;
    return statusOrder[pedido.estado] ?? 0;
  }, [pedido]);

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[#020617] p-4 text-slate-100">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-800 bg-[#07111f] p-6">
          <p className="text-sm text-cyan-400">Cargando seguimiento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-800 bg-[#07111f] p-4 sm:p-6">
        <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-3 py-2 text-sm text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Volver al menú
        </Link>

        <div className="mt-4 rounded-[24px] border border-cyan-900/70 bg-slate-900/70 p-4">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Seguimiento de pedido</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{pedido.cliente_nombre}</h1>
          <p className="mt-2 text-sm text-slate-400">{pedido.cliente_direccion}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-cyan-400">
              <Truck className="h-4 w-4" />
              <span className="text-sm font-semibold">Estado</span>
            </div>
            <div className="mt-3 space-y-3">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStep;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-semibold">Detalle</span>
            </div>
            <div className="mt-3 space-y-2">
              <p className="text-sm text-slate-400">Método de entrega: <span className="font-medium text-white">{pedido.metodo_entrega === 'retiro' ? 'Retiro' : 'Delivery'}</span></p>
              <p className="text-sm text-slate-400">Método de pago: <span className="font-medium text-white">{pedido.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}</span></p>
              <p className="text-sm text-slate-400">Total: <span className="font-medium text-white">{formatCurrency(pedido.total)}</span></p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[24px] border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm font-semibold text-white">Productos</p>
          <div className="mt-3 space-y-2">
            {pedido.productos.map((item, index) => (
              <div key={`${item.nombre}-${index}`} className="flex items-center justify-between rounded-2xl bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
                <span>{item.cantidad}× {item.nombre}</span>
                <span>{formatCurrency(item.precio * item.cantidad)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
