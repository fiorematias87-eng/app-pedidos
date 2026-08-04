import React from 'react';
import CatalogView from '../components/client/CatalogView';
import CartPanel from '../components/client/CartPanel';
import LiveTrackerPanel from '../components/client/LiveTrackerPanel';

const ClientExperiencePage: React.FC = () => {
    return (
        <div className="flex flex-col h-screen">
            <CatalogView />
            <CartPanel />
            <LiveTrackerPanel />
        </div>
    );
};

export default ClientExperiencePage;