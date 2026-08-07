import React from 'react';
import { Navigate, Route, Routes as RouterRoutes } from 'react-router-dom';
import HomeCliente from '../pages/HomeCliente';
import AdminPanel from '../pages/AdminPanel';
import DeliveryPanel from '../pages/DeliveryPanel';
import DeliveryLoginPage from '../pages/DeliveryLoginPage';
import PedidoTrackingPage from '../pages/PedidoTrackingPage';

function ProtectedDeliveryRoute() {
  const hasToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('delivery_auth_token'));
  return hasToken ? <DeliveryPanel /> : <Navigate to="/delivery/login" replace />;
}

export default function AppRoutes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<HomeCliente />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/delivery/login" element={<DeliveryLoginPage />} />
      <Route path="/delivery" element={<ProtectedDeliveryRoute />} />
      <Route path="/pedido/:id" element={<PedidoTrackingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}