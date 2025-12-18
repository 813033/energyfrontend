import React, { useState, useEffect } from 'react';
import { THEME } from '@/ui/theme';
import axiosWithAuth from '@/utils/axiosWithAuth';
import SimulationPanel from '@/components/SimulationPanel'; // 引入模擬面板
import { FaServer, FaRocket, FaEdit } from 'react-icons/fa';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'simulation'
  const [loading, setLoading] = useState(false);
  
  // 這裡可以保留你原本抓取參數的邏輯
  const [config, setConfig] = useState({
    lastSchedule: '2025-06-29 22:30',
    scheduleCount: 2,
    precision: '15 分鐘',
    model: 'LSTM'
  });

  // Tab 按鈕樣式
  const getTabStyle = (tabName) => ({
    padding: '10px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '1rem',
    border: 'none',
    background: activeTab === tabName ? THEME.brand.info : 'transparent',
    color: activeTab === tabName ? '#0F141B' : THEME.text.secondary,
    transition: 'all 0.2s',
    display: 'flex', alignItems: 'center', gap: 8
  });

  return (
    <div style={{ padding: '1rem', maxWidth: '1000px', margin: '0 auto', color: THEME.text.primary }}>
      
      {/* 頁面標題區 */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2rem' }}>管理控制台</h1>
        <p style={{ color: THEME.text.secondary, margin: 0 }}>
          系統參數設定與全系統模擬操作中心
        </p>
      </div>

      {/* 分頁切換按鈕 */}
      <div style={{ 
        display: 'flex', gap: '1rem', marginBottom: '2rem', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' 
      }}>
        <button onClick={() => setActiveTab('dashboard')} style={getTabStyle('dashboard')}>
          <FaServer /> 系統狀態與參數
        </button>
        <button onClick={() => setActiveTab('simulation')} style={getTabStyle('simulation')}>
          <FaRocket /> 系統模擬啟動
        </button>
      </div>

      {/* --- 分頁內容 1: 儀表板與參數 (保留你原本的內容) --- */}
      {activeTab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            {/* 卡片 1: 排程資訊 */}
            <div style={{ background: THEME.bg.surface, padding: '24px', borderRadius: THEME.radius, border: THEME.border }}>
              <h3 style={{ marginTop: 0, display:'flex', alignItems:'center', gap:8 }}>
                最近排程資訊
              </h3>
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: THEME.text.secondary }}>最後排程時間</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{config.lastSchedule}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: THEME.text.secondary }}>今日排程次數</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{config.scheduleCount} 次</div>
                </div>
              </div>
            </div>

            {/* 卡片 2: 參數摘要 */}
            <div style={{ background: THEME.bg.surface, padding: '24px', borderRadius: THEME.radius, border: THEME.border }}>
              <h3 style={{ marginTop: 0 }}>系統參數摘要</h3>
              <ul style={{ paddingLeft: '20px', lineHeight: '1.8', color: THEME.text.secondary }}>
                <li>排程精度：<span style={{ color: 'white' }}>{config.precision}</span></li>
                <li>預測模型：<span style={{ color: 'white' }}>{config.model}</span></li>
              </ul>
              <button style={{
                marginTop: '1rem',
                background: 'rgba(96, 165, 250, 0.1)', border: `1px solid ${THEME.brand.info}`,
                color: THEME.brand.info, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <FaEdit /> 編輯參數設定
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- 分頁內容 2: 系統模擬 (嵌入 SimulationPanel) --- */}
      {activeTab === 'simulation' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <SimulationPanel />
        </div>
      )}

      {/* 簡單的淡入動畫 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}