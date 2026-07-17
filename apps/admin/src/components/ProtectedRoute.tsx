import { Navigate, Outlet } from "react-router-dom";
import { isAdminAuthenticated } from "../lib/api";

export function ProtectedRoute() {
  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
