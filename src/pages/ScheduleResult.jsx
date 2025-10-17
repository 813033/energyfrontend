//過去排程紀錄
import React, { useState, useRef, useEffect, useMemo, useDeferredValue } from 'react';
import axios from 'axios';

import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { Chart } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

import { BASE_URL } from '@/config.js';
import { Card } from '@/ui/Card';
import { Surface } from '@/ui/Surface';
import { THEME } from '@/ui/theme';
import dayjs from 'dayjs';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/dark.css';

Chart.register(annotationPlugin);
Chart.register(zoomPlugin);

const stylesSR = {
  page: { padding: 16 },
  toolbarRow: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  btn: {
    padding: '8px 12px', background: '#60A5FA', color: '#0F141B',
    border: 0, borderRadius: 10, cursor: 'pointer', fontWeight: 700
  },
  input: {
    background: '#0F141B', color: THEME.text.primary, border: THEME.border,
    borderRadius: 10, padding: '6px 10px'
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '10px 8px',
    color: THEME.text.primary, background: 'rgba(255,255,255,.06)'
  },
  td: {
    padding: '10px 8px', borderBottom: '1px solid rgba(255,255,255,.06)',
    fontFamily: THEME.font.mono
  }
};

const selStyle = {
  background: '#0F141B', color: THEME.text.primary, border: THEME.border,
  borderRadius: 10, padding: '6px 10px'
};
const btnPrimary = {
  background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 10,
  padding: '8px 12px', fontWeight: 700, boxShadow: THEME.shadow, cursor: 'pointer'
};
const btnGhost = {
  background: 'transparent', color: THEME.text.secondary, border: THEME.border,
  borderRadius: 10, padding: '8px 12px', fontWeight: 600, cursor: 'pointer'
};
const thStyle = { textAlign: 'left', padding: '8px 10px', borderBottom: THEME.border, color: THEME.text.secondary, fontWeight: 700 };
const tdStyle = { padding: '8px 10px', color: THEME.text.primary };
const highlightTh = {
  background: 'rgba(59,130,246,0.25)',
  color: '#3b82f6',
  fontWeight: 800
};
const btnSuccess = {
  background: '#126e34ff', color: '#ffffffff', border: 'none', borderRadius: 10,
  padding: '8px 12px', fontWeight: 800, boxShadow: THEME.shadow, cursor: 'pointer'
};
const dateInputStyle = {
  background: "#14171c",
  color: THEME.text.secondary,
  border: THEME.border,
  borderRadius: 10,
  padding: "8px 12px",
  width: 180
};

