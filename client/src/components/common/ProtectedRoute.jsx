// Implements: REQ-1 — see SRS Section 4.1 (Role-Based Access Control)

import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated, getRole } from '../../services/auth';

function ProtectedRoute({ allowedRoles }) {
  if (!isAuthenticated()) return <Navigate to="/staff-login" replace />;
  if (!allowedRoles.includes(getRole())) return <Navigate to="/staff-login" replace />;
  return <Outlet />;
}

export default ProtectedRoute;
