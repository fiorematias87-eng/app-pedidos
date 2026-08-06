import React, { useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Truck } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);

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
          <span className="whitespace-nowrap text-[10px] font-bold text-amber-300 bg-slate-800 px-2 py-1 rounded-full">
            {getTimeElapsed(order.created_at)}
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

        {/* Productos desplegable */}
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-between gap-2 rounded-lg bg-slate-800/50 px-2 py-1.5 text-left hover:bg-slate-800 transition"
        >
          <span className="text-[10px] uppercase tracking-[0.1em] font-semibold text-slate-400">
            📦 {order.items?.length || 0} productos
          </span>
          {showDetails ? (
            <ChevronUp className="h-3 w-3 text-slate-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-slate-500" />
          )}
        </button>

        {/* Detalle de productos (oculto por defecto) */}
        {showDetails ? (
          <div className="rounded-lg bg-slate-900/80 p-2 border border-slate-800 max-h-[120px] overflow-y-auto text-[10px] text-slate-400 space-y-0.5">
            {order.items?.map((p, idx) => {
              const imgUrl = (p as any).imagen_url || (p as any).producto?.imagen_url || null;
              return (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-slate-800">
                      {imgUrl ? (
                        <img src={imgUrl} alt={p.nombre} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-500">—</div>
                      )}
                    </div>
                    <span className="truncate">{p.cantidad}× {p.nombre}</span>
                  </div>
                  <span className="text-slate-500">{formatCurrency(p.precio * p.cantidad)}</span>
                </div>
              );
            })}
          </div>
        ) : null}
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
