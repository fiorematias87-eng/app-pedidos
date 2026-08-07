import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { pedidosService } from '../services/pedidos.service';

export default function DeliveryLoginPage() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!usuario.trim() || !pin.trim()) {
      toast.error('Ingresá tu usuario y PIN');
      return;
    }

    setLoading(true);
    try {
      const repartidor = await pedidosService.loginRepartidor(usuario, pin);
      if (!repartidor) {
        toast.error('Credenciales inválidas');
        return;
      }

      localStorage.setItem('delivery_auth_token', `${repartidor.id}:${repartidor.usuario || usuario}`);
      localStorage.setItem('delivery_driver_id', repartidor.id);
      toast.success(`Bienvenido, ${repartidor.nombre}`);
      navigate('/delivery', { replace: true });
    } catch (error) {
      console.error('Error de login de repartidor:', error);
      toast.error('No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] px-4 py-10 text-slate-100">
      <div className="mx-auto flex max-w-md flex-col rounded-[32px] border border-slate-800 bg-slate-900/85 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.55)]">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">Delivery</p>
            <h1 className="text-xl font-semibold text-white">Ingresá a tu panel</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="mb-2 block text-sm text-slate-400">Usuario</span>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none"
              placeholder="usuario"
              autoComplete="username"
            />
          </label>

          <label className="block rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
            <span className="mb-2 block text-sm text-slate-400">PIN</span>
            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-3">
              <Lock className="h-4 w-4 text-slate-500" />
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-transparent text-sm text-white outline-none"
                placeholder="4 a 6 dígitos"
                inputMode="numeric"
                autoComplete="current-password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
