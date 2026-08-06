import React from 'react';
import type { Pedido, Repartidor } from '../../types/delivery';
import OrderCard from './OrderCard';

type KanbanOrdersProps = {
  orders: Pedido[];
  repartidores: Repartidor[];
  getTimeElapsed: (createdAt: string) => string;
  getAssignedDriverName: (order: Pedido) => string;
  handleAdvanceStatus: (order: Pedido, nextState: Pedido['estado']) => Promise<void>;
  handleAssignAndSend: (order: Pedido, driverId: string) => Promise<void>;
  handleQuickAssign: (order: Pedido) => Promise<void>;
  formatCurrency: (value: number) => string;
  assignDriverSelection: Record<string, string>;
  setAssignDriverSelection: React.Dispatch<React.SetStateAction<Record<string, string>>>;
};

type KanbanColumnKey = 'pendientes' | 'cocina' | 'empaque' | 'camino' | 'entregados';

const statusColors: Record<string, { bg: string; text: string; border: string; header: string }> = {
  pendiente: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
    border: 'border-amber-600',
    header: 'bg-amber-500/20',
  },
  en_preparacion: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
    border: 'border-orange-600',
    header: 'bg-orange-500/20',
  },
  en_cocina: {
    bg: 'bg-orange-600/10',
    text: 'text-orange-300',
    border: 'border-orange-600',
    header: 'bg-orange-600/20',
  },
  en_camino: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-300',
    border: 'border-blue-600',
    header: 'bg-blue-500/20',
  },
  entregado: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
    border: 'border-emerald-600',
    header: 'bg-emerald-500/20',
  },
};

export default function KanbanOrders({
  orders,
  repartidores,
  getTimeElapsed,
  getAssignedDriverName,
  handleAdvanceStatus,
  handleAssignAndSend,
  handleQuickAssign,
  formatCurrency,
  assignDriverSelection,
  setAssignDriverSelection,
}: KanbanOrdersProps) {
  const columns: Array<{
    key: KanbanColumnKey;
    title: string;
    filter: (order: Pedido) => boolean;
    colorKey: keyof typeof statusColors;
  }> = [
    {
      key: 'pendientes',
      title: '📋 Pendientes',
      filter: (order) => order.estado === 'pendiente',
      colorKey: 'pendiente',
    },
    {
      key: 'cocina',
      title: '🍳 Cocina',
      filter: (order) => order.estado === 'en_preparacion',
      colorKey: 'en_preparacion',
    },
    {
      key: 'empaque',
      title: '📦 Empaque',
      filter: (order) => order.estado === 'en_cocina',
      colorKey: 'en_cocina',
    },
    {
      key: 'camino',
      title: '🛵 Camino',
      filter: (order) => order.estado === 'en_camino',
      colorKey: 'en_camino',
    },
    {
      key: 'entregados',
      title: '✅ Entregados',
      filter: (order) => order.estado === 'entregado',
      colorKey: 'entregado',
    },
  ];

  // Métricas de repartidores
  const driverMetrics = repartidores.map((driver) => {
    const assigned = orders.filter(
      (o) => o.repartidor_id === driver.id && o.estado === 'en_camino'
    ).length;
    const delivered = orders.filter(
      (o) => o.repartidor_id === driver.id && o.estado === 'entregado'
    ).length;
    return { driver, assigned, delivered };
  });

  return (
    <div className="space-y-4">
      {/* Métricas de repartidores */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold mb-3">
          Repartidores activos
        </p>
        <div className="flex flex-wrap gap-2">
          {driverMetrics.map(({ driver, assigned, delivered }) => {
            const isActive = assigned > 0;
            return (
              <div
                key={driver.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  isActive
                    ? 'border-cyan-600 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-700 bg-slate-800/50 text-slate-400'
                }`}
              >
                <span>{driver.nombre}</span>
                <span className="ml-1 text-[10px] text-slate-500">
                  🛵 {assigned} | ✅ {delivered}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kanban Grid con Scroll */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {columns.map(({ key, title, filter, colorKey }) => {
          const columnOrders = orders.filter(filter);
          const count = columnOrders.length;
          const colors = statusColors[colorKey];

          return (
            <div
              key={key}
              className={`flex flex-col rounded-2xl border-2 ${colors.border} overflow-hidden`}
            >
              {/* Header */}
              <div className={`${colors.header} border-b ${colors.border} px-4 py-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${colors.text}`}>{title}</h3>
                  <span
                    className={`rounded-full bg-slate-800 px-2 py-1 text-xs font-bold ${colors.text}`}
                  >
                    {count}
                  </span>
                </div>
              </div>

              {/* Scroll Container */}
              <div className="flex-1 overflow-y-auto max-h-[550px] p-3 space-y-2">
                {columnOrders.length === 0 ? (
                  <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 py-6 text-center">
                    <p className="text-xs text-slate-500">Sin pedidos</p>
                  </div>
                ) : (
                  columnOrders
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        repartidores={repartidores}
                        formatCurrency={formatCurrency}
                        getTimeElapsed={getTimeElapsed}
                        getAssignedDriverName={getAssignedDriverName}
                        onAdvanceStatus={handleAdvanceStatus}
                        onAssignDriver={handleAssignAndSend}
                        onQuickAssign={handleQuickAssign}
                        assignDriverSelection={assignDriverSelection}
                        setAssignDriverSelection={setAssignDriverSelection}
                      />
                    ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
