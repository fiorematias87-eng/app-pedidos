import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchOrders } from '../../store/slices/adminSlice';
import OrderCard from './OrderCard';
import { Order } from '../../types/delivery';

const KdsBoard: React.FC = () => {
    const dispatch = useDispatch();
    const orders = useSelector((state: any) => state.admin.orders);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadOrders = async () => {
            await dispatch(fetchOrders());
            setLoading(false);
        };
        loadOrders();
    }, [dispatch]);

    if (loading) {
        return <div className="spinner">Loading...</div>;
    }

    return (
        <div className="kds-board">
            <h2 className="text-xl font-bold">Kitchen Display System</h2>
            <div className="grid grid-cols-3 gap-4">
                {orders.map((order: Order) => (
                    <OrderCard key={order.id} order={order} />
                ))}
            </div>
        </div>
    );
};

export default KdsBoard;