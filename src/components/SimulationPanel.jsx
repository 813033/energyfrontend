import React, { useState, useEffect } from 'react';
import axiosWithAuth from '@/utils/axiosWithAuth';
import { THEME } from '@/ui/theme';
import { FaPlay, FaRocket, FaStop, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import dayjs from "dayjs";

export default function SimulationPanel() {
  const [startDate, setStartDate] = useState(dayjs('2022-12-01').toDate());
  const [endDate, setEndDate] = useState(dayjs('2023-04-29').toDate());
  
  const [loading, setLoading] = useState(false); // 這代表 "是否正在執行中"
  const [statusMsg, setStatusMsg] = useState('');

  // ==========================================
  // [新增] 自動同步狀態機制
  // ==========================================
  useEffect(() => {
    // 1. 一進來先檢查一次
    checkStatus();

    // 2. 設定輪詢 (Polling)：每 2 秒檢查一次
    // 這樣如果後端跑完了，前端按鈕會自動變回綠色，不用手動重新整理
    const intervalId = setInterval(checkStatus, 2000);

    // 清除計時器 (當元件移除時)
    return () => clearInterval(intervalId);
  }, []);

  const checkStatus = async () => {
    try {
      const res = await axiosWithAuth().get('/api/simulation/status');
      const isRunning = res.data.running;
      
      // 如果狀態改變了，更新 UI
      setLoading(prev => {
        if (prev !== isRunning) {
            // 如果從 true 變 false (剛跑完)，可以給個提示
            if (prev === true && isRunning === false) {
                setStatusMsg('✅ 模擬執行完畢');
            }
            return isRunning;
        }
        return prev;
      });
    } catch (err) {
      console.error("無法取得模擬狀態", err);
    }
  };
  // ==========================================

  const handleStart = async () => {
    // 按下去先設為 true，提升反應速度
    setLoading(true);
    setStatusMsg('正在觸發 Python ...');
    
    const startStr = dayjs(startDate).format('YYYY-MM-DD');
    const endStr = dayjs(endDate).format('YYYY-MM-DD');

    try {
      const res = await axiosWithAuth().post(`/api/simulation/start`, null, {
        params: { start: startStr, end: endStr }
      });
      setStatusMsg('🚀 ' + (res.data.message || '指令已發送'));
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ 啟動失敗');
      setLoading(false); // 失敗才要手動關掉 loading，成功的話交給輪詢去檢查
    }
  };

  const handleStop = async () => {
    try {
      await axiosWithAuth().post(`/api/simulation/stop`);
      setStatusMsg('⛔ 正在停止...');
      // 不用急著 setLoading(false)，等下一輪 checkStatus 確認真的停了再變
    } catch (err) {
      console.error(err);
      setStatusMsg('❌ 停止失敗');
    }
  };

  const dateInputStyle = {
    width: '100%', background: '#14171c', border: THEME.border, 
    color: 'white', padding: '10px 12px', borderRadius: '8px', 
    fontSize: '1rem', outline: 'none', cursor: 'pointer'
  };

  return (
    <div style={{
      background: THEME.bg.surface, border: THEME.border, borderRadius: THEME.radius,
      padding: '1.5rem', boxShadow: THEME.shadow, color: THEME.text.primary,
      marginTop: '1rem', maxWidth: '650px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>系統模擬控制</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={{ display:'block', marginBottom: 8, fontSize: '0.9rem', color: THEME.text.secondary }}>開始日期</label>
          <Flatpickr options={{ mode: "single", dateFormat: "Y-m-d", allowInput: true }} value={startDate} onChange={(dates) => setStartDate(dates?.[0] ?? startDate)} render={(_, ref) => (<input ref={ref} style={dateInputStyle} />)} />
        </div>
        <div>
          <label style={{ display:'block', marginBottom: 8, fontSize: '0.9rem', color: THEME.text.secondary }}>結束日期</label>
          <Flatpickr options={{ mode: "single", dateFormat: "Y-m-d", allowInput: true, minDate: startDate }} value={endDate} onChange={(dates) => setEndDate(dates?.[0] ?? endDate)} render={(_, ref) => (<input ref={ref} style={dateInputStyle} />)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        {/* 啟動按鈕 */}
        <button
          onClick={handleStart}
          disabled={loading} 
          style={{
            flex: 2, padding: '14px', borderRadius: 10, border: 'none',
            background: loading ? '#4B5563' : 'linear-gradient(90deg, #22C55E, #16A34A)', 
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
            transition: 'all 0.2s', opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '模擬執行中...' : <><FaPlay /> 開始執行模擬</>}
        </button>

        {/* 停止按鈕 */}
        <button
          onClick={handleStop}
          // 只有在 loading (執行中) 時才能按停止
          disabled={!loading}
          style={{
            flex: 1, padding: '14px', borderRadius: 10, border: 'none',
            background: '#EF4444', 
            color: 'white', fontWeight: 700, fontSize: '1.1rem',
            cursor: !loading ? 'not-allowed' : 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10,
            transition: 'all 0.2s',
            opacity: !loading ? 0.3 : 1, // 沒在跑時變很淡
            filter: !loading ? 'grayscale(100%)' : 'none'
          }}
        >
          <FaStop /> 停止
        </button>
      </div>

      {statusMsg && (
        <div style={{ 
          marginTop: 16, fontSize: '1rem', 
          color: statusMsg.includes('停止') || statusMsg.includes('失敗') ? '#FCA5A5' : '#86EFAC',
          background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 8, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {statusMsg.startsWith('❌') || statusMsg.includes('停止') ? <FaExclamationCircle /> : <FaCheckCircle />}
          {statusMsg}
        </div>
      )}
    </div>
  );
}