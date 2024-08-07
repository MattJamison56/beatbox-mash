import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import HomePage from './pages/managerPages/home/home';
import LoginPage from './pages/login/login';
import CreateAccountPage from './pages/managerPages/accountCreation/CreateAccountPage';
import SetPasswordPage from './pages/managerPages/accountCreation/SetPasswordPage';
import ManageAccountsPage from './pages/managerPages/accountCreation/ManageAccountsPage';
import AmbassadorHome from './pages/ambassadorPages/ambassadorHome/ambassadorHome';
import { AuthProvider, useAuth } from './auth/AuthContext';

interface PrivateRouteProps {
  children: JSX.Element;
  roles: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated || role === null || !roles.includes(role)) {
      navigate('/login');
    }
  }, [isAuthenticated, role, roles, navigate]);

  if (!isAuthenticated || role === null || !roles.includes(role)) {
    return null;
  }

  return children;
};

const RoleBasedHome: React.FC = () => {
  const { role } = useAuth();
  return role === 'manager' ? <Navigate to="/manager" /> : <Navigate to="/ambassadors" />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute roles={['manager', 'ambassador']}>
            <RoleBasedHome />
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
      <Route
        path="/ambassadors"
        element={
          // <PrivateRoute roles={['ambassador']}>
            <AmbassadorHome />
          // </PrivateRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <PrivateRoute roles={['manager']}>
            <HomePage />
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
