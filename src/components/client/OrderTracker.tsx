import React from 'react';

const OrderTracker: React.FC = () => {
    const [orderStatus, setOrderStatus] = React.useState<string>('Pending');
    const [progress, setProgress] = React.useState<number>(0);

    React.useEffect(() => {
        // Simulate order tracking updates
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev < 100) {
                    return prev + 20; // Increment progress
                } else {
                    clearInterval(interval);
                    setOrderStatus('Delivered');
                    return prev;
                }
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="order-tracker">
            <h2>Order Tracker</h2>
            <div className="progress-bar">
                <div
                    className="progress"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <p>Status: {orderStatus}</p>
        </div>
    );
};

export default OrderTracker;