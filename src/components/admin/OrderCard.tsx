import React from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import type { Pedido, Repartidor } from '../../types/delivery';

type OrderCardProps = {
  order: Pedido;
  repartidores: Repartidor[];
  formatCurrency: (value: number) => string;
  getTimeElapsed: (createdAt: string) => string;
  getAssignedDriverName: (order: Pedido) => string;
  onAdvanceStatus?: (order: Pedido, nextState: Pedido['estado']) => Promise<void>;
  onAssignDriver?: (order: Pedido, driverId: string) => Promise<void>;
  onQuickAssign?: (order: Pedido) => Promise<void>;
  onFinalize?: (order: Pedido) => void;
  assignDriverSelection: Record<string, string>;
  setAssignDriverSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

export default function OrderCard({
  order,
  repartidores,
  formatCurrency,
  getTimeElapsed,
  getAssignedDriverName,
  onAdvanceStatus,
  onAssignDriver,
  onQuickAssign,
  onFinalize,
  assignDriverSelection,
  setAssignDriverSelection,
}: OrderCardProps) {
  const getDelayBadge = (createdAt: string) => {
    const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));

    if (minutes < 10) {
      return {
        label: `${minutes}m`,
        className: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-200',
      };
    }

    if (minutes < 20) {
      return {
        label: `${minutes}m`,
        className: 'border-amber-500/40 bg-amber-500/15 text-amber-200',
      };
    }

    return {
      label: `${minutes}m`,
      className: 'border-rose-500/40 bg-rose-500/15 text-rose-200',
    };
  };

  const delayBadge = getDelayBadge(order.created_at);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-950/80 overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Header compacto */}
      <div className="bg-slate-900/60 px-3 py-2.5 border-b border-slate-700">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-400 font-semibold">
              #{order.id?.slice(0, 8)}
            </p>
            <p className="text-sm font-semibold text-white truncate">
              {order.cliente_nombre}
            </p>
          </div>
          <span className={`whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-bold ${delayBadge.className}`}>
            {delayBadge.label}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="px-3 py-2.5 space-y-1.5 text-xs text-slate-300">
        {/* Dirección */}
        <div className="grid gap-2 text-[10px] text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">📍 {order.cliente_direccion || 'Retiro'}</span>
            <a
              href={`tel:${order.cliente_telefono}`}
              className="truncate text-cyan-300 transition hover:text-cyan-200"
            >
              {order.cliente_telefono}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-900/70 p-2 text-[10px] text-slate-300">
            <span>Subtotal</span>
            <span className="text-right text-slate-200">{formatCurrency(order.subtotal)}</span>
            <span>Envío</span>
            <span className="text-right text-slate-200">{formatCurrency(order.costo_envio)}</span>
            <span>Método</span>
            <span className="text-right text-slate-200">
              {order.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}
            </span>
            {order.metodo_pago === 'efectivo' && order.paga_con ? (
              <>
                <span>Paga con</span>
                <span className="text-right text-slate-200">{formatCurrency(Number(order.paga_con))}</span>
              </>
            ) : null}
            <span className="font-semibold text-slate-100">Total</span>
            <span className="text-right font-semibold text-amber-400">{formatCurrency(order.total)}</span>
            {order.metodo_pago === 'efectivo' && order.paga_con ? (
              <>
                <span>Cambio</span>
                <span className="text-right text-slate-200">
                  {formatCurrency(Math.max(0, Number(order.paga_con) - order.total))}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-slate-500">
              📦 {order.items?.length || 0} productos
            </span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
              {order.items?.length === 1 ? '1 ítem' : `${order.items?.length || 0} ítems`}
            </span>
          </div>

          <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
            {order.items?.length ? order.items.map((item, idx) => {
              const imageUrl = (item as any).imagen_url || (item as any).imagen || (item as any).foto || (item as any).img || (item as any).producto?.imagen_url || (item as any).producto?.imagen || (item as any).producto?.foto || null;
              const notes = (item as any).notas || (item as any).observaciones || null;
              const name = item.nombre || 'Producto';
              const quantity = item.cantidad || 1;
              return (
                <div key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/15 text-lg font-black text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.18)]">
                    {quantity}x
                  </div>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
                    <img
                      src={imageUrl || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27250%27%3E%3Crect width=%27400%27 height=%27250%27 fill=%27%23222%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2720%27 fill=%27%23aaa%27%3ESin imagen%3C/text%3E%3C/svg%3E'}
                      alt={name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27250%27%3E%3Crect width=%27400%27 height=%27250%27 fill=%27%23222%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2720%27 fill=%27%23aaa%27%3ESin imagen%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight text-white">{name}</p>
                    {notes ? (
                      <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
                        <span>⚠️</span>
                        <span>{notes}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-3 py-3 text-xs text-slate-500">
                Sin productos cargados
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones contextuales */}
      <div className="border-t border-slate-700 px-3 py-2.5 space-y-1.5">
        {order.estado === 'pendiente' && onAdvanceStatus ? (
          <button
            type="button"
            onClick={() => void onAdvanceStatus(order, 'en_preparacion')}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-cyan-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-cyan-500"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Iniciar en Cocina
          </button>
        ) : null}

        {order.estado === 'en_preparacion' && onAssignDriver ? (
          <div className="space-y-2">
            <div className="space-y-1">
              <select
                value={assignDriverSelection[order.id] || ''}
                onChange={(e) =>
                  setAssignDriverSelection((prev) => ({
                    ...prev,
                    [order.id]: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-500"
              >
                <option value="">Asignar repartidor...</option>
                {repartidores.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.nombre}
                  </option>
                ))}
              </select>
              {assignDriverSelection[order.id] ? (
                <button
                  type="button"
                  onClick={() =>
                    void onAssignDriver(order, assignDriverSelection[order.id])
                  }
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-500"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Enviar al repartidor
                </button>
              ) : (
                <p className="text-[10px] text-slate-500">
                  Seleccioná un repartidor para despachar.
                </p>
              )}
            </div>
            {order.origen === 'whatsapp' && onQuickAssign ? (
              <button
                type="button"
                onClick={() => void onQuickAssign(order)}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-2 py-1.5 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Asignar a delivery rápidamente
              </button>
            ) : null}
          </div>
        ) : null}

        {order.estado === 'en_camino' ? (
          <div className="rounded-lg bg-blue-500/10 border border-blue-600/50 px-2 py-1.5 text-xs text-blue-200">
            <p className="font-semibold">🛵 {getAssignedDriverName(order)}</p>
            <p className="text-[10px] text-blue-100">El pedido ya está en reparto.</p>
          </div>
        ) : null}

        {order.estado === 'completado' && onFinalize ? (
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-600/50 px-2 py-1.5 text-xs text-emerald-200">
            <p className="font-semibold">✅ {getAssignedDriverName(order)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
