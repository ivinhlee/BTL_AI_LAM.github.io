import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type StoredUser = {
  is_admin?: number | boolean;
};

function isAdminUser(user: StoredUser | null | undefined): boolean {
  if (!user) return false;
  return user.is_admin === true || Number(user.is_admin) === 1;
}

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const location = useLocation();
  const { user, token } = useAuth();

  const storedToken = localStorage.getItem('token');
  const storedUserRaw = localStorage.getItem('user');

  let storedUser: StoredUser | null = null;
  if (storedUserRaw) {
    try {
      storedUser = JSON.parse(storedUserRaw) as StoredUser;
    } catch {
      storedUser = null;
    }
  }

  const effectiveToken = token || storedToken;
  const effectiveUser = (user as StoredUser | null) || storedUser;

  if (!effectiveToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdminUser(effectiveUser)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
