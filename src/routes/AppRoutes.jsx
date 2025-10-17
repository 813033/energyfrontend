//處理各頁面對應的路徑以及身份對應頁面
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import AdminPage from '../pages/AdminPage';
import Login from '../Login';
import ContractSetting from '../pages/ContractSetting';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRoutes() {
  const role = localStorage.getItem('role');

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<ProtectedRoute role={role}><Dashboard /></ProtectedRoute>} />
      <Route path="/schedule-result" element={<ProtectedRoute role={role}><Monitor /></ProtectedRoute>} />
      {/* <Route path="/contract-setting" element={
        <ProtectedRoute role={role} allowedRole="ADMIN">
          <ContractSetting />
        </ProtectedRoute>
      } /> */}
      <Route path="/admin" element={
        <ProtectedRoute role={role} allowedRole="ADMIN">
          <AdminPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
