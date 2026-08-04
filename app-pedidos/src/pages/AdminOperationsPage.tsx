import React from 'react';
import SwipeContainer from '../components/admin/SwipeContainer';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';

const AdminOperationsPage: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <h1 className="text-2xl font-bold mb-4">Admin Operations</h1>
            <SwipeContainer />
            <AnalyticsPanel />
        </div>
    );
};

export default AdminOperationsPage;