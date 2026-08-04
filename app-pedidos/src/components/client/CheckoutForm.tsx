import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useGeolocation } from '../../hooks/useGeolocation';
import { addOrder } from '../../store/slices/clientSlice';
import Button from '../common/Button';

const CheckoutForm: React.FC = () => {
    const dispatch = useDispatch();
    const { location, error } = useGeolocation();
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('credit');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (location) {
            const orderData = {
                name: customerName,
                address: customerAddress,
                paymentMethod,
                location,
            };
            dispatch(addOrder(orderData));
            // Reset form fields
            setCustomerName('');
            setCustomerAddress('');
            setPaymentMethod('credit');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md">
            <h2 className="text-lg font-semibold mb-4">Checkout</h2>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="border rounded w-full p-2"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    required
                    className="border rounded w-full p-2"
                />
            </div>
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="border rounded w-full p-2"
                >
                    <option value="credit">Credit Card</option>
                    <option value="paypal">PayPal</option>
                    <option value="cash">Cash</option>
                </select>
            </div>
            {error && <p className="text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Place Order</Button>
        </form>
    );
};

export default CheckoutForm;