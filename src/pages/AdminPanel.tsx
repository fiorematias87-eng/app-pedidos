import React, { useState } from 'react';

export default function AdminPanel() {
  const [tab, setTab] = useState<'catalogo' | 'kds'>('catalogo');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold">Admin / Comandas</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('catalogo')}
              className={`rounded-lg px-3 py-2 text-sm ${tab === 'catalogo' ? 'bg-sky-600' : 'bg-slate-800'}`}
            >
              Gestión de menú
            </button>
            <button
              onClick={() => setTab('kds')}
              className={`rounded-lg px-3 py-2 text-sm ${tab === 'kds' ? 'bg-sky-600' : 'bg-slate-800'}`}
            >
              KDS / Monitor
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {tab === 'catalogo' ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Gestión de productos</h2>
            <p className="mt-2 text-sm text-slate-400">
              Ajusta stock, precios y categorías desde el panel de administración.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Tablero KDS</h2>
            <p className="mt-2 text-sm text-slate-400">
              Pedidos en estado pendiente, alertas visuales y auditorías operativas.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
