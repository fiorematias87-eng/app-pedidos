import React from 'react';
import DeliveryUpdates from '../components/driver/DeliveryUpdates';
import RouteNavigator from '../components/driver/RouteNavigator';

const DriverApp: React.FC = () => {
    return (
        <div>
            <h1>Driver Application</h1>
            <DeliveryUpdates />
            <RouteNavigator />
        </div>
    );
};

export default DriverApp;