import React from 'react';
import { useDispatch } from 'react-redux';
import { updateDeliveryStatus } from '../../store/slices/driverSlice';
import { Pedido } from '../../types/delivery';
import NavigationButton from './NavigationButton';

interface DeliveryCardProps {
  delivery: Pedido;
}

const DeliveryCard: React.FC<DeliveryCardProps> = ({ delivery }) => {
  const dispatch = useDispatch();

  const handleDeliveryConfirmation = () => {
    // Logic to confirm delivery
    dispatch(updateDeliveryStatus(delivery.id, 'delivered'));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold">{delivery.productName}</h3>
      <p className="text-gray-600">Cliente: {delivery.clientName}</p>
      <p className="text-gray-600">Dirección: {delivery.address}</p>
      <p className="text-gray-600">Estado: {delivery.status}</p>
      <NavigationButton location={delivery.address} />
      <button
        onClick={handleDeliveryConfirmation}
        className="mt-4 bg-blue-500 text-white py-2 px-4 rounded"
      >
        Confirmar Entrega
      </button>
    </div>
  );
};

export default DeliveryCard;