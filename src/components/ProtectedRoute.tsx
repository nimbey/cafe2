import React from 'react';
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role !== userRole) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}