import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deliveryDetails: {
    customerName: string;
    address: string;
    notes: string;
  };
}

const DeliveryModal: React.FC<DeliveryModalProps> = ({ isOpen, onClose, onConfirm, deliveryDetails }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <h2 className="text-lg font-semibold">Confirm Delivery</h2>
        <div className="mt-4">
          <p><strong>Customer:</strong> {deliveryDetails.customerName}</p>
          <p><strong>Address:</strong> {deliveryDetails.address}</p>
          <p><strong>Notes:</strong> {deliveryDetails.notes}</p>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} className="mr-2">Cancel</Button>
          <Button onClick={onConfirm} className="bg-green-500 text-white">Confirm Delivery</Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeliveryModal;