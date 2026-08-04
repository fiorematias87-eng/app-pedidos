import React from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import HomeCliente from './pages/HomeCliente';
import AdminPanel from './pages/AdminPanel';
import DeliveryPanel from './pages/DeliveryPanel';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl gap-3 px-6 py-3">
          <NavLink to="/" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-600' : 'bg-slate-800'}`}>
            Cliente
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-600' : 'bg-slate-800'}`}>
            Admin
          </NavLink>
          <NavLink to="/delivery" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-sky-600' : 'bg-slate-800'}`}>
            Delivery
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomeCliente />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/delivery" element={<DeliveryPanel />} />
      </Routes>
    </BrowserRouter>
  );
}
