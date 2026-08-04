import React from 'react';

export default function HomeCliente() {
  const handleGps = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          window.open(`https://maps.google.com/?q=${latitude},${longitude}`, '_blank');
        },
        () => {
          alert('No se pudo obtener la ubicación GPS');
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Cliente</h1>
          <p className="text-sm text-slate-400">Experience Hub</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Catálogo</h2>
            <p className="mt-2 text-sm text-slate-400">
              Búsqueda, categorías, combos y filtros de alérgenos.
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Carrito</h2>
            <p className="mt-2 text-sm text-slate-400">
              Subtotal, envío e impuestos en tiempo real.
            </p>
            <button
              onClick={handleGps}
              className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white"
            >
              Capturar ubicación GPS
            </button>
          </aside>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">Live Tracker</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Pendiente', 'Preparando', 'En Camino', 'Entregado'].map((step) => (
              <span
                key={step}
                className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300"
              >
                {step}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
