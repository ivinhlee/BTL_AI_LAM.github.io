import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function isAdminUser(user) {
  if (!user) return false;
  return user.is_admin === true || Number(user.is_admin) === 1;
}

export default function ProtectedRoute({ children, adminOnly = false }) {
  const location = useLocation();
  const { user, token } = useAuth();

  const storedToken = localStorage.getItem("token");
  const storedUserRaw = localStorage.getItem("user");

  let storedUser = null;
  if (storedUserRaw) {
    try {
      storedUser = JSON.parse(storedUserRaw);
    } catch {
      storedUser = null;
    }
  }

  const effectiveToken = token || storedToken;
  const effectiveUser = user || storedUser;

  if (!effectiveToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdminUser(effectiveUser)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
