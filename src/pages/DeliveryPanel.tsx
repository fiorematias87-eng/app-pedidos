import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MapPin, Phone, Smartphone, Truck, MessageCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosService } from '../services/pedidos.service';
import { supabase } from '../lib/supabase';
import { uploadImage } from '../lib/uploadImage';
import { formatCurrency } from '../utils/formatters';
import type { Pedido, Repartidor } from '../types/delivery';
import EmptyState from '../components/common/EmptyState';

const getMapsUrl = (direccion: string, localidad: string = 'Florencio Varela') => {
  const query = encodeURIComponent(`${direccion}, ${localidad}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

const getWhatsAppUrl = (telefono: string) => {
  const numLimpio = telefono.replace(/\D/g, '');
  const phoneFormatted = numLimpio.startsWith('54') ? numLimpio : `549${numLimpio}`;
  return `https://wa.me/${phoneFormatted}`;
};

export default function DeliveryPanel() {
  const [orders, setOrders] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Repartidor[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [tab, setTab] = useState<'mine' | 'kitchen' | 'peers'>('mine');
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [sessionDriver, setSessionDriver] = useState<Repartidor | null>(null);

  const refreshOrders = async () => {
    const pedidos = await pedidosService.getPedidos();
    setOrders(pedidos);
  };

  useEffect(() => {
    const load = async () => {
      const storedToken = localStorage.getItem('delivery_auth_token');
      if (!storedToken) {
        window.location.assign('/delivery/login');
        return;
      }

      const [drivers, pedidos] = await Promise.all([pedidosService.getRepartidores(), pedidosService.getPedidos()]);
      setRepartidores(drivers);
      setOrders(pedidos);

      const persisted = localStorage.getItem('delivery_driver_id');
      const activeDriver = drivers.find((driver) => driver.id === persisted) || drivers[0] || null;
      if (activeDriver) {
        setSelectedDriverId(activeDriver.id);
        setSessionDriver(activeDriver);
      }
    };

    void load();

    const channel = supabase
      .channel('pedidos_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        async () => {
          await refreshOrders();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const kitchenCount = useMemo(
    () => orders.filter((order) => order.estado === 'en_preparacion').length,
    [orders]
  );
  const assignedOrders = useMemo(
    () => orders.filter((order) => order.estado === 'en_camino' && (selectedDriverId ? order.repartidor_id === selectedDriverId : true)),
    [orders, selectedDriverId]
  );
  const availableOrders = useMemo(
    () => orders.filter(
      (order) => order.estado === 'pendiente' && !order.repartidor_id
    ),
    [orders]
  );
  const selectedDriver = sessionDriver || repartidores.find((driver) => driver.id === selectedDriverId) || null;

  useEffect(() => {
    if (selectedDriverId) {
      localStorage.setItem('delivery_driver_id', selectedDriverId);
    }
  }, [selectedDriverId]);

  const handleDelivery = async (order: Pedido) => {
    await pedidosService.updatePedido(order.id, { estado: 'completado' });
  };

  const handleUploadRepartidorAsset = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: 'foto_perfil' | 'foto_portada'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!selectedDriver) {
      toast.error('Seleccioná un repartidor antes de subir una imagen');
      return;
    }

    setIsUploadingAsset(true);
    try {
      const publicUrl = await uploadImage(file, `repartidores/${selectedDriver.id}/${field}`, 'repartidores_assets');
      if (!publicUrl) {
        toast.error('No se pudo subir la imagen. Intentá nuevamente.');
        return;
      }

      const updatedDriver = await pedidosService.updateRepartidor(selectedDriver.id, {
        [field]: publicUrl,
      });
      setRepartidores((prev) => prev.map((driver) => (driver.id === selectedDriver.id ? updatedDriver : driver)));
      toast.success('Imagen cargada y perfil actualizado ✅');
    } catch (error) {
      console.error('Error subiendo activo de repartidor:', error);
      toast.error('Error al subir la imagen del repartidor');
    } finally {
      setIsUploadingAsset(false);
      event.target.value = '';
    }
  };

  const handleTakeOrder = async (order: Pedido) => {
    if (!selectedDriverId) {
      toast.error('Seleccioná primero un repartidor');
      return;
    }

    await pedidosService.updatePedido(order.id, {
      repartidor_id: selectedDriverId,
      estado: 'en_camino',
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('delivery_auth_token');
    localStorage.removeItem('delivery_driver_id');
    window.location.assign('/delivery/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 p-4">
      <style>{`
        .kitchen-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #334155 #020617;
        }
        .kitchen-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .kitchen-scrollbar::-webkit-scrollbar-track {
          background: #020617;
          border-radius: 999px;
        }
        .kitchen-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 999px;
        }
        .kitchen-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 shadow-lg shadow-slate-950/50">
          {selectedDriver?.foto_portada ? (
            <div
              className="h-40 bg-cover bg-center"
              style={{ backgroundImage: `url(${selectedDriver.foto_portada})` }}
            />
          ) : (
            <div className="h-40 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-950" />
          )}
          <div className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-950">
                {selectedDriver?.foto_perfil ? (
                  <img
                    src={selectedDriver.foto_perfil}
                    alt={`${selectedDriver.nombre} perfil`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-800 text-3xl text-slate-400">
                    👤
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-400 font-semibold">Repartidor</p>
                <h1 className="mt-1 text-xl font-bold text-white">
                  Hola, {selectedDriver?.nombre || 'Repartidor'}
                </h1>
                <p className="text-sm text-slate-400">{selectedDriver?.telefono || 'Activo para recibir pedidos'}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <label className="group flex cursor-pointer items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-500">
                Foto de Perfil
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadRepartidorAsset(e, 'foto_perfil')}
                />
              </label>
              <label className="group flex cursor-pointer items-center justify-center rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-500">
                Foto de Portada
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => void handleUploadRepartidorAsset(e, 'foto_portada')}
                />
              </label>
            </div>
            {isUploadingAsset ? <p className="mt-3 text-sm text-slate-400">Subiendo imagen...</p> : null}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-rose-500 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
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
                    <div key={order.id} className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-950/90 shadow-lg transition hover:border-cyan-600 hover:shadow-cyan-500/20">
                      <div className="border-b border-slate-800 bg-slate-900/80 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Pedido</p>
                            <p className="text-sm font-semibold text-white">#{order.id?.slice(0, 8)}</p>
                          </div>
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">En camino</span>
                        </div>
                        <p className="mt-3 text-sm text-slate-300">{order.cliente_nombre}</p>
                        <p className="mt-1 text-sm font-semibold text-white">{order.cliente_direccion}</p>
                      </div>

                      <div className="border-b border-slate-800 bg-slate-950/75 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Productos</p>
                        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                          {order.items.map((product, itemIndex) => (
                            <div key={itemIndex} className="min-w-[170px] rounded-3xl border border-slate-800 bg-slate-900 p-3 shadow-sm">
                              <div className="h-20 w-full overflow-hidden rounded-2xl bg-slate-800">
                                <img
                                  src={(product as any).imagen_url || '/placeholder-food.png'}
                                  alt={product.nombre}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="mt-3 space-y-2 text-xs text-slate-300">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-white">{product.nombre}</span>
                                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-400">{product.cantidad}x</span>
                                </div>
                                <div className="text-right text-slate-400">{formatCurrency(product.precio * product.cantidad)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3 px-4 py-4">
                        <div className={`rounded-3xl px-4 py-3 text-sm ${order.metodo_pago === 'efectivo' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100' : 'bg-sky-500/10 border border-sky-500/20 text-sky-100'}`}>
                          <p className="font-semibold">{order.metodo_pago === 'efectivo' ? 'Cobro en efectivo' : 'Pago ya realizado'}</p>
                          <p className="text-slate-300">Total: {formatCurrency(order.total)}</p>
                          {order.metodo_pago === 'efectivo' ? (
                            <p className="text-slate-200">Vuelto: {formatCurrency(Math.max(0, Number(order.paga_con || '0') - order.total))}</p>
                          ) : (
                            <p className="text-slate-200">Transferencia / Mercado Pago</p>
                          )}
                        </div>

                        {order.notas ? (
                          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                            <p className="font-semibold text-amber-200">Observaciones</p>
                            <p className="mt-1 text-slate-100">{order.notas}</p>
                          </div>
                        ) : null}

                        <div className="grid gap-2">
                          <a
                            href={getMapsUrl(order.cliente_direccion)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-500 hover:bg-slate-700"
                          >
                            <MapPin className="h-4 w-4 text-cyan-400" />
                            GPS
                          </a>
                          {order.cliente_telefono ? (
                            <a
                              href={getWhatsAppUrl(order.cliente_telefono)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </a>
                          ) : null}
                          {order.cliente_telefono ? (
                            <a
                              href={`tel:${order.cliente_telefono}`}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                              <Phone className="h-4 w-4 text-slate-300" />
                              Llamar
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => { void handleDelivery(order); }}
                            className="inline-flex items-center justify-center rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-500"
                          >
                            ✅ Marcar Completado
                          </button>
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
              <div className="max-h-[70vh] overflow-y-auto pr-2 kitchen-scrollbar">
                <div className="space-y-3">
                  {orders.filter((o) => o.estado === 'en_preparacion').map((order) => (
                    <div key={order.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-[0_10px_30px_rgba(2,6,23,0.35)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-400">#{order.id?.slice(0, 8)}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{order.cliente_nombre}</p>
                          <p className="text-xs text-slate-400">{order.cliente_direccion || 'Retiro'}</p>
                        </div>
                        <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-semibold text-orange-300">Cocina</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {order.items?.length ? (
                          order.items.map((product, itemIndex) => (
                            <div key={`${order.id}-${itemIndex}`} className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/70 px-2 py-2">
                              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-800">
                                <img
                                  src={(product as any).imagen_url || '/placeholder-food.png'}
                                  alt={product.nombre}
                                  className="h-full w-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold text-white">{product.nombre}</p>
                                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">x{product.cantidad}</span>
                                </div>
                                {product.notas || (product as any).observaciones ? (
                                  <p className="mt-1 truncate text-xs text-amber-300">{(product as any).notas || (product as any).observaciones}</p>
                                ) : null}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-500">Sin productos cargados</p>
                        )}
                      </div>

                      {order.notas ? (
                        <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                          <p className="font-semibold text-amber-200">Notas del pedido</p>
                          <p className="mt-1 text-slate-200">{order.notas}</p>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
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
