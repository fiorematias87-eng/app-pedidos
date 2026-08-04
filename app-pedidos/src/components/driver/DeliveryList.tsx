import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import DeliveryCard from './DeliveryCard';

const DeliveryList: React.FC = () => {
    const deliveries = useSelector((state: RootState) => state.driver.deliveries);

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Mis Entregas</h2>
            <div className="grid grid-cols-1 gap-4">
                {deliveries.length > 0 ? (
                    deliveries.map(delivery => (
                        <DeliveryCard key={delivery.id} delivery={delivery} />
                    ))
                ) : (
                    <p>No hay entregas asignadas en este momento.</p>
                )}
            </div>
        </div>
    );
};

export default DeliveryList;