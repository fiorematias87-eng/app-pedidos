import React, { useState } from 'react';
import { Plus, Truck, ChevronDown, Loader2 } from 'lucide-react';
import type { Repartidor } from '../../types/delivery';
import { toast } from 'sonner';

type DriverManagerProps = {
  repartidores: Repartidor[];
  orders: any[];
  onAddDriver: (driver: Omit<Repartidor, 'id'>) => Promise<void>;
  onEditDriver: (id: string, updates: Partial<Repartidor>) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
};

export default function DriverManager({
  repartidores,
  orders,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}: DriverManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newDriver, setNewDriver] = useState({ nombre: '', telefono: '', estado: 'disponible' as Repartidor['estado'] });
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [editingDriver, setEditingDriver] = useState<Partial<Repartidor>>({});
  const [loading, setLoading] = useState(false);

  const handleAddDriver = async () => {
    if (!newDriver.nombre.trim()) {
      toast.error('Ingresa el nombre del repartidor');
      return;
    }
    setLoading(true);
    try {
      await onAddDriver(newDriver);
      setNewDriver({ nombre: '', telefono: '', estado: 'disponible' });
      setShowForm(false);
      toast.success('Repartidor agregado');
    } catch (error) {
      toast.error('Error al agregar repartidor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDriver = async (id: string) => {
    setLoading(true);
    try {
      await onEditDriver(id, editingDriver);
      setEditingDriverId(null);
      setEditingDriver({});
      toast.success('Repartidor actualizado');
    } catch (error) {
      toast.error('Error al actualizar repartidor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('¿Eliminar este repartidor?')) return;
    setLoading(true);
    try {
      await onDeleteDriver(id);
      toast.success('Repartidor eliminado');
    } catch (error) {
      toast.error('Error al eliminar repartidor');
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas por repartidor
  const getDriverMetrics = (driverId: string) => {
    const assigned = orders.filter((o) => o.repartidor_id === driverId && o.estado === 'en_camino').length;
    const delivered = orders.filter((o) => o.repartidor_id === driverId && o.estado === 'entregado').length;
    return { assigned, delivered };
  };

  // Determinar si el driver está activo (tiene asignaciones)
  const isDriverActive = (driverId: string) => {
    return orders.some((o) => o.repartidor_id === driverId && o.estado === 'en_camino');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">🛵 Repartidores Activos</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500"
        >
          <Plus className="h-3 w-3" /> Nuevo
        </button>
      </div>

      {/* Formulario de nuevo repartidor (compacto) */}
      {showForm && (
        <div className="mb-4 space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
          <input
            type="text"
            value={newDriver.nombre}
            onChange={(e) => setNewDriver({ ...newDriver, nombre: e.target.value })}
            placeholder="Nombre del repartidor"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none"
          />
          <input
            type="tel"
            value={newDriver.telefono}
            onChange={(e) => setNewDriver({ ...newDriver, telefono: e.target.value })}
            placeholder="Teléfono"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none"
          />
          <select
            value={newDriver.estado}
            onChange={(e) => setNewDriver({ ...newDriver, estado: e.target.value as Repartidor['estado'] })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs outline-none"
          >
            <option value="disponible">Disponible</option>
            <option value="ocupado">Ocupado</option>
            <option value="inactivo">Inactivo</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => void handleAddDriver()}
              disabled={loading}
              className="flex-1 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : 'Agregar'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Grid de repartidores como chips */}
      <div className="flex flex-wrap gap-2">
        {repartidores.length === 0 ? (
          <div className="w-full text-center text-xs text-slate-500">Sin repartidores</div>
        ) : (
          repartidores.map((driver) => {
            const metrics = getDriverMetrics(driver.id);
            const active = isDriverActive(driver.id);

            return (
              <div key={driver.id} className="relative">
                {editingDriverId === driver.id ? (
                  <div className="absolute -top-1 left-0 right-0 z-10 rounded-lg border border-slate-700 bg-slate-900 p-2 shadow-lg">
                    <input
                      type="text"
                      value={editingDriver.nombre || ''}
                      onChange={(e) => setEditingDriver({ ...editingDriver, nombre: e.target.value })}
                      className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none"
                    />
                    <input
                      type="tel"
                      value={editingDriver.telefono || ''}
                      onChange={(e) => setEditingDriver({ ...editingDriver, telefono: e.target.value })}
                      className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none"
                    />
                    <select
                      value={editingDriver.estado || 'disponible'}
                      onChange={(e) => setEditingDriver({ ...editingDriver, estado: e.target.value as Repartidor['estado'] })}
                      className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="ocupado">Ocupado</option>
                      <option value="inactivo">Inactivo</option>
                    </select>
                    <div className="flex gap-1">
                      <button
                        onClick={() => void handleUpdateDriver(driver.id)}
                        disabled={loading}
                        className="flex-1 rounded-lg bg-amber-400 px-2 py-1 text-xs font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="inline h-2 w-2 animate-spin" /> : 'Guardar'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingDriverId(null);
                          setEditingDriver({});
                        }}
                        className="flex-1 rounded-lg border border-slate-700 px-2 py-1 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingDriverId(driver.id);
                      setEditingDriver(driver);
                    }}
                    className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? 'border-cyan-600 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                        : driver.estado === 'inactivo'
                          ? 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                          : 'border-amber-600 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    <span>🛵 {driver.nombre}</span>
                    <span className="text-[10px] text-slate-500">
                      🛣️ {metrics.assigned} | ✅ {metrics.delivered}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                )}

                {/* Menú de acciones (small dropdown) */}
                {editingDriverId !== driver.id && (
                  <div className="absolute right-0 top-full z-10 mt-1 hidden rounded-lg border border-slate-700 bg-slate-900 shadow-lg group-hover:block">
                    <button
                      onClick={() => void handleDeleteDriver(driver.id)}
                      className="w-full px-3 py-2 text-left text-xs text-rose-300 hover:bg-slate-800"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
