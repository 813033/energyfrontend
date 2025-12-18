import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import AdminPage from '../pages/AdminPage';
import Login from '../pages/Login';
import Monitor from '../pages/Monitor';
import ScheduleResult from '../pages/ScheduleResult';
import DataAnalysis from '../pages/DataAnalysis';
import SimulationPage from '../components/SimulationPage'; // [新增] 引入頁面
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRoutes() {
  const role = localStorage.getItem('role');

  return (
    <Routes>
      {/* ... (其他路由保持不變) ... */}

      {/* [刪除] 不需要這個單獨的路由了 */}
      {/* <Route path="/simulation" element={...} /> */}

      {/* [保留] 這是唯一的管理入口 */}
      <Route path="/admin" element={
        <ProtectedRoute role={role} allowedRole="ADMIN">
          <AdminPage />
        </ProtectedRoute>
      } />
    </Routes>
  );
}