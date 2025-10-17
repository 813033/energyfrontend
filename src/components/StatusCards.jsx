//Monitor.jsx共三張 狀態、數據顯示卡片
import React, { useMemo } from 'react';
import { Card } from '@/ui/Card';
import BatteryGauge from 'react-battery-gauge';

const COLORS = {
  green: '#22C55E',
  red:   '#EF4444',
  gray:  '#94A3B8',
  blue:  '#60A5FA',
  text:  '#E6EBF2',
  white:'#ffffffff'
};

function Chip({ children, color = COLORS.gray }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.15rem 0.6rem',
        borderRadius: '999px',
        fontSize: '0.9rem',
        fontWeight: 700,
        background: `${color}22`,
        color,
        border: `1px solid ${color}55`,
      }}
    >
      {children}
    </span>
  );
}

//進度條
function Bar({ percent = 0, color = COLORS.green }) {
  const p = Math.max(0, Math.min(150, percent));
  return (
    <div
      style={{
        height: '0.6rem',
        width: '100%',
        borderRadius: '999px',
        background: 'rgba(255,255,255,.06)',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.08)',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${p}%`,
          background: color,
          transition: 'width .6s ease',
        }}
      />
    </div>
  );
}

//電網使用率
export function GridUsageCard({ grid = 0, contractLimit = 0 }) {
  const percent = useMemo(() => {
    if (!contractLimit || contractLimit <= 0) return 0;
    return (grid / contractLimit) * 100;
  }, [grid, contractLimit]);

  const over = percent > 100;
  const color = over ? COLORS.red : COLORS.green;

  return (
    <Card title="電網使用率(佔契約容量之比例)" subtitle="Grid / Contract">
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: COLORS.text }}>
          {grid?.toFixed ? grid.toFixed(2) : grid} <span style={{ fontSize: '1rem', opacity: .8 }}>kW</span>
        </div>
        <Bar percent={percent} color={color} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Chip color={color}>{Math.round(percent)}%</Chip>
          <span style={{ fontSize: '0.95rem', opacity: .85 }}>
            {over ? '已超約' : '未超約'}
          </span>
        </div>
      </div>
    </Card>
  );
}

//電池SOC 套件BatteryGauge
export function BatterySocCard({ soc = 0 }) {
  const COLORS = { green: '#22C55E', red: '#EF4444', blue: '#60A5FA' };

  const val = Number.isFinite(+soc) ? Math.max(0, Math.min(100, +soc)) : 0;
  const label = val == 0 ? '暫未取得數值' : val <= 25 ? '電量偏低' : val <= 60 ? '可穩定運行' : '電量充足';
  const meterColor = val <= 25 ? COLORS.red : val <= 60 ? COLORS.blue : COLORS.green;
  const size = 200; //電池大小
  const gaugeStyle = {
    batteryBody: {
      strokeWidth: 3,
      cornerRadius: 3,
      fill: 'rgba(255,255,255,.06)',
      strokeColor: 'rgba(255,255,255,.25)',
    },
    batteryCap: {
      strokeWidth: 2,
      fill: 'rgba(255,255,255,.25)',
      strokeColor: 'rgba(255,255,255,.25)',
      capToBodyRatio: 0.3,
    },
    batteryMeter: {
      fill: meterColor,
      lowBatteryValue: 25,
      gradient: false,
    },
    readingText: {
      showPercentage: false,
      lightContrastColor: 'transparent',
      darkContrastColor: 'transparent',
      lowBatteryColor: 'transparent',
      fontSize: 0,
    },
    chargingFlash: { opacity: 0 },
  };

  return (
    <Card title="電量(SOC%)" subtitle="Battery">
      <div style={{ display: 'grid', justifyItems: 'center', gap: '0.6rem' }}>
        <div className="socGauge" style={{ position: 'relative', width: size, height: size * 0.5 }}>
          <BatteryGauge value={val} size={size} animated customization={gaugeStyle} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              color: val == 0 ? COLORS.white : val <= 25 ? COLORS.red : val <= 60 ? COLORS.white : COLORS.white,
              textShadow: '0 1px 2px rgba(0,0,0,.35)',
              pointerEvents: 'none',
            }}
          >
            {val.toFixed(2)}%
          </div>
        </div>
        <div style={{ fontSize: '0.95rem', opacity: 0.9, textAlign: 'center' }}>{label}</div>
        <style>{`.socGauge svg text{display:none !important}`}</style>
      </div>
    </Card>
  );
}


//充放電狀態
export function ChargeStateCard({ charge = 0, discharge = 0 }) {
  const absC = Math.max(0, Number(charge) || 0);
  const absD = Math.max(0, Number(discharge) || 0);
  const TH = 0.1;
  const state =
    absC > TH ? '充電中' :
    absD > TH ? '放電中' : '閒置中';

  const chipColor =
    state === '充電中' ? COLORS.green :
    state === '放電中' ? COLORS.red : COLORS.gray;

  const power =
    state === '充電中' ? absC :
    state === '放電中' ? absD : 0;

  return (
    <Card title="儲能電池充放電狀態" subtitle="BESS Status">
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800 }}>
          {power.toFixed ? power.toFixed(2) : power} <span style={{ fontSize: '1rem', opacity: .8 }}>kW</span>
        </div>
        <div>
          <Chip color={chipColor}>{state}</Chip>
        </div>
      </div>
    </Card>
  );
}

//一排放三張
export default function StatusRow({ grid, contractLimit, soc, charge, discharge }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
        gap: '0.5rem',
      }}
    >
      <GridUsageCard grid={grid} contractLimit={contractLimit} />
      <BatterySocCard soc={soc} />
      <ChargeStateCard charge={charge} discharge={discharge} />
    </div>
  );
}
