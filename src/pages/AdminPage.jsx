//規劃作為管理員頁面 但目前暫無內容 均為假資料
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function AdminPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');
  let role = '';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      role = decoded.role;
    } catch (err) {
      console.error('decode error', err);
    }
  }

  useEffect(() => {
    if (role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [role, navigate]);

  return (
    <div style={{ padding: '2rem', color: '#fff', fontSize : '2rem' }}>
      <h2>管理員儀表板</h2>

      <section style={{ marginTop: '2rem' }}>
        <h3>最近排程資訊</h3>
        <p>最後排程時間：2025-06-29 22:30</p>
        <p>今日排程次數：2 次</p>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h3>系統參數摘要</h3>
        <ul>
          <li>排程精度：15 分鐘</li>
          
          <li>預測模型：LSTM</li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <button onClick={() => navigate('/param-setting')} style={buttonStyle}>
          編輯參數設定
        </button>
      </section>
    </div>
  );
}

const buttonStyle = {
  background: '#4f46e5',
  color: 'white',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

export default AdminPage;
