//側欄各項設定
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '@/hooks/getUserRole';
import { FaChartLine, FaCalendarAlt, FaCogs, FaUserShield } from 'react-icons/fa';
import { THEME } from '@/ui/theme';

const navItems = [
  { label: '即時監測', path: '/Monitor', icon: <FaChartLine /> },
  { label: '歷史排程', path: '/schedule-result', icon: <FaCalendarAlt /> },
  { label: '資料分析', path: '/data-analysis', icon: <FaCogs /> }
];

function Sidebar({ compact, labelsVisible, onNavigate }) {
  const navigate = useNavigate();
  const { role } = getUserRole();
  const token = localStorage.getItem('access_token');
  const { pathname } = useLocation();

  if (!token) return <aside style={{ width: compact ? 72 : 280 }} />;

  return (
    <div style={{
      width: '100%',
      background: `linear-gradient(180deg, ${THEME.bg.sidebar}, ${THEME.bg.sidebarAlt})`,
      height: '100%'
    }}>
      <nav style={{ display:'flex', flexDirection:'column', gap: '1rem', padding: 12}}>
        {navItems.map(({ label, path, icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => { navigate(path); onNavigate?.(); }}
              className="ripple__host"
              style={{
                display:'flex', alignItems:'center', gap:12, width:'100%',
                padding:'12px 14px', borderRadius:12, border:0, cursor:'pointer',
                background: active ? 'rgba(96,165,250,.22)' : 'rgba(250,248,248,.05)',
                color: active ? THEME.text.primary : THEME.text.secondary
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>{icon}</span>
              {/* label不換行 展開動畫完成才顯示*/}
              {!compact && (
                <span className={`nav-label ${labelsVisible ? '' : 'hide'}`} style={{ fontSize:'1.0rem' }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}

        {role === 'ADMIN' && (
          <button
            onClick={() => { navigate('/admin'); onNavigate?.(); }}
            className="ripple__host"
            style={{
              display:'flex', alignItems:'center', gap:12, width:'100%',
              padding:'12px 14px', borderRadius:12, border:0,
              background:'rgba(245,158,11,.18)', color: THEME.text.primary, fontSize:'1.3rem'
            }}
          >
            <FaUserShield />
            {!compact && (
              <span className={`nav-label ${labelsVisible ? '' : 'hide'}`} style={{ fontSize:'1.0rem' }}>
                管理員後台
              </span>
            )}
          </button>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
