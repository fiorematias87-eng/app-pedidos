import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import ClientApp from './pages/ClientApp';
import AdminControlCenter from './pages/AdminControlCenter';
import DriverApp from './pages/DriverApp';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path="/admin" component={AdminControlCenter} />
        <Route path="/driver" component={DriverApp} />
        <Route path="/" component={ClientApp} />
      </Switch>
    </Router>
  );
};

export default App;