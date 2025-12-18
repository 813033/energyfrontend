import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getUserRole } from '@/hooks/getUserRole';
// [新增] 引入火箭圖示 FaRocket
import { FaChartLine, FaCalendarAlt, FaCogs, FaUserShield, FaRocket } from 'react-icons/fa';
import { THEME } from '@/ui/theme';

const navItems = [
  { label: '即時監測', path: '/monitor', icon: <FaChartLine /> },
  { label: '歷史排程', path: '/schedule-result', icon: <FaCalendarAlt /> },
  { label: '資料分析', path: '/data-analysis', icon: <FaCogs /> }
];

function Sidebar({ compact, labelsVisible, onNavigate }) {
  const navigate = useNavigate();
  const { role } = getUserRole();
  const token = localStorage.getItem('access_token');
  const { pathname } = useLocation();

  if (!token) return <aside style={{ width: compact ? '4rem' : '16rem', transition: 'width 0.2s' }} />;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: `linear-gradient(180deg, ${THEME.bg.sidebar}, ${THEME.bg.sidebarAlt})`,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      <nav style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.5rem', 
        padding: '1rem 0.75rem' 
      }}>
        
        {/* 一般使用者的選單 (保持不變) */}
        {navItems.map(({ label, path, icon }) => {
          const isActive = pathname.toLowerCase().startsWith(path.toLowerCase());
          return (
            <button
              key={path}
              onClick={() => { navigate(path); onNavigate?.(); }}
              title={compact ? label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 12px', borderRadius: '10px',
                border: isActive ? `1px solid ${THEME.brand.info}` : '1px solid transparent',
                cursor: 'pointer',
                background: isActive ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                color: isActive ? THEME.brand.info : THEME.text.secondary,
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => { if(!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
              onMouseOut={(e) => { if(!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: '1.25rem', display: 'grid', placeItems: 'center', minWidth: '24px' }}>
                {icon}
              </span>
              {!compact && (
                <span className={`nav-label ${labelsVisible ? '' : 'hide'}`} 
                      style={{ fontSize: '0.95rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap' }}>
                  {label}
                </span>
              )}
              {isActive && !compact && (
                 <div style={{ 
                     position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', 
                     width: '3px', height: '60%', 
                     background: THEME.brand.info, 
                     borderTopRightRadius: '4px', borderBottomRightRadius: '4px' 
                 }} />
              )}
            </button>
          );
        })}

        

        {role === 'ADMIN' && (
          <>
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '0.5rem 0.5rem' }} />
            
            <button
              onClick={() => { navigate('/admin'); onNavigate?.(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                // 使用警示色(橘/紅)來突顯這是管理區
                border: pathname === '/admin' ? `1px solid ${THEME.brand.warn}` : '1px solid transparent',
                background: pathname === '/admin' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: pathname === '/admin' ? THEME.brand.warn : THEME.text.secondary,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '1.25rem', display: 'grid', placeItems: 'center', minWidth: '24px' }}>
                <FaUserShield />
              </span>
              {!compact && (
                <span className={`nav-label ${labelsVisible ? '' : 'hide'}`} style={{ fontSize: '0.95rem' }}>
                  管理控制
                </span>
              )}
            </button>
          </>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;