//Chips RangeRow切換與數值輸入
function Chip({ on, label, onToggle, children }){
  return (
    <div style={{ display:'inline-flex', flexDirection:'column', gap:6 }}>
      <button onClick={onToggle} style={{
        padding:'8px 14px', borderRadius:9999, border: on ? '1px solid #3b82f6' : THEME.border,
        background: on ? 'rgba(59,130,246,0.15)' : THEME.bg.glass,
        color: on ? '#93c5fd' : THEME.text.secondary, fontWeight:800, cursor:'pointer'
      }}>
        {label}
      </button>
      {on && children ? (
        <div style={{
          background: THEME.bg.glass, border: THEME.border, borderRadius: 12,
          padding: 8, display:'flex', gap:8, alignItems:'center'
        }}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

//區間門檻輸入框
function RangeRow({ gt, lt, onGt, onLt, placeholderMin="大於", placeholderMax="小於" }){
  const inp = {
    width:100, padding:'8px 10px', border: THEME.border, borderRadius:10,
    background:'#0f1319', color:THEME.text.primary, fontWeight:700
  };
  const tag = { fontSize:12, opacity:.8, minWidth:28 };
  return (
    <>
      <span style={tag}>{placeholderMin}</span>
      <input value={gt} onChange={onGt} placeholder="數值" inputMode="decimal" style={inp}/>
      <span style={tag}>{placeholderMax}</span>
      <input value={lt} onChange={onLt} placeholder="數值" inputMode="decimal" style={inp}/>
    </>
  );
}

//主元件
function ScheduleResult() {
  const [selectedDate, setSelectedDate] = useState(dayjs('2022-12-01').toDate());
  const formattedSelected = useMemo(
    () => dayjs(selectedDate).format('YYYY-MM-DD'),
    [selectedDate]
  );
  const [data, setData] = useState([]);
  const [noData, setNoData] = useState(false);
  const chartRef = useRef(null);

  //排序與分頁狀態
  const [combineMode, setCombineMode] = useState('AND');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('ASC');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [qLoading, setQLoading] = useState(false);

  //每日摘要狀態
  const [summary, setSummary] = useState(null);
  const [queriedDate, setQueriedDate] = useState('');

  const [gridOpen, setGridOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);
  const [socOpen,  setSocOpen]  = useState(false);
  const [chgOpen,  setChgOpen]  = useState(false);
  const [disOpen,  setDisOpen]  = useState(false);

  //門檻輸入值
  const [gridMinInput, setGridMinInput] = useState(''); const [gridMaxInput, setGridMaxInput] = useState('');
  const [loadMinInput, setLoadMinInput] = useState(''); const [loadMaxInput, setLoadMaxInput] = useState('');
  const [socMinInput,  setSocMinInput]  = useState(''); const [socMaxInput,  setSocMaxInput]  = useState('');
  const [chargeMinInput, setChargeMinInput] = useState(''); const [chargeMaxInput, setChargeMaxInput] = useState('');
  const [dischargeMinInput, setDischargeMinInput] = useState(''); const [dischargeMaxInput, setDischargeMaxInput] = useState('');

  //debounced實值
  const [gridMin, setGridMin] = useState('');   const [gridMax, setGridMax] = useState('');
  const [loadMin, setLoadMin] = useState('');   const [loadMax, setLoadMax] = useState('');
  const [socMin, setSocMin]   = useState('');   const [socMax, setSocMax]   = useState('');
  const [chargeMin, setChargeMin] = useState(''); const [chargeMax, setChargeMax] = useState('');
  const [dischargeMin, setDischargeMin] = useState(''); const [dischargeMax, setDischargeMax] = useState('');
  const [predAligned, setPredAligned] = useState([]);
  
  useEffect(()=>{ const t=setTimeout(()=> setGridMin(gridOpen?gridMinInput:''),200); return ()=>clearTimeout(t);},[gridOpen,gridMinInput]);
  useEffect(()=>{ const t=setTimeout(()=> setGridMax(gridOpen?gridMaxInput:''),200); return ()=>clearTimeout(t);},[gridOpen,gridMaxInput]);
  useEffect(()=>{ const t=setTimeout(()=> setLoadMin(loadOpen?loadMinInput:''),200); return ()=>clearTimeout(t);},[loadOpen,loadMinInput]);
  useEffect(()=>{ const t=setTimeout(()=> setLoadMax(loadOpen?loadMaxInput:''),200); return ()=>clearTimeout(t);},[loadOpen,loadMaxInput]);
  useEffect(()=>{ const t=setTimeout(()=> setSocMin(socOpen?socMinInput:''),200); return ()=>clearTimeout(t);},[socOpen,socMinInput]);
  useEffect(()=>{ const t=setTimeout(()=> setSocMax(socOpen?socMaxInput:''),200); return ()=>clearTimeout(t);},[socOpen,socMaxInput]);
  useEffect(()=>{ const t=setTimeout(()=> setChargeMin(chgOpen?chargeMinInput:''),200); return ()=>clearTimeout(t);},[chgOpen,chargeMinInput]);
  useEffect(()=>{ const t=setTimeout(()=> setChargeMax(chgOpen?chargeMaxInput:''),200); return ()=>clearTimeout(t);},[chgOpen,chargeMaxInput]);
  useEffect(()=>{ const t=setTimeout(()=> setDischargeMin(disOpen?dischargeMinInput:''),200); return ()=>clearTimeout(t);},[disOpen,dischargeMinInput]);
  useEffect(()=>{ const t=setTimeout(()=> setDischargeMax(disOpen?dischargeMaxInput:''),200); return ()=>clearTimeout(t);},[disOpen,dischargeMaxInput]);

//抓取預測並依日期時間對齊到圖表labels
async function fetchPredictionAndAlign(dateStr, chartLabels) {
  try {
    const idxs = Array.from({ length: 96 }, (_, i) => i);

    const tasks = idxs.map((idx) =>
      fetch(`${BASE_URL}/api/prediction/predictions?date=${dateStr}&idx=${idx}`)
        .then(r => r.ok ? r.json() : Promise.reject(r.status))
        .then(arr => (Array.isArray(arr) && arr.length ? arr[0] : null))
        .catch(() => null)
    );
    const results = await Promise.allSettled(tasks);

    const pred96 = results.map((r) => {
      if (r.status !== 'fulfilled' || !r.value) return null;
      const n = Number(r.value.pred_vals);
      return Number.isFinite(n) ? n : null;
    });

    const aligned = (chartLabels || []).map(lbl => {
      const mins = minutesFromStartOfDay(lbl, dateStr);
      if (mins == null) return null;
      const i = Math.floor(mins / 15);
      return (i >= 0 && i < 96) ? pred96[i] : null;
    });

    setPredAligned(aligned);
  } catch (e) {
    console.error('取預測資料失敗', e);
    setPredAligned([]);
  }
}

//圖表資料排序與標籤生成
  const sortedData = useMemo(
    () => [...data].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [data]
  );
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const labels = sortedData.map(item => new Date(item.createdAt).toLocaleString('zh-TW', { timeZone: userTimeZone, hour12: false }));

//高電價區段計算
  const touSegments = useMemo(() => {
  if (!sortedData.length || !labels.length) return [];
  const segs = [];
  let runStart = null;

  for (let i = 0; i < sortedData.length; i++) {
    const tou = sortedData[i]?.tou ?? sortedData[i]?.TOU ?? sortedData[i]?.touPrice;
    const high = isHighTOU(tou);
    if (high && runStart == null) runStart = i;
    if (!high && runStart != null) {
      segs.push({ xMin: labels[runStart], xMax: labels[i] });
      runStart = null;
    }
  }
  if (runStart != null) {
    segs.push({ xMin: labels[runStart], xMax: labels[labels.length - 1] });
  }
  return segs;
}, [sortedData, labels]);

//圖表資料集
  const chartData = {
    labels,
    datasets: [
      { label: 'Grid Power (kW)', data: sortedData.map(d => d.grid), borderColor: "rgba(255, 255, 255, 1)", borderWidth: 2},
      { label: 'Charge (kW)', data: sortedData.map(d => d.charge), borderColor: "rgba(36,255,18,1)", borderWidth: 2 },
      { label: 'Discharge (kW)', data: sortedData.map(d => d.discharge), borderColor: 'red', borderWidth: 2 },
      { label: 'SOC (%)', data: sortedData.map(d => d.soc), borderColor: 'orange', yAxisID: 'y1', borderWidth: 2 },
      { label: 'Load_actual (kW)', data: sortedData.map(d => d.load), borderColor: "#9c27b0", borderWidth: 2 },
      {
      label: 'Load_prediction (kW)',
      data: predAligned,
      borderColor: '#9bb027ff',
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      spanGaps: true
    }
    ],
  };

//圖表設定
  const options = {
    responsive: true,
    resizeDelay: 150,
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "功率 (kW)", color: '#ccc' },
        ticks: { color: '#ccc' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y1: {
        beginAtZero: true, min: 0, max: 100, position: "right",
        title: { display: true, text: "SOC (%)", color: '#ccc' },
        ticks: { color: '#ccc' }, grid: { drawOnChartArea: false }, offset: true, padding: 15
      },
      x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.07)' } }
    },
    plugins: {
      annotation: {
        clip: false,
        annotations: touSegments.reduce((acc, seg, i) => {
          acc[`tou_hi_${i}`] = {
            type: 'box',
            xScaleID: 'x',
            yScaleID: 'y',
            xMin: seg.xMin,
            xMax: seg.xMax,
            yMin: 'min',
            yMax: 'max',
            backgroundColor: 'rgba(239, 68, 68, 0.10)',
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw'
          };
          return acc;
        }, {})
      },
      legend: {
        labels: { color: '#ffffff', font: { size: 14, family: 'Noto Sans TC' }, boxWidth: 20, boxHeight: 12 },
        position: 'top', align: 'center'
      },
      zoom: { pan: { enabled: true, mode: 'x' }, zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: 'x' } }
    },
    elements: { point: { radius: 0 } },
    layout: { padding: { right: 0, top: 18 } },
    maintainAspectRatio: false
  };

  const deferredChartData = useDeferredValue(chartData);
  const deferredOptions = useDeferredValue(options);

 //資料讀取圖表
  const fetchData = async (dateStr) => {
    if (!dateStr) return;
    setQueriedDate(dateStr);
    const startTime = new Date(`${dateStr}T00:00:00`).toISOString();
    const endTime = new Date(`${dateStr}T23:59:59`).toISOString();
    try {
      const res = await axios.get(`${BASE_URL}/api/command/history`, {
        params: { startTime, endTime, sortDirection, size: 1440 }
      });
      if ((res.data?.content ?? []).length === 0) {
        setNoData(true); setData([]);
      } else {
        setNoData(false); setData(res.data.content);
      }
      await fetchSummary(dateStr);
      const labelsNow = (res.data?.content ?? [])
      .sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt))
      .map(item => new Date(item.createdAt).toLocaleString('zh-TW', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, hour12: false
      }));

    fetchPredictionAndAlign(dateStr, labelsNow);
    } catch (err) {
      console.error('圖表資料錯誤:', err);
      setNoData(true); setData([]);
    }
  };

