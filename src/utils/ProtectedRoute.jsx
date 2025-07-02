import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ component: Component }) => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user.role?.toLowerCase() || '';

  // Jika belum login, redirect ke halaman login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Cek role untuk halaman khusus
  const path = window.location.pathname;
  
  // Jika mencoba mengakses dashboard admin tapi bukan admin
  if (path === '/dashboardAdmin' && userRole !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika mencoba mengakses dashboard observer tapi bukan observer
  if (path === '/dashboardObserver' && userRole !== 'observer' && userRole !== 'pengamat') {
    return <Navigate to="/dashboard" replace />;
  }

  // Jika semua pengecekan berhasil, render komponen
  return <Component />;
};

export default ProtectedRoute;
