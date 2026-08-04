import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ClientExperiencePage from '../pages/ClientExperiencePage';
import AdminOperationsPage from '../pages/AdminOperationsPage';
import DriverDashboardPage from '../pages/DriverDashboardPage';

const Routes = () => {
    return (
        <Router>
            <Switch>
                <Route path="/" exact component={ClientExperiencePage} />
                <Route path="/admin" component={AdminOperationsPage} />
                <Route path="/delivery" component={DriverDashboardPage} />
            </Switch>
        </Router>
    );
};

export default Routes;