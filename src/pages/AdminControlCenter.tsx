import React from 'react';
import DashboardPanel from '../components/admin/DashboardPanel';
import FleetMonitor from '../components/admin/FleetMonitor';

const AdminControlCenter: React.FC = () => {
    return (
        <div className="admin-control-center">
            <h1>Admin Control Center</h1>
            <DashboardPanel />
            <FleetMonitor />
        </div>
    );
};

export default AdminControlCenter;