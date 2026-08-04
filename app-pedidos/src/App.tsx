import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ClientExperiencePage from './pages/ClientExperiencePage';
import AdminOperationsPage from './pages/AdminOperationsPage';
import DriverDashboardPage from './pages/DriverDashboardPage';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ClientExperiencePage />} />
        <Route path="/admin" element={<AdminOperationsPage />} />
        <Route path="/delivery" element={<DriverDashboardPage />} />
      </Routes>
    </Router>
  );
};

export default App;