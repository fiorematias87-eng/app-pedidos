import React from 'react';
import type { Pedido, TiendaConfig } from '../../types/delivery';

type TicketComandaProps = {
  order: Pedido;
  config: TiendaConfig | null;
};

export default function TicketComanda({ order, config }: TicketComandaProps) {
  const createdAt = new Date(order.created_at);
  const formattedTime = createdAt.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="ticket-print">
      <div className="ticket-header">
        <div className="ticket-title">{config?.nombre || 'Local de Pedidos'}</div>
        <div className="ticket-subtitle">COMANDA DE COCINA</div>
        <div className="ticket-meta">Pedido #{order.id?.slice(0, 8)} · {formattedTime}</div>
      </div>

      <div className="ticket-section">
        <div className="ticket-section-title">Cliente</div>
        <div className="ticket-row"><span>Nombre:</span><span>{order.cliente_nombre || 'Cliente General'}</span></div>
        <div className="ticket-row"><span>Teléfono:</span><span>{order.cliente_telefono || 'Sin teléfono'}</span></div>
        <div className="ticket-row"><span>Dirección:</span><span>{order.cliente_direccion || 'Retira en local'}</span></div>
      </div>

      <div className="ticket-divider" />

      <div className="ticket-section">
        <div className="ticket-section-title">Productos</div>
        <div className="ticket-products">
          {order.items.map((item, index) => (
            <div key={index} className="ticket-product-row">
              <span className="ticket-product-qty">{item.cantidad}x</span>
              <span className="ticket-product-name">{item.nombre}</span>
              <span className="ticket-product-total">${item.precio * item.cantidad}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="ticket-divider" />

      {order.notas ? (
        <div className="ticket-section">
          <div className="ticket-section-title">Notas</div>
          <div className="ticket-notes">{order.notas}</div>
        </div>
      ) : null}

      <div className="ticket-divider" />

      <div className="ticket-footer">
        <div className="ticket-row"><span>Método de pago:</span><span>{order.metodo_pago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</span></div>
        <div className="ticket-row ticket-total"><span>Total:</span><span>${order.total}</span></div>
      </div>
    </div>
  );
}
