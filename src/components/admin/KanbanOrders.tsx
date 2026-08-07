import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, History, RotateCcw, Truck } from 'lucide-react';
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

type TabKey = 'nuevos' | 'cocina' | 'camino' | 'completados' | 'historial';

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
      {
        key: 'historial',
        label: '🕘 Historial',
        filter: (order) => order.estado === 'completado',
        badgeClass: 'bg-slate-700/80 text-slate-300',
      },
    ],
    []
  );

  const visibleOrders = useMemo(() => {
    const activeConfig = tabs.find((tab) => tab.key === activeTab);
    if (!activeConfig) return [];
    return [...orders.filter(activeConfig.filter)].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [activeTab, orders, tabs]);

  const isKitchenTab = activeTab === 'cocina';
  const isHistoryTab = activeTab === 'historial';

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
        <div className={`space-y-2 ${isKitchenTab || isHistoryTab ? 'max-h-[500px] overflow-y-auto pr-2' : 'max-h-[500px] overflow-y-auto pr-2'}`} style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 #020617' }}>
          {visibleOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center text-sm text-slate-500">
              No hay pedidos en esta pestaña.
            </div>
          ) : (
            visibleOrders.map((order) => {
              const selectedDriver = order.repartidor_id || assignDriverSelection[order.id] || '';
              const isPending = order.estado === 'pendiente';
              const isInKitchen = order.estado === 'en_preparacion';
              const delayBadge = getDelayBadge(order.created_at);

              return (
                <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">#{order.id?.slice(0, 8)}</p>
                        {order.origen === 'whatsapp' ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">WhatsApp</span> : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${delayBadge.className}`}>{delayBadge.label}</span>
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

                      <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-2">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Detalle</p>
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'ítem' : 'ítems'}
                          </span>
                        </div>
                        <div className="max-h-56 space-y-2.5 overflow-y-auto pr-1">
                          {order.items?.length ? order.items.map((it, i) => {
                            const imageUrl = (it as any).imagen_url || (it as any).imagen || (it as any).foto || (it as any).img || (it as any).producto?.imagen_url || (it as any).producto?.imagen || (it as any).producto?.foto || null;
                            const notes = (it as any).notas || (it as any).observaciones || null;
                            const name = (it as any).nombre || 'Producto';
                            const quantity = (it as any).cantidad || 1;
                            return (
                              <div key={`${order.id}-${i}`} className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
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
                            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-3 py-3 text-sm text-slate-500">
                              Sin productos cargados
                            </div>
                          )}
                        </div>
                      </div>
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
                        <div className="flex flex-col gap-2 rounded-xl border border-emerald-700/50 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Completado
                          </div>
                          {isHistoryTab ? (
                            <button
                              type="button"
                              onClick={() => void handleAdvanceStatus(order, 'en_preparacion')}
                              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-500/15 px-2 py-1.5 text-[11px] font-semibold text-emerald-100"
                            >
                              <RotateCcw className="h-3 w-3" /> Restaurar a cocina
                            </button>
                          ) : null}
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