//每日摘要查詢
  const fetchSummary = async (date, sequence = 1) => {
    try {
      const res = await axios.get(`${BASE_URL}/api/schedule-summary/${date}`, { params: { sequence } });
      setSummary(res.data);
    } catch (err) {
      console.error('取得 summary 資料錯誤:', err);
      setSummary(null);
    }
  };


const [rows, setRows] = useState([]);

//條件參數組裝
function buildConditionParams(dateStr, pageIdx, sizeOverride){
  const { start, end } = dayToUtcIsoRange(dateStr);
  const p = new URLSearchParams();
  p.set('startTime', start);
  p.set('endTime', end);
  p.set('combineMode', combineMode);
  p.set('page', String(pageIdx ?? 0));
  p.set('size', String(sizeOverride ?? pageSize));
  p.set('sortField', sortField);
  p.set('sortDirection', sortDirection);

  const addRange = (open, minStr, maxStr, key) => {
    if (!open) return;
    const gt = (minStr ?? '').trim();
    const lt = (maxStr ?? '').trim();
    if (gt !== '') p.set(`${key}GreaterThan`, gt);
    if (lt !== '') p.set(`${key}LessThan`, lt);
  };
  addRange(gridOpen, gridMinInput, gridMaxInput, 'grid');
  addRange(loadOpen, loadMinInput, loadMaxInput, 'load');
  addRange(socOpen,  socMinInput,  socMaxInput,  'soc');
  addRange(chgOpen,  chargeMinInput, chargeMaxInput, 'charge');
  addRange(disOpen,  dischargeMinInput, dischargeMaxInput, 'discharge');

  return p;
}

