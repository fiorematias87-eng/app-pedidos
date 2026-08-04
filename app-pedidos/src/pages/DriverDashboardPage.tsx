import React from 'react';
import DeliveryList from '../components/driver/DeliveryList';

const DriverDashboardPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full p-4 bg-gray-900 text-white">
            <h1 className="text-2xl font-bold mb-4">Dashboard del Repartidor</h1>
            <DeliveryList />
        </div>
    );
};

export default DriverDashboardPage;