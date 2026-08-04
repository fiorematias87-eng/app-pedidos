import React, { useEffect, useState } from 'react';

interface DeliveryUpdate {
  orderId: string;
  status: string;
  estimatedDeliveryTime: string;
}

const DeliveryUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<DeliveryUpdate[]>([]);

  useEffect(() => {
    const fetchUpdates = async () => {
      // Simulate fetching delivery updates from an API
      const response = await fetch('/api/delivery-updates');
      const data = await response.json();
      setUpdates(data);
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 5000); // Fetch updates every 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="delivery-updates">
      <h2>Delivery Updates</h2>
      <ul>
        {updates.map((update) => (
          <li key={update.orderId}>
            <strong>Order ID:</strong> {update.orderId} - <strong>Status:</strong> {update.status} - <strong>Estimated Delivery:</strong> {update.estimatedDeliveryTime}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeliveryUpdates;