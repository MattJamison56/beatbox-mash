import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import HomePage from './pages/home/home';
import LoginPage from './pages/login/login';
import CreateAccountPage from './pages/accountCreation/CreateAccountPage';
import SetPasswordPage from './pages/accountCreation/SetPasswordPage';
import ManageAccountsPage from './pages/accountCreation/ManageAccountsPage';
import { AuthProvider, useAuth } from './auth/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
  roles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated || role === null || !roles.includes(role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute roles={['manager']}>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/create-account"
        element={
          <PrivateRoute roles={['manager']}>
            <CreateAccountPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/set-password/:token"
        element={<SetPasswordPage />}
      />
      <Route
        path="/manage-accounts"
        element={
          <PrivateRoute roles={['manager']}>
            <ManageAccountsPage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
};

const RootApp: React.FC = () => (
  <AuthProvider>
    <Router>
      <App />
    </Router>
  </AuthProvider>
);

export default RootApp;