//條件查詢執行
  async function runConditionQuery(goPage = 0) {
    const dateStr = formattedSelected;
    if (!dateStr) return;
    setQLoading(true);
    try {
      const { start, end } = dayToUtcIsoRange(dateStr);
      const p = new URLSearchParams();
      p.set('startTime', start);
      p.set('endTime', end);
      p.set('combineMode', combineMode);
      p.set('page', String(goPage));
      p.set('size', String(pageSize));
      p.set('sortField', sortField);
      p.set('sortDirection', sortDirection);

      const addRange = (open, minStr, maxStr, key) => {
        if (!open) return;
        const gt = (minStr ?? '').trim();
        const lt = (maxStr ?? '').trim();
        if (gt !== '') p.set(`${key}GreaterThan`, gt);
        if (lt !== '') p.set(`${key}LessThan`, lt);
      };
      addRange(gridOpen, gridMinInput, gridMaxInput, 'grid');
      addRange(loadOpen, loadMinInput, loadMaxInput, 'load');
      addRange(socOpen,  socMinInput,  socMaxInput,  'soc');
      addRange(chgOpen,  chargeMinInput, chargeMaxInput, 'charge');
      addRange(disOpen,  dischargeMinInput, dischargeMaxInput, 'discharge');

      const url = `${BASE_URL}/api/command/history?${p.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`/api/command/history ${res.status}`);
      const json = await res.json();

      setRows(json?.content ?? []);
      setTotalElements(json?.totalElements ?? 0);
      setTotalPages(json?.totalPages ?? 0);
      setPage(json?.number ?? goPage);
    } catch (err) {
      console.error('條件查詢失敗', err);
      setRows([]); setTotalElements(0); setTotalPages(0);
      alert('條件查詢失敗');
    } finally {
      setQLoading(false);
    }
  }

//匯出CSV
async function exportCsv() {
  const dateStr = formattedSelected;
  if (!dateStr) return;

  try {
    let p0 = buildConditionParams(dateStr, 0, pageSize);
    let res0 = await fetch(`${BASE_URL}/api/command/history?${p0.toString()}`);
    if (!res0.ok) throw new Error('載入資料失敗');
    const j0 = await res0.json();

    const totalPagesLocal = j0?.totalPages ?? 0;
    const all = [...(j0?.content ?? [])];

    for (let i = 1; i < totalPagesLocal; i++) {
      const pi = buildConditionParams(dateStr, i, pageSize);
      const ri = await fetch(`${BASE_URL}/api/command/history?${pi.toString()}`);
      if (!ri.ok) break;
      const ji = await ri.json();
      if (ji?.content) all.push(...ji.content);
    }

    if (all.length === 0) {
      alert('沒有可匯出的資料');
      return;
    }

    const headers = ['時間','電網取用(kW)','充電(kW)','放電(kW)','電量(%)','所需總負載(kW)','裝置'];
    const lines = [headers.join(',')];

    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/\"/g,'\"\"')}"` : s;
    };

    for (const r of all) {
      const row = [
        r?.createdAt ?? r?.time ?? '',
        r?.grid ?? '',
        r?.charge ?? '',
        r?.discharge ?? '',
        r?.soc ?? '',
        r?.load ?? '',
        r?.device ?? ''
      ].map(esc).join(',');
      lines.push(row);
    }

    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `history_schedule_result_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('匯出失敗', e);
    alert('匯出失敗，請稍後再試');
  }
}




//Render 
  return (
    <div style={stylesSR.page}>
      {/* 查詢與操作 */}
      <Card title="條件與操作" subtitle="Query">
        <div style={stylesSR.toolbarRow}>
          <label style={{ fontWeight: 700 }}>選擇日期：</label>
          <Flatpickr
            options={{ mode: 'single', dateFormat: 'Y-m-d', allowInput: true }}
            value={selectedDate}
            onChange={(dates) => setSelectedDate(dates?.[0] ?? selectedDate)}
            render={(_, ref) => (
              <input ref={ref} style={dateInputStyle} placeholder="選擇日期" />
            )}
          />

          <button
              onClick={() => {
                const d = dayjs(selectedDate).subtract(1, 'day').toDate();
                setSelectedDate(d);
                fetchData(dayjs(d).format('YYYY-MM-DD'));
              }}
              style={stylesSR.btn}
            >上一天</button>

          <button onClick={() => fetchData(formattedSelected)} style={stylesSR.btn}>查詢圖表</button>

          <button
            onClick={() => {
              const d = dayjs(selectedDate).add(1, 'day').toDate();
              setSelectedDate(d);
              fetchData(dayjs(d).format('YYYY-MM-DD'));
            }}
            style={stylesSR.btn}
          >下一天</button>

          <button onClick={() => chartRef.current?.resetZoom()} style={{ ...stylesSR.btn, background:'#94A3B8', color:'#0F141B' }}>
            重置縮放
          </button>
        </div>
      </Card>

      {/* 圖表 */}
      <Card title="排程控制圖表" subtitle="kW / SOC" style={{ marginTop: 12 }}>
      <span
          style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 9999,
            background: 'rgba(239,68,68,0.15)',
            color: '#fecaca',
            fontWeight: 800,
            fontSize: '.9rem',
            pointerEvents: 'auto',
          }}
        >
          高電價時段 NT$5.78/kWh
        </span>
        <div style={{ height: 380, minWidth: 0 }}>
          {noData
            ? <div style={{display:'grid',placeItems:'center',height:'100%', color:THEME.text.secondary}}>查無資料</div>
            : <Line ref={chartRef} data={deferredChartData} options={deferredOptions} />
          }
        </div>
      </Card>



{/* 每日摘要 分區卡片網格*/}
{summary && (
  <Surface style={{ marginTop: 12 }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 8 }}>
      <h3 style={{ margin: 0 }}>當日排程摘要（{queriedDate}）</h3>
    </div>

    {/*功率相關 */}
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontWeight: 700, opacity: .85, marginBottom: 6 }}>使用情況 (kW)</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}
      >
        <SummaryCard label="簽約容量" value={fmtInt(summary.signedContractCapacity)} unit="kW" />
        <SummaryCard label="當日動態最高需量" value={fmtNum2(summary.contractPeak)} unit="kW" />
        <SummaryCard label="當日電網取用累加" value={fmtNum2(summary.contractValue * 0.25)} unit="度" />
      </div>
    </div>

    {/*成本相關*/}
    <div>
      <div style={{ fontWeight: 700, opacity: .85, marginBottom: 6 }}>費用 (元)</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}
      >
        <SummaryCard label="未經調度電費成本" value={fmtMoney(summary.undispatchedCost)} unit="元" />
        <SummaryCard label="每日基本費 (/30天)" value={fmtMoney(summary.averageContractFee)} unit="元" />
        <SummaryCard label="每日流動電費" value={fmtMoney(summary.dailyGridCost)} unit="元" />
        <SummaryCard label="超約罰鍰" value={fmtMoney(summary.exceedPenalty)} unit="元" />
        <SummaryCard label="每日總成本" value={fmtMoney(summary.totalCostPerDay)} unit="元" />
      </div>
    </div>
  </Surface>
)}



      {/*條件篩選（Chip 展開 + 欄位highlight）*/}
      <Surface style={{ marginTop: 12 }}>
        <h3 style={{ marginTop: 0 }}>條件篩選（時間區間與圖表一致）</h3>

        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
          <Chip on={gridOpen} label="電網取用 (kW)" onToggle={()=> setGridOpen(v=>!v)}>
            <RangeRow
              gt={gridMinInput} lt={gridMaxInput}
              onGt={e=> setGridMinInput(e.target.value)}
              onLt={e=> setGridMaxInput(e.target.value)}
            />
          </Chip>
          <Chip on={loadOpen} label="所需總負載 (kW)" onToggle={()=> setLoadOpen(v=>!v)}>
            <RangeRow
              gt={loadMinInput} lt={loadMaxInput}
              onGt={e=> setLoadMinInput(e.target.value)}
              onLt={e=> setLoadMaxInput(e.target.value)}
            />
          </Chip>
          <Chip on={socOpen} label="電量 SOC (%)" onToggle={()=> setSocOpen(v=>!v)}>
            <RangeRow
              gt={socMinInput} lt={socMaxInput}
              onGt={e=> setSocMinInput(e.target.value)}
              onLt={e=> setSocMaxInput(e.target.value)}
            />
          </Chip>
          <Chip on={chgOpen} label="充電 (kW)" onToggle={()=> setChgOpen(v=>!v)}>
            <RangeRow
              gt={chargeMinInput} lt={chargeMaxInput}
              onGt={e=> setChargeMinInput(e.target.value)}
              onLt={e=> setChargeMaxInput(e.target.value)}
            />
          </Chip>
          <Chip on={disOpen} label="放電 (kW)" onToggle={()=> setDisOpen(v=>!v)}>
            <RangeRow
              gt={dischargeMinInput} lt={dischargeMaxInput}
              onGt={e=> setDischargeMinInput(e.target.value)}
              onLt={e=> setDischargeMaxInput(e.target.value)}
            />
          </Chip>

          <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
            <select value={combineMode} onChange={e=> setCombineMode(e.target.value)} style={selStyle}>
              <option value="AND">AND（全部符合）</option>
              <option value="OR">OR（其一符合）</option>
            </select>
            <select value={sortField} onChange={e=> setSortField(e.target.value)} style={selStyle}>
              <option value="createdAt">時間</option>
              <option value="soc">電量</option>
              <option value="grid">電網取用量</option>
              <option value="load">實際使用負載</option>
              <option value="charge">充電量</option>
              <option value="discharge">放電量</option>
            </select>
            <select value={sortDirection} onChange={e=> setSortDirection(e.target.value)} style={selStyle}>
              <option value="ASC">由小到大</option>
              <option value="DESC">由大到小</option>
            </select>
            <select value={pageSize} onChange={e=> setPageSize(Number(e.target.value))} style={selStyle}>
              {[50,40,30,20,10].map(v=> <option key={v} value={v}>{v} /頁</option>)}
            </select>

            <button onClick={()=> { setPage(0); runConditionQuery(0); }} disabled={qLoading} style={btnPrimary}>
              {qLoading ? '查詢中…' : '查詢條件資料'}
            </button>
            <button
              onClick={()=> {
                setGridOpen(false); setLoadOpen(false); setSocOpen(false); setChgOpen(false); setDisOpen(false);
                setGridMinInput(''); setGridMaxInput(''); setLoadMinInput(''); setLoadMaxInput('');
                setSocMinInput(''); setSocMaxInput(''); setChargeMinInput(''); setChargeMaxInput('');
                setDischargeMinInput(''); setDischargeMaxInput('');
                setGridMin(''); setGridMax(''); setLoadMin(''); setLoadMax(''); setSocMin(''); setSocMax('');
                setChargeMin(''); setChargeMax(''); setDischargeMin(''); setDischargeMax('');
                setRows([]); setTotalElements(0); setTotalPages(0); setPage(0);
              }}
              style={btnGhost}
            >清空條件</button>
          </div>
        </div>
      </Surface>

      <Card title="條件查詢之結果" style={{ marginTop: 12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ opacity:.85 }}>
            查詢筆數：共 {totalElements.toLocaleString()} 筆（第 {totalElements ? page+1 : 0} 頁 / {totalPages} 頁）
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <button disabled={qLoading || page<=0} onClick={()=> runConditionQuery(page-1)} style={btnGhost}>上一頁</button>
            <button disabled={qLoading || (page+1)>=totalPages} onClick={()=> runConditionQuery(page+1)} style={btnGhost}>下一頁</button>
            {/*匯出 CSV 綠色按鈕 */}
            <button onClick={exportCsv} style={btnSuccess}>匯出 .CSV</button>
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>時間</th>
                <th style={gridOpen ? {...thStyle, ...highlightTh} : thStyle}>電網取用(kW)</th>
                <th style={chgOpen  ? {...thStyle, ...highlightTh} : thStyle}>充電(kW)</th>
                <th style={disOpen  ? {...thStyle, ...highlightTh} : thStyle}>放電(kW)</th>
                <th style={socOpen  ? {...thStyle, ...highlightTh} : thStyle}>電量(%)</th>
                <th style={loadOpen ? {...thStyle, ...highlightTh} : thStyle}>所需總負載(kW)</th>
                <th style={thStyle}>裝置</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:14, color:THEME.text.secondary, textAlign:'center' }}>無資料</td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} style={{ borderTop: THEME.border }}>
                  <td style={tdStyle}>{r?.createdAt ?? r?.time ?? '—'}</td>
                  <td style={tdStyle}>{fmt(r?.grid)}</td>
                  <td style={tdStyle}>{fmt(r?.charge)}</td>
                  <td style={tdStyle}>{fmt(r?.discharge)}</td>
                  <td style={tdStyle}>{fmt(r?.soc)}</td>
                  <td style={tdStyle}>{fmt(r?.load)}</td>
                  <td style={tdStyle}>{r?.device ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

//utils
function fmt(n){ return typeof n === 'number' ? (Number.isInteger(n) ? n : n.toFixed(1)) : (n ?? '—'); }


function dayToUtcIsoRange(ymd /* 'YYYY-MM-DD' */){
  const start = new Date(`${ymd}T00:00:00`);           
  const end   = new Date(`${ymd}T23:59:59.999`);       
  return { start: start.toISOString(), end: end.toISOString() };
}

/* --- Summary Stat Card --- */
function SummaryCard({ label, value, unit }) {
  const show = value !== null && value !== undefined && value !== 'N/A';
  const isPenalty = label.includes("超約罰鍰");  
  const isNonZero = show && Number(value) !== 0;

  return (
    <div style={{
      background: THEME.bg.glass,
      border: THEME.border,
      borderRadius: 12,
      padding: 12,
      minWidth: 160
    }}>
      <div style={{ fontSize: THEME.font.sm, color: THEME.text.secondary, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: (isPenalty && isNonZero) ? 'red' : THEME.text.primary //如果罰鍰且不為0就紅字
        }}
      >
        {show ? value : '—'}
        {show && unit ? <span style={{ fontSize: 12, opacity: .8, marginLeft: 6 }}>{unit}</span> : null}
      </div>
    </div>
  );
}


//format helpers
function fmtInt(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return null;
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
}
function fmtMoney(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  return n.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtNum2(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  if (!isFinite(n)) return null;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
function minutesFromStartOfDay(labelStr, ymd) {
  const d = new Date(labelStr);
  if (isNaN(d)) return null;
  const start = new Date(`${ymd}T00:00:00`);
  return Math.floor((d.getTime() - start.getTime()) / 60000);
}
const isHighTOU = (v) => Number(v) === 5.78;

export default ScheduleResult;

