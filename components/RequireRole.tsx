import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../src/services/authService';

interface RequireRoleProps {
  allowed: UserRole[];
  children: React.ReactElement;
}

const RequireRole: React.FC<RequireRoleProps> = ({ allowed, children }) => {
  const { loading, isAuthenticated, role, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  if (!hasRole(allowed)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RequireRole;
