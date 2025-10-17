import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role, allowedRole }) {
  const resolvedRole = role ?? localStorage.getItem('role'); 

  if (!resolvedRole) return <Navigate to="/login" />;
  if (allowedRole && resolvedRole !== allowedRole) return <Navigate to="/unauthorized" />;
<Route
  path="/admin"
  element={
    <ProtectedRoute role={role} allowedRole="ADMIN">
      <AdminPage />
    </ProtectedRoute>
  }
/>
  return children;
}