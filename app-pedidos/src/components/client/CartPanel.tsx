import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import Button from '../common/Button';

const CartPanel: React.FC = () => {
    const cartItems = useSelector((state: RootState) => state.client.cartItems);
    const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Tu Carrito</h2>
            {cartItems.length === 0 ? (
                <p className="text-gray-500">No hay productos en el carrito.</p>
            ) : (
                <ul className="space-y-2">
                    {cartItems.map((item) => (
                        <li key={item.id} className="flex justify-between items-center">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-4 flex justify-between items-center">
                <span className="font-bold">Total:</span>
                <span className="font-bold">${totalAmount.toFixed(2)}</span>
            </div>
            <Button className="mt-4 w-full" onClick={() => {/* Handle checkout */}}>
                Proceder al Pago
            </Button>
        </div>
    );
};

export default CartPanel;