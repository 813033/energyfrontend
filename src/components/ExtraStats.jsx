//Monitor.jsx數據顯示字卡(四張ㄋ)
import React, { useMemo } from 'react';
import { Card } from '@/ui/Card';
import { DateTime } from 'luxon';

//小工具
const safeNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt2 = v => safeNum(v).toFixed(2);

//目前最新一筆（依load是否為null過濾）
const useLatest = (arr) => {
  return useMemo(() => {
    if (!Array.isArray(arr) || !arr.length) return null;
    const a = arr.filter(d => d && d.createdAt);
    return a.length ? a[a.length - 1] : null;
  }, [arr]);
};

const badgeStyle = (bg) => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 9999,
  fontSize: '.9rem',
  fontWeight: 800,
  color: '#fff',
  backgroundColor: bg
});

//今日最高需量（Grid）
export function PeakGridCard({ recent = [], contractLimit = 0 }) {
  const { peak, when } = useMemo(() => {
    let p = 0, t = null;
    for (const r of recent) {
      const g = safeNum(r?.grid);
      if (g >= p) { p = g; t = r?.createdAt || t; }
    }
    return { peak: p, when: t };
  }, [recent]);

  const diff = safeNum(contractLimit) - peak;
  const color = diff >= 0 ? '#E6EBF2' : '#EF4444';

  return (
    <Card title="今日最高需量" subtitle="Grid Peak">
      <div style={{ fontSize:'2rem', fontWeight:800, color }}>
        {fmt2(peak)} <span style={{ fontSize:'1rem', opacity:.8 }}>kW</span>
      </div>
      <div style={{ opacity:.85 }}>
        {diff >= 0 ? `距契約尚餘 ${fmt2(diff)} kW` : `超約 ${fmt2(Math.abs(diff))} kW`}
      </div>
      {when && <div style={{ opacity:.6, fontSize:'.95rem' }}>
        發生於 {DateTime.fromISO(when).toFormat('HH:mm')}
      </div>}
    </Card>
  );
}

//超約累計時間
export function OverLimitTimeCard({ recent = [], contractLimit = 0, SLOT_MINUTES = 15 }) {
  const minutes = useMemo(() => {
    let m = 0;
    for (const r of recent) if (safeNum(r?.grid) > safeNum(contractLimit)) m += SLOT_MINUTES;
    return m;
  }, [recent, contractLimit, SLOT_MINUTES]);

  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;

  return (
    <Card title="超約累計時間" subtitle="Over-limit">
      <div style={{ fontSize:'2rem', fontWeight:800, color:'#EF4444' }}>
        {hh} 小時 {mm} 分
      </div>
      <div style={{ opacity:.85 }}>以 {SLOT_MINUTES} 分鐘/格計算</div>
    </Card>
  );
}

//最新預測誤差（實際Load vs 目前預測第一格)
export function PredictionErrorCard({ recent = [], predFilled = [] }) {
  const latest = useLatest(recent);
  const actual = safeNum(latest?.load);
  const pred0  = safeNum(predFilled?.[0]?.load);

  const hasData = actual || pred0;
  const errKw   = hasData ? Math.abs(actual - pred0) : null;
  const errPct  = hasData && actual ? (errKw / Math.max(1, actual)) * 100 : null;

  //0%~15% 綠 其餘紅 無資料灰
  const pctBadgeBg =
    errPct == null ? '#6B7280' : (errPct <= 15 ? '#22C55E' : '#EF4444');

  return (
    <Card title="最新預測誤差" subtitle="Actual vs Forecast">
      {hasData ? (
        <>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>
            {fmt2(errKw)} <span style={{ fontSize: '1rem', opacity: .8 }}>kW</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <span style={badgeStyle(pctBadgeBg)}>
              {errPct.toFixed(1)}%
            </span>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 6 }}>
          <span style={badgeStyle('#6B7280')}>暫未取得數值</span>
        </div>
      )}
    </Card>
  );
}



//近1小時負載變化量
export function ShortTrendCard({ recent = [], SLOT_MINUTES = 15 }) {
  const latest = useLatest(recent);
  const steps  = Math.max(1, Math.round(60 / SLOT_MINUTES));
  const prev   = recent.length > steps ? recent[recent.length - 1 - steps] : null;

  const delta  = safeNum(latest?.load) - safeNum(prev?.load);

//狀態文案與顏色
  const state =
    !Number.isFinite(delta) ? '無變動'
    : delta < 0 ? '下降'
    : delta > 0 ? '上升'
    : '無變動';

  const badgeBg =
    state === '下降'   ? '#EF4444' :
    state === '上升'   ? '#22C55E' :
                         '#6B7280';

  return (
    <Card title="近 1 小時負載變化" subtitle="Δ Load (1h)">
      <div style={{ fontSize:'2rem', fontWeight:800, color:'#fff' }}>
        {fmt2(delta)} <span style={{ fontSize:'1rem', opacity:.8 }}>kW</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <span style={badgeStyle(badgeBg)}>{state}</span>
      </div>
    </Card>
  );
}

//一排四張
export default function ExtraStatsRow({ recent = [],
  predFilled = [],
  contractLimit = 0,
  SLOT_MINUTES = 15,
  }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:'0.5rem' }}>
      <PeakGridCard recent={recent} contractLimit={contractLimit} />
      <OverLimitTimeCard recent={recent} contractLimit={contractLimit} SLOT_MINUTES={SLOT_MINUTES} />
      <ShortTrendCard recent={recent} SLOT_MINUTES={SLOT_MINUTES} />
      <PredictionErrorCard recent={recent} predFilled={predFilled} />
   </div>
  );
}
