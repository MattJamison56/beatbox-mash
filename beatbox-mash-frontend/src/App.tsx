import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/home/home';
import LoginPage from './pages/login/login';

const App: React.FC = () => {

  return (
    <div>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  );
};

const RootApp: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default RootApp;
