import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Truck } from 'lucide-react';
import type { Pedido, Repartidor } from '../../types/delivery';

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

type TabKey = 'nuevos' | 'cocina' | 'camino' | 'completados';

type TabConfig = {
  key: TabKey;
  label: string;
  filter: (order: Pedido) => boolean;
  badgeClass: string;
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
  const [activeTab, setActiveTab] = useState<TabKey>('nuevos');

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        key: 'nuevos',
        label: '📥 Nuevos',
        filter: (order) => order.estado === 'pendiente',
        badgeClass: 'bg-amber-500/15 text-amber-300',
      },
      {
        key: 'cocina',
        label: '🍳 En Cocina',
        filter: (order) => order.estado === 'en_preparacion',
        badgeClass: 'bg-orange-500/15 text-orange-300',
      },
      {
        key: 'camino',
        label: '🛵 En Camino',
        filter: (order) => order.estado === 'en_camino',
        badgeClass: 'bg-cyan-500/15 text-cyan-300',
      },
      {
        key: 'completados',
        label: '✅ Completados',
        filter: (order) => order.estado === 'completado',
        badgeClass: 'bg-emerald-500/15 text-emerald-300',
      },
    ],
    []
  );

  const visibleOrders = useMemo(() => {
    const activeConfig = tabs.find((tab) => tab.key === activeTab);
    if (!activeConfig) return [];
    return [...orders.filter(activeConfig.filter)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeTab, orders, tabs]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count = orders.filter(tab.filter).length;
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                {tab.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] ${isActive ? 'bg-slate-950/20 text-slate-950' : tab.badgeClass}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3">
        <div className="space-y-2">
          {visibleOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center text-sm text-slate-500">
              No hay pedidos en esta pestaña.
            </div>
          ) : (
            visibleOrders.map((order) => {
              const selectedDriver = order.repartidor_id || assignDriverSelection[order.id] || '';
              const isPending = order.estado === 'pendiente';
              const isInKitchen = order.estado === 'en_preparacion';

              return (
                <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">#{order.id?.slice(0, 8)}</p>
                        {order.origen === 'whatsapp' ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">WhatsApp</span> : null}
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">{getTimeElapsed(order.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">{order.cliente_nombre}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>{order.cliente_telefono}</span>
                        <span>{order.cliente_direccion || 'Retiro'}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
                        <span className="rounded-full bg-slate-800 px-2 py-1">Total {formatCurrency(order.total)}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">{order.items?.length || 0} productos</span>
                        {order.repartidor_nombre ? <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-cyan-300">{order.repartidor_nombre}</span> : null}
                      </div>
                      {/* Miniaturas de productos */}
                      {order.items && order.items.length ? (
                        <div className="mt-2 flex items-center gap-2">
                          {order.items.slice(0, 4).map((it, i) => {
                            const url = (it as any).imagen_url || (it as any).producto?.imagen_url || null;
                            return (
                              <div key={i} className="h-10 w-10 overflow-hidden rounded-lg bg-slate-800">
                                {url ? (
                                  <img src={url} alt={(it as any).nombre || 'producto'} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-xs text-slate-500">—</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>

                    <div className="w-full md:w-72">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => void handleAdvanceStatus(order, 'en_preparacion')}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Enviar a Cocina
                        </button>
                      ) : null}

                      {isInKitchen ? (
                        <div className="space-y-2">
                          <select
                            value={selectedDriver}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAssignDriverSelection((prev) => ({ ...prev, [order.id]: value }));
                              if (value) {
                                void handleAssignAndSend(order, value);
                              }
                            }}
                            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                          >
                            <option value="">Asignar repartidor</option>
                            {repartidores.map((driver) => (
                              <option key={driver.id} value={driver.id}>{driver.nombre}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleQuickAssign(order)}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                          >
                            <Truck className="h-4 w-4" />
                            Asignar delivery rápido
                          </button>
                        </div>
                      ) : null}

                      {order.estado === 'en_camino' ? (
                        <div className="rounded-xl border border-cyan-700/50 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">
                          <div className="flex items-center gap-2 font-semibold"><Truck className="h-4 w-4" /> {getAssignedDriverName(order)}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-cyan-100"><Clock3 className="h-3 w-3" /> En reparto</div>
                        </div>
                      ) : null}

                      {order.estado === 'completado' ? (
                        <div className="flex items-center gap-2 rounded-xl border border-emerald-700/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Completado
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
