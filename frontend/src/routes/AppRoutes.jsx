import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import OwnerDashboard from '../pages/OwnerDashboard';
import ManagerDashboard from '../pages/ManagerDashboard';
import CashierDashboard from '../pages/CashierDashboard';
import ServerDashboard from '../pages/ServerDashboard';
import ProtectedRoute from './ProtectedRoute';
import { authService } from '../services/authService';

const DefaultRedirect = () => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/create-account" replace />;
  }
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
      return <Navigate to="/create-account" replace />;
  }
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/create-account" element={<Signup />} />
      
      <Route 
        path="/owner-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['OWNER']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/manager-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['ASSISTANT_MANAGER']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/cashier-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['CASHIER']}>
            <CashierDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/server-dashboard" 
        element={
          <ProtectedRoute allowedRoles={['SERVER']}>
            <ServerDashboard />
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
