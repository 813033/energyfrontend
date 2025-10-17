//主要容器設定 (樣式、顏色等等)
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

export default function MainLayout({ children }) {
  const location = useLocation();
  const hideHeader = location.pathname === '/login';

  const authed = !!localStorage.getItem('access_token');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 1024);
  const [compact, setCompact] = useState(() => !authed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(() => !compact); 
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);


  const css = `
  :root{ --sbw: 9.5rem; --sbw-compact: 4rem; --bg-soft:#0E1624; }
  .layout{ display:grid; grid-template-columns:auto 1fr; height:100vh; }
  .sidebar{
    width: var(--sbw);
    background: var(--panel-weak);
    border-right: 1px solid rgba(255,255,255,.06);
    overflow:auto;
    transition: width .24s ease;
    contain: layout style paint;
    will-change: width;
  }
  .sidebar.compact{ width: var(--sbw-compact); }
  .content{ background: var(--bg-soft); overflow:auto; min-width:0; transform:translateZ(0); }

  /* label 一律不換行 */
  .nav-label{ white-space:nowrap; overflow:hidden; opacity:1; transform:none; transition:opacity .12s ease, transform .12s ease; }
  .sidebar.compact .nav-label,
  .nav-label.hide{ opacity:0; transform: translateX(-6px); pointer-events:none; }

  @media (max-width:1024px){
    .layout{ grid-template-columns: 1fr; }
    .sidebar{ position:fixed; inset:0 auto 0 0; height:100vh; transform:translateX(-100%); width: var(--sbw);
              transition: transform .22s ease; z-index:40; }
    .sidebar.open{ transform:translateX(0); }
    .scrim{ position:fixed; inset:0; background:rgba(0,0,0,.35); backdrop-filter:blur(2px); z-index:39; }
  }
  `;

  const handleHamburger = () => {
    if (isMobile) {
      setMobileOpen(v => !v);
      return;
    }
    //無論展開或收起先把label藏起來避免換行擠動
    setLabelsVisible(false);
    setCompact(v => !v);
  };

  const handleAsideTransitionEnd = (e) => {
    //寬度或位移動畫結束 => 讓圖表做一次乾淨的resize 並在展開後再顯示label
    if (e.propertyName === 'width' || e.propertyName === 'transform') {
      window.dispatchEvent(new Event('resize'));
      if (!compact) setLabelsVisible(true);
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh'}}>
      <style>{css}</style>

      {!hideHeader && (
        <Header onHamburger={handleHamburger} />
      )}

      <div className="layout">
        <aside
          className={[
            'sidebar',
            (!isMobile && compact) ? 'compact' : '',
            (isMobile && mobileOpen) ? 'open' : ''
          ].join(' ').trim()}
          onTransitionEnd={handleAsideTransitionEnd}
        >
          <Sidebar
            compact={!isMobile && compact}
            labelsVisible={labelsVisible}
            onNavigate={() => isMobile && setMobileOpen(false)}
          />
        </aside>

        <main className="content" style={{padding:'1rem'}}>
          {children}
        </main>
      </div>

      {isMobile && mobileOpen && <div className="scrim" onClick={()=>setMobileOpen(false)} />}
    </div>
  );
}
