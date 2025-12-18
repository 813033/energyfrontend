import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '@/hooks/getUserRole';
import { THEME } from '@/ui/theme'; // 確保引用路徑正確
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

  return (
    <header style={{
      // --- [關鍵佈局] 使用 Grid 三欄式，中間保證置中 ---
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr', 
      alignItems: 'center',
      
      background: '#0F141B', // 深色背景
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      height: '4.5rem',      // 固定高度
      padding: '0 1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      zIndex: 20,
      color: THEME.text.primary
    }}>
      
      {/* --- 左側區塊：漢堡選單 --- */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          onClick={() => (onHamburger || toggleSidebar)?.()}
          style={{
            background: 'transparent',
            color: 'inherit',
            border: 0,
            fontSize: '1.4rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            transform: pressed ? 'scale(0.9)' : 'scale(1)',
            transition: 'transform .1s ease'
          }}
        >
          <FaBars />
        </button>
      </div>

      {/* --- 中間區塊：標題 LOGO --- */}
      <div
        onClick={() => navigate('/dashboard')}
        title="回到首頁"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'baseline', // 確保兩個詞底部對齊
          gap: '10px',
          userSelect: 'none',
          // [視覺修正] 強制往上提 4px，解決「貼底」的視覺問題
          position: 'relative',
          top: '-4px',
          marginBottom :'1.2rem',
          marginTop : '1.2rem',
        }}
      >
        {/* 恢復你原本喜歡的字體設定 */}
        <span style={{ 
          fontFamily: THEME.font.mono, 
          fontWeight: 700, 
          fontSize: '2rem',  // 恢復大字體
          color: THEME.brand.info,
          letterSpacing: '1px',
          lineHeight: 1
        }}>
          Energy
        </span>
        <span style={{ 
          fontFamily: THEME.font.mono,
          fontWeight: 600, 
          fontSize: '2rem',
          color: '#E5C558', // 恢復原本的金黃色
          lineHeight: 1
        }}>
          System
        </span>
      </div>

      {/* --- 右側區塊：使用者資訊 --- */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16 }}>
        {token && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            color: 'rgba(230,235,242,0.82)',
            background: 'rgba(255,255,255,0.04)',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {role === 'ADMIN' ? <FaUserShield style={{color: '#c58f22ff'}} /> : <FaUser />}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: 0.5, opacity: 0.6 }}>{role}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{username}</span>
            </div>
          </div>
        )}
        <button
          onClick={handleAuth}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#E6EBF2',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.55rem 1.1rem',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
        >
          {token ? '登出' : '登入'}
        </button>
      </div>
    </header>
  );
}

export default Header;