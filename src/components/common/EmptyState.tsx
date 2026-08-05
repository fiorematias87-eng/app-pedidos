import React from 'react';

export default function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
      <p className="font-semibold text-slate-200">{title}</p>
      <p className="mt-2">{description}</p>
    </div>
  );
}
