//管理頁面最上面(登入角色顯示、登入登出按鈕、回首頁等等功能)
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '@/hooks/getUserRole';
import { THEME } from '@/ui/theme';
import { FaBars, FaUserShield, FaUser } from 'react-icons/fa';

function Header({ onHamburger, toggleSidebar }) {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('access_token');
  const { username, role } = getUserRole();

  const [pressed, setPressed] = useState(false);

  const handleAuth = () => {
    if (token) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      navigate('/');
    } else {
      navigate('/login', { state: { background: location } });
    }
  };

  const handleHamburgerClick = () => {
    (onHamburger || toggleSidebar)?.();
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: '#0F141B',
      color: THEME.text.primary,
      padding: '0 1rem',
      borderBottom: THEME.border,
      height: '4rem'
    }}>
      {/* sidebar按鈕 */}
      <button
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        onClick={handleHamburgerClick}
        aria-label="切換側欄"
        style={{
          background: 'transparent',
          color: THEME.text.primary,
          border: 0,
          fontSize: '1.35rem',
          padding: '0.5rem',
          transform: pressed ? 'scale(0.9)' : 'scale(1)',
          transition: 'transform .06s ease'
        }}
      >
        <FaBars />
      </button>
        {/* 回首頁功能 */}
      <div
        onClick={() => navigate('/dashboard')}
        title="回到首頁"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'baseline', gap: 8 }}
      >
        <span style={{ fontWeight: 700, letterSpacing: '.5px', color: THEME.brand.info, fontSize: '2rem' }}>Energy</span>
        <span style={{ fontWeight: 600, color: '#E5C558', fontSize: '2rem' }}>System</span>
      </div>
      {/* 登入登出按鈕 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {token && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: THEME.text.secondary }}>
            {role === 'ADMIN' ? <FaUserShield /> : <FaUser />}
            <span style={{ fontSize: '1rem' }}>{role}</span>
            <span style={{ fontSize: '1rem', opacity: .8 }}>{username}</span>
          </div>
        )}
        <button
          onClick={handleAuth}
          style={{
            background: THEME.text.primary,
            color: '#0F141B',
            border: 0,
            padding: '0.5rem 0.75rem',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.95rem'
          }}
        >
          {token ? '登出' : '登入'}
        </button>
      </div>
    </header>
  );
}

export default Header;
