import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ClientApp from '../pages/ClientApp';
import AdminControlCenter from '../pages/AdminControlCenter';
import DriverApp from '../pages/DriverApp';

const Routes: React.FC = () => {
    return (
        <Router>
            <Switch>
                <Route path="/admin" component={AdminControlCenter} />
                <Route path="/client" component={ClientApp} />
                <Route path="/driver" component={DriverApp} />
                <Route path="/" exact>
                    <h1>Welcome to the Delivery Ecosystem</h1>
                </Route>
            </Switch>
        </Router>
    );
};

export default Routes;