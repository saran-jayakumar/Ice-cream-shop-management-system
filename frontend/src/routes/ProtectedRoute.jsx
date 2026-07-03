import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getCurrentUser();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect authorized user to their correct dashboard
    switch (user.role) {
      case 'OWNER':
        return <Navigate to="/owner-dashboard" replace />;
      case 'ASSISTANT_MANAGER':
        return <Navigate to="/manager-dashboard" replace />;
      case 'CASHIER':
        return <Navigate to="/cashier-dashboard" replace />;
      case 'SERVER':
        return <Navigate to="/server-dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
