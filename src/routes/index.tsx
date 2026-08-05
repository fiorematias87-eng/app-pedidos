import React from 'react';
import { Navigate, Route, Routes as RouterRoutes } from 'react-router-dom';
import HomeCliente from '../pages/HomeCliente';
import AdminPanel from '../pages/AdminPanel';
import DeliveryPanel from '../pages/DeliveryPanel';
import PedidoTrackingPage from '../pages/PedidoTrackingPage';

export default function AppRoutes() {
  return (
    <RouterRoutes>
      <Route path="/" element={<HomeCliente />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/delivery" element={<DeliveryPanel />} />
      <Route path="/pedido/:id" element={<PedidoTrackingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </RouterRoutes>
  );
}