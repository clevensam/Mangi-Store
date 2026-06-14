import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AuthContainer } from './pages/auth/AuthContainer';
import { AppLayout } from './layouts/AppLayout';

function MainRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthContainer mode="login" />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthContainer mode="register" />
      } />
      <Route path="/*" element={
        user ? <AppLayout /> : <Navigate to="/login" state={{ from: location }} replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  );
}
