import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card } from '../common/Card';

const AnalyticsPanel: React.FC = () => {
    const totalSales = useSelector((state: RootState) => state.admin.totalSales);
    const averageCookingTime = useSelector((state: RootState) => state.admin.averageCookingTime);
    const activeOrders = useSelector((state: RootState) => state.admin.activeOrders);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Panel de Analíticas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card title="Ventas Totales" value={`$${totalSales}`} />
                <Card title="Tiempo Promedio de Cocina" value={`${averageCookingTime} min`} />
                <Card title="Pedidos Activos" value={activeOrders.toString()} />
            </div>
        </div>
    );
};

export default AnalyticsPanel;