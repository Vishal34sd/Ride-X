import React from "react";
import { Navigate } from "react-router-dom";
import { getAccessToken } from "../helper/Token";

export default function ProtectedRoute({ children, requiredRole }) {
  const token = getAccessToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const role = localStorage.getItem("role");
    if (role !== requiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
