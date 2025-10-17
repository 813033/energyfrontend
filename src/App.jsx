// App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import Login from './Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import Monitor from './pages/Monitor';
import ContractSetting from './pages/DataAnalysis';
import ScheduleResult from './pages/ScheduleResult';
import AdminPage from './pages/AdminPage';
import LoginOverlay from './pages/LoginOverlay';

export default function App() {
  useEffect(() => {
    const first = sessionStorage.getItem('firstVisitCleared');
    if (!first) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      console.log('首次進站清除 Token');
      sessionStorage.setItem('firstVisitCleared', 'true');
    }
  }, []);
  const location = useLocation();
  const state = (location && typeof location.state === 'object') ? location.state : null;


  return (
    <>
      {/* 一般導航至所有頁面 */}
      <Routes location={state?.background || location}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/Monitor" element={<MainLayout><Monitor /></MainLayout>} />
        <Route path="/data-analysis" element={<MainLayout><ContractSetting /></MainLayout>} />
        <Route path="/schedule-result" element={<MainLayout><ScheduleResult /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><AdminPage /></MainLayout>} />
      </Routes>

      {/* 有background時 跳出的登入頁面形式*/}
      {state?.background && (
        <Routes>
          <Route path="/login" element={<LoginOverlay />} />
        </Routes>
      )}
    </>
  );
}
