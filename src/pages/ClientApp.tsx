import React from 'react';
import MenuCatalog from '../components/client/MenuCatalog';
import OrderTracker from '../components/client/OrderTracker';

const ClientApp: React.FC = () => {
    return (
        <div>
            <h1>Client Application</h1>
            <MenuCatalog />
            <OrderTracker />
        </div>
    );
};

export default ClientApp;