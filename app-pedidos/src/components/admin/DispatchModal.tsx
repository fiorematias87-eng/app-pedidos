import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { useDispatch } from 'react-redux';
import { assignDriver } from '../../store/slices/adminSlice';

const DispatchModal = ({ isOpen, onClose, order }) => {
    const [driverId, setDriverId] = useState('');
    const dispatch = useDispatch();

    const handleAssignDriver = () => {
        if (driverId) {
            dispatch(assignDriver({ orderId: order.id, driverId }));
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <h2 className="text-lg font-semibold">Asignar Repartidor</h2>
            <div className="mt-4">
                <label htmlFor="driverId" className="block text-sm font-medium text-gray-700">
                    ID del Repartidor
                </label>
                <input
                    type="text"
                    id="driverId"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                />
            </div>
            <div className="mt-6 flex justify-end">
                <Button onClick={onClose} className="mr-2">
                    Cancelar
                </Button>
                <Button onClick={handleAssignDriver} disabled={!driverId}>
                    Asignar
                </Button>
            </div>
        </Modal>
    );
};

export default DispatchModal;