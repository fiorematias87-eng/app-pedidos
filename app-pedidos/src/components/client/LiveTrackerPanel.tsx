import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { OrderStatus } from '../../types/delivery';

const LiveTrackerPanel: React.FC = () => {
    const order = useSelector((state: RootState) => state.client.currentOrder);

    if (!order) {
        return <div>No order found.</div>;
    }

    const getStatusLabel = (status: OrderStatus) => {
        switch (status) {
            case 'pending':
                return 'Pendiente';
            case 'preparing':
                return 'Preparando';
            case 'on_the_way':
                return 'En Camino';
            case 'delivered':
                return 'Entregado';
            default:
                return 'Estado desconocido';
        }
    };

    return (
        <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Seguimiento de Pedido</h2>
            <div className="flex items-center justify-between mb-4">
                <span className="text-lg">Estado: {getStatusLabel(order.status)}</span>
                <span className="text-lg">{order.estimatedDeliveryTime} min</span>
            </div>
            <div className="relative">
                <div className="absolute inset-0 bg-gray-700 h-1 rounded-full"></div>
                <div
                    className={`absolute h-1 rounded-full bg-green-500`}
                    style={{ width: `${(order.statusIndex + 1) * 25}%` }}
                ></div>
            </div>
            <div className="flex justify-between mt-2">
                <span>Pendiente</span>
                <span>Preparando</span>
                <span>En Camino</span>
                <span>Entregado</span>
            </div>
        </div>
    );
};

export default LiveTrackerPanel;