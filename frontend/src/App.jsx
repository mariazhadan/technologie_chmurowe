import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

import Login from './pages/Login';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Warehouses from './pages/Warehouses';
import Shipments from './pages/Shipments';
import Vehicles from './pages/Vehicles';

function App() {
  return (
    <AuthProvider>
      <div className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/warehouses" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <Warehouses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/shipments" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <Shipments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vehicles" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <Vehicles />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
