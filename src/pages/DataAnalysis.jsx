//資料分析頁面
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/dark.css";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { THEME } from "@/ui/theme";
import { BASE_URL } from "@/config.js";

//小元件
function Card({ title, subtitle, children, style }) {
  return (
    <div
      style={{
        background: THEME.bg.surface,
        border: THEME.border,
        borderRadius: THEME.radius,
        boxShadow: THEME.shadow,
        padding: 16,
        color: THEME.text.primary,
        ...style
      }}
    >
      {(title || subtitle) && (
        <div style={{ marginBottom: 10 }}>
          {title && <div style={{ fontSize: THEME.font.lg, fontWeight: 700 }}>{title}</div>}
          {subtitle && <div style={{ opacity: .7, fontSize: THEME.font.sm }}>{subtitle}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function Stat({ label, value, unit, delta }) {
  const v = (value ?? value === 0) ? value : null;
  const pos = delta != null && Number(delta) > 0;
  const neg = delta != null && Number(delta) < 0;
  return (
    <div style={{
      background: THEME.bg.glass,
      border: THEME.border,
      borderRadius: 12,
      padding: 12,
      minWidth: 140
    }}>
      <div style={{ fontSize: THEME.font.sm, color: THEME.text.secondary, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>
        {v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: 1 }) }
        {unit ? <span style={{ fontSize: 12, opacity: .8, marginLeft: 6 }}>{unit}</span> : null}
      </div>
      {delta != null && (
        <div style={{
          marginTop: 4,
          fontSize: THEME.font.sm,
          color: pos ? THEME.brand.ok : (neg ? THEME.brand.danger : THEME.text.muteds)
        }}>
          {pos ? "▲" : (neg ? "▼" : "—")} {Math.abs(Number(delta)).toFixed(1)}%
        </div>
      )}
    </div>
  );
}
function formatCurrency(v, withUnit = true) {
  if (v == null || isNaN(v)) return "—";
  return (
    v.toLocaleString("zh-TW", { maximumFractionDigits: 0 }) +
    (withUnit ? " NT$" : "")
  );
}
const dateInputStyle = {
  background: "#14171c",
  color: THEME.text.secondary,
  border: THEME.border,
  borderRadius: 10,
  padding: "8px 12px",
  width: 180
};
const btnSuccess = {
  background: '#126e34ff', color: '#ffffffff', border: 'none', borderRadius: 10,
  padding: '8px 12px', fontWeight: 800, boxShadow: THEME.shadow, cursor: 'pointer'
};


//主頁面（互動圖+PDF匯出）
export default function DataAnalysis() {
  const [startDate, setStartDate] = useState(dayjs('2022-12-01').toDate());
  const [endDate, setEndDate]     = useState(dayjs('2022-12-08').toDate());

  const start = useMemo(() => dayjs(startDate).format("YYYY-MM-DD"), [startDate]);
  const end   = useMemo(() => dayjs(endDate).format("YYYY-MM-DD"),   [endDate]);

  //若開始>結束自動糾正
  useEffect(() => {
    if (dayjs(startDate).isAfter(endDate)) setEndDate(startDate);
  }, [startDate, endDate]);

  const qs = useMemo(() => new URLSearchParams({ start, end }).toString(), [start, end]);

  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [data, setData] = useState(null); 
  

//條件篩選狀態
const [combineMode, setCombineMode]   = useState('AND');
const [sortField, setSortField]       = useState('createdAt'); 
const [sortDirection, setSortDirection] = useState('ASC');
const [pageSize, setPageSize]         = useState(10);
const [page, setPage]                 = useState(0);

const [totalElements, setTotalElements] = useState(0);
const [totalPages, setTotalPages]       = useState(0);
const [rows, setRows]                   = useState([]);
const [qLoading, setQLoading]           = useState(false);

const [gridOpen, setGridOpen] = useState(false);
const [loadOpen, setLoadOpen] = useState(false);
const [socOpen,  setSocOpen]  = useState(false);
const [chgOpen,  setChgOpen]  = useState(false);
const [disOpen,  setDisOpen]  = useState(false);

//門檻輸入值（字串）
const [gridMinInput, setGridMinInput] = useState(''); const [gridMaxInput, setGridMaxInput] = useState('');
const [loadMinInput, setLoadMinInput] = useState(''); const [loadMaxInput, setLoadMaxInput] = useState('');
const [socMinInput,  setSocMinInput]  = useState(''); const [socMaxInput,  setSocMaxInput]  = useState('');
const [chargeMinInput, setChargeMinInput] = useState(''); const [chargeMaxInput, setChargeMaxInput] = useState('');
const [dischargeMinInput, setDischargeMinInput] = useState(''); const [dischargeMaxInput, setDischargeMaxInput] = useState('');

const [gridMin, setGridMin] = useState('');   const [gridMax, setGridMax] = useState('');
const [loadMin, setLoadMin] = useState('');   const [loadMax, setLoadMax] = useState('');
const [socMin, setSocMin]   = useState('');   const [socMax, setSocMax]   = useState('');
const [chargeMin, setChargeMin] = useState(''); const [chargeMax, setChargeMax] = useState('');
const [dischargeMin, setDischargeMin] = useState(''); const [dischargeMax, setDischargeMax] = useState('');


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
  
  const totalSaved = useMemo(() => {
  const bars = data?.bars || [];
  return bars.reduce((s, d) => s + Math.max(0, (d.unscheduled ?? 0) - (d.scheduled ?? 0)), 0);
}, [data]);

const hasHeadroom = useMemo(
  () => !!(data?.headroom && (data.headroom.p95 ?? 0) > 0),
  [data]
);

  //取資料
  //抓取分析總覽資料並更新狀態
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/analysis/overview?${qs}`);
        if (!res.ok) throw new Error(`analysis ${res.status}`);
        const json = await res.json();
        if (alive) setData(json);
      } catch (e) {
        console.error(e);
        console.log("讀取資料失敗");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [qs]);

  //PDF匯出
  //下載PDF報告與錯誤處理
  async function downloadReport() {
    try {
      setPdfLoading(true);
      const res = await fetch(`${BASE_URL}/api/report/pdf?${qs}`, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
      }
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (!ct.includes("application/pdf")) {
        const text = await res.text().catch(() => "");
        throw new Error(`Unexpected content-type: ${ct}\n${text}`);
      }
      const blob = await res.blob();
      if (blob.size < 1024) {
        const text = await blob.text().catch(() => "");
        throw new Error(`PDF too small (${blob.size} bytes). Response:\n${text}`);
      }
      const cd = res.headers.get("content-disposition") || "";
      const fname = (cd.match(/filename\*?=([^;]+)/i)?.[1] || "")
        .replace(/^UTF-8''/i, "")
        .replace(/(^"|"$)/g, "") || `BESS-Report_${start}_to_${end}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = decodeURIComponent(fname);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(`下載失敗：${err.message}`);
    } finally {
      setPdfLoading(false);
    }
  }

//組合條件參數與分頁排序
function buildConditionParams_DataAnalysis(goPage = 0, sizeOverride) {
  const p = new URLSearchParams();

  //區間
  const { startIso, endIso } = dayRangeToUtcIso(start, end);
  p.set('startTime', startIso);
  p.set('endTime',   endIso);

  //AND/OR、排序、分頁
  p.set('combineMode',   combineMode);
  p.set('page',          String(goPage));
  p.set('size',          String(sizeOverride ?? pageSize));
  p.set('sortField',     sortField);
  p.set('sortDirection', sortDirection);

  //只有chip展開且有值才帶參數
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


//執行條件查詢並處理分頁與錯誤
async function runConditionQuery(goPage = 0) {
  setQLoading(true);

  try {
    const p = new URLSearchParams();

    //時間區間
    const { startIso, endIso } = dayRangeToUtcIso(start, end);
    p.set("startTime", startIso);
    p.set("endTime",   endIso);

    //組合&分頁
    p.set("combineMode", combineMode);       
    p.set("page",        String(goPage));    
    p.set("size",        String(pageSize));

    //排序
    p.set("sortField",   sortField);         
    p.set('sortDirection', sortDirection);     

    //小工具
    const addRange = (open, minStr, maxStr, key) => {
      if (!open) return;
      const gt = (minStr ?? "").trim();
      const lt = (maxStr ?? "").trim();
      if (gt !== "") p.set(`${key}GreaterThan`, gt);
      if (lt !== "") p.set(`${key}LessThan`, lt);
    };

    addRange(gridOpen, gridMinInput, gridMaxInput, "grid");
    addRange(loadOpen, loadMinInput, loadMaxInput, "load");
    addRange(socOpen,  socMinInput,  socMaxInput,  "soc");
    addRange(chgOpen,  chargeMinInput, chargeMaxInput, "charge");
    addRange(disOpen,  dischargeMinInput, dischargeMaxInput, "discharge");

    //呼叫API
    const url = `${BASE_URL}/api/command/history?${p.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`/api/command/history ${res.status}`);

    const json = await res.json();
    setRows(json?.content ?? []);
    setTotalElements(json?.totalElements ?? 0);
    setTotalPages(json?.totalPages ?? 0);
    setPage(json?.number ?? goPage);
  } catch (err) {
    console.error("條件查詢失敗", err);
    setRows([]);
    setTotalElements(0);
    setTotalPages(0);
    alert("條件查詢失敗");
  } finally {
    setQLoading(false);
  }
}


  //成本比較圖表配置與提示內容
  const optBarDaily = useMemo(() => {
  const bars = data?.bars || [];
  const x = bars.map(d => d.date);
  const scheduled = bars.map(d => d.scheduled);
  const saved = bars.map(d => Math.max(0, (d.unscheduled ?? 0) - (d.scheduled ?? 0)));


  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params) => {
        const map = Object.fromEntries(params.map(p => [p.seriesName, p.value]));
        const uns = (map["排程後"] ?? 0) + (map["節省額"] ?? 0);
        return [
          params?.[0]?.axisValue,
          `未排程：${formatCurrency(uns)}`,
          `排程後：${formatCurrency(map["排程後"])}`,
          `節省額：${formatCurrency(map["節省額"])}`
        ].join("<br/>");
      }
    },
    legend: { textStyle: { color: THEME.text.secondary } },
    grid: { left: 70, right: 20, top: 40, bottom: 60 },
    xAxis: { type: "category", data: x, axisLabel: { color: THEME.text.secondary, rotate: 45 } },
    yAxis: { type: "value", axisLabel: { color: THEME.text.secondary, formatter: v => formatCurrency(v, false) } },
    series: [
      { name: "排程後", type: "bar", stack: "cost", data: scheduled, itemStyle: { color: "#3b82f6" }, barMaxWidth: 28 },
      { name: "節省額", type: "bar", stack: "cost", data: saved, itemStyle: { color: "#10b981" }, barMaxWidth: 28 },
      { name: "節省額", type: "line", data: saved, smooth: true, symbol: "circle", symbolSize: 6,
        itemStyle: { color: "#fbbf24" } }
    ]
  };
}, [data]);


//負載平均與區間帶圖表
const optLoadBand = useMemo(() => {
  const arr   = data?.loadBand || [];
  const t     = arr.map(d => d.time);
  const hasCI = arr.length && (typeof arr[0]?.ci === 'number');

  const mean  = arr.map(d => (d.mean ?? d.avg ?? 0));
  const lower = hasCI ? arr.map(d => (d.mean ?? d.avg ?? 0) - (d.ci ?? 0))
                      : arr.map(d => d.min ?? 0);
  const band  = hasCI ? arr.map(d => 2 * (d.ci ?? 0))
                      : arr.map(d => Math.max(0, (d.max ?? 0) - (d.min ?? 0)));
  const nArr  = arr.map(d => d.n ?? null);   //樣本數

  return {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      formatter: (ps) => {
        const idx = ps?.[0]?.dataIndex ?? 0;
        const by  = Object.fromEntries(ps.map(p => [p.seriesName, p.data]));
        const lo  = by["lower"], rng = by["band"], hi = (lo != null && rng != null) ? (lo + rng) : undefined;
        const lines = [
          ps?.[0]?.axisValue,
          `樣本數 n：${nArr[idx] ?? "—"} 筆`,
          `mean：${num(by["mean"]) } kW`
        ];
        if (hasCI) lines.push(`95% CI：[${num(lo)} , ${num(hi)}]`);
        else       lines.push(`min：${num(lo)} kW`, `max：${num(hi)} kW`);
        return lines.join("<br/>");
      }
    },
    legend: { textStyle: { color: THEME.text.secondary } },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: { type: "category", data: t, axisLabel: { color: THEME.text.secondary } },
    yAxis: { type: "value", name: "kW", axisLabel: { color: THEME.text.secondary },
             splitLine: { lineStyle: { color: THEME.brand.line } } },
    series: [
      { name: "lower", type: "line", data: lower, showSymbol: false, lineStyle: { width: 0 }, stack: "band" },
      { name: "band",  type: "line", data: band,  showSymbol: false, lineStyle: { width: 0 }, areaStyle: { opacity: .28 }, stack: "band" },
      { name: "mean",  type: "line", data: mean,  smooth: true, showSymbol: false }
    ]
  };
}, [data]);

//生成SOC平均與區間帶圖表
const optSocBand = useMemo(() => {
  const arr   = data?.socBand || [];
  const t     = arr.map(d => d.time);
  const hasCI = arr.length && (typeof arr[0]?.ci === 'number');

  const mean  = arr.map(d => (d.mean ?? d.avg ?? 0));
  const lower = hasCI ? arr.map(d => (d.mean ?? d.avg ?? 0) - (d.ci ?? 0))
                      : arr.map(d => d.min ?? 0);
  const band  = hasCI ? arr.map(d => 2 * (d.ci ?? 0))
                      : arr.map(d => Math.max(0, (d.max ?? 0) - (d.min ?? 0)));
  const nArr  = arr.map(d => d.n ?? null);   

  return {
    tooltip: {
      trigger: "axis",
      formatter: (ps) => {
        const idx = ps?.[0]?.dataIndex ?? 0;
        const by  = Object.fromEntries(ps.map(p => [p.seriesName, p.data]));
        const lo  = by["lower"], rng = by["band"], hi = (lo != null && rng != null) ? (lo + rng) : undefined;
        const lines = [
          ps?.[0]?.axisValue,
          `樣本數 n：${nArr[idx] ?? "—"} 筆`,
          `mean：${num(by["mean"]) } %`
        ];
        if (hasCI) lines.push(`95% CI：[${num(lo)} , ${num(hi)}]`);
        else       lines.push(`min：${num(lo)} %`, `max：${num(hi)} %`);
        return lines.join("<br/>");
      }
    },
    legend: { textStyle: { color: THEME.text.secondary } },
    grid: { left: 60, right: 20, top: 40, bottom: 40 },
    xAxis: { type: "category", data: t, axisLabel: { color: THEME.text.secondary } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: THEME.text.secondary },
             splitLine: { lineStyle: { color: THEME.brand.line } } },
    series: [
      { name: "lower", type: "line", data: lower, showSymbol: false, lineStyle: { width: 0 }, stack: "band" },
      { name: "band",  type: "line", data: band,  showSymbol: false, lineStyle: { width: 0 }, areaStyle: { opacity: .28 }, stack: "band" },
      { name: "mean",  type: "line", data: mean,  smooth: true, showSymbol: false, itemStyle: { color: "#fbbf24" } }
    ]
  };
}, [data]);


//匯出條件查詢結果為CSV檔案
async function exportCsv_DataAnalysis() {
  try {
    //先拿到總頁數&第一頁資料
    const p0 = buildConditionParams_DataAnalysis(0);
    const res0 = await fetch(`${BASE_URL}/api/command/history?${p0.toString()}`);
    if (!res0.ok) throw new Error(`/api/command/history ${res0.status}`);
    const j0 = await res0.json();

    const totalPagesLocal = j0?.totalPages ?? 0;
    const all = [...(j0?.content ?? [])];

    //從第2頁開始抓到最後一頁（條件、排序完全相同）
    for (let i = 1; i < totalPagesLocal; i++) {
      const pi = buildConditionParams_DataAnalysis(i);
      const ri = await fetch(`${BASE_URL}/api/command/history?${pi.toString()}`);
      if (!ri.ok) break;
      const ji = await ri.json();
      if (ji?.content) all.push(...ji.content);
    }

    if (!all.length) {
      alert('沒有可匯出的資料');
      return;
    }

    //轉CSV
    const headers = ['時間','電網取用(kW)','充電(kW)','放電(kW)','電量(%)','所需總負載(kW)','裝置'];
    const lines = [headers.join(',')];

    const esc = (v) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
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

    const ymd = `${start}_to_${end}`;
    const csv = '\uFEFF' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_condition_period_result_${ymd}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('匯出失敗', err);
    alert(`匯出失敗：${err.message}`);
  }
}

  return (
    <div style={{ padding: 16, background: THEME.bg.canvas, minHeight: "100vh", color: THEME.text.primary }}>
      {/*Header：日期+PDF匯出*/}
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, fontSize: THEME.font.xl }}>資料分析 (區間查詢)</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: THEME.font.sm, opacity: .85 }}>開始日</span>
            <Flatpickr
              options={{ mode: "single", dateFormat: "Y-m-d", allowInput: true, maxDate: end }}
              value={startDate}
              onChange={(dates) => setStartDate(dates?.[0] ?? startDate)}
              render={(_, ref) => (
                <input ref={ref} style={dateInputStyle} placeholder="開始日期" />
              )}
            />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: THEME.font.sm, opacity: .85 }}>結束日</span>
            <Flatpickr
              options={{ mode: "single", dateFormat: "Y-m-d", allowInput: true, minDate: start }}
              value={endDate}
              onChange={(dates) => setEndDate(dates?.[0] ?? endDate)}
              render={(_, ref) => (
              <input ref={ref} style={dateInputStyle} placeholder="結束日期" />
            )}
            />
          </div>

         <div style={{ display: "flex", gap: 8, alignItems: "center",fontFamily: THEME.font.family}}>
                  <button
                    onClick={() => { /*重新抓資料 可以直接重跑setStartDate/endDate或觸發useEffect*/ }}
                    style={{
                      background: "#3b82f6",   
                      color: "white",
                      padding: "8px 14px",
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize:'0.75rem',
                      border: "none",
                      boxShadow: THEME.shadow,
                      cursor: "pointer"
                    }}
                  >
                    查詢
                  </button>

                  <button
                    onClick={downloadReport}
                    disabled={pdfLoading}
                    style={{
                      background: "#facc15",   
                      color: "#0b1220",
                      padding: "8px 14px",
                      borderRadius: 10,
                      fontWeight: 700,
                      border: "none",
                      fontSize:'0.75rem',
                      boxShadow: THEME.shadow,
                      opacity: pdfLoading ? .7 : 1,
                      cursor: pdfLoading ? "not-allowed" : "pointer"
                    }}
                  >
                    {pdfLoading ? "產生中…" : "輸出報表（PDF）"}
                  </button>
                </div>
                        </div>
      </Card>

{/*第一行金額*/}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginTop: 12 }}>
          <Card title="有 / 無排程成本比較（逐日）">
            {loading ? <div>載入中…</div> : (
              <>
                <ReactECharts style={{ height: 360 }} option={optBarDaily} echarts={echarts} notMerge />
                <div style={{ marginTop: 18, fontSize: '1rem', fontWeight: 600, color: THEME.text.secondary }}>
                  此區間段累計節省金額 (針對流動電費節省)：{formatCurrency(totalSaved)} 
                </div>
              </>
            )}
          </Card>
        </div>
{/*第二行Load/SOC帶狀*/}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <Card title="超約風險（Headroom）">
                {loading ? <div>載入中…</div> : (
                  <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                        gap: 12
                      }}>
                        <Stat label="Contract" value={data?.headroom?.contract} unit="kW" />
                        <Stat label="期間最大需量" value={data?.headroom?.max} unit="kW" />
                    <Stat
                      label="距95%契約容量剩餘"
                      value={(data?.headroom?.contract ?? 0) - (data?.headroom?.p95 ?? 0)}
                      unit="kW"
                    />
                  </div>
                )}
              </Card>
          <Card title="電池健康 / 循環">
              {loading ? <div>載入中…</div> : (
                <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
                        gap: 12
                      }}>
                  <Stat label="平均放電深度(DoD)" value={toNumOrNull(data?.health?.avgDoD)} unit="%" />
                  <Stat label="最大放電深度(DoD)" value={toNumOrNull(data?.health?.maxDoD)} unit="%" />
                  <Stat label="完整放電次數" value={toNumOrNull(data?.health?.efcByEnergy, 0)} />

                </div>
              )}
            </Card>
          <Card title="Load  帶狀分佈  (採自信區間)">
            {loading ? <div>載入中…</div> : <ReactECharts style={{ height: 320 }} option={optLoadBand} echarts={echarts} notMerge />}
          </Card>
          <Card title="SOC  帶狀分佈  (採自信區間)">
            {loading ? <div>載入中…</div> : <ReactECharts style={{ height: 320 }} option={optSocBand} echarts={echarts} notMerge />}
          </Card>
          
        </div>
        <Card title="條件篩選（可選）" subtitle="只對*匯出.csv*生效；不會變動上方圖表" style={{ marginTop: 12 }}>
  <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
    {/*Chip：點了才展開門檻*/}
    <Chip on={gridOpen} label="電網取用 (kW)" onToggle={()=> setGridOpen(v=>!v)}>
      <RangeRow gt={gridMinInput} lt={gridMaxInput}
                onGt={e=> setGridMinInput(e.target.value)}
                onLt={e=> setGridMaxInput(e.target.value)} />
    </Chip>
    <Chip on={loadOpen} label="所需總負載 (kW)" onToggle={()=> setLoadOpen(v=>!v)}>
      <RangeRow gt={loadMinInput} lt={loadMaxInput}
                onGt={e=> setLoadMinInput(e.target.value)}
                onLt={e=> setLoadMaxInput(e.target.value)} />
    </Chip>
    <Chip on={socOpen}  label="電量 SOC (%)" onToggle={()=> setSocOpen(v=>!v)}>
      <RangeRow gt={socMinInput} lt={socMaxInput}
                onGt={e=> setSocMinInput(e.target.value)}
                onLt={e=> setSocMaxInput(e.target.value)} />
    </Chip>
    <Chip on={chgOpen}  label="充電 (kW)" onToggle={()=> setChgOpen(v=>!v)}>
      <RangeRow gt={chargeMinInput} lt={chargeMaxInput}
                onGt={e=> setChargeMinInput(e.target.value)}
                onLt={e=> setChargeMaxInput(e.target.value)} />
    </Chip>
    <Chip on={disOpen}  label="放電 (kW)" onToggle={()=> setDisOpen(v=>!v)}>
      <RangeRow gt={dischargeMinInput} lt={dischargeMaxInput}
                onGt={e=> setDischargeMinInput(e.target.value)}
                onLt={e=> setDischargeMaxInput(e.target.value)} />
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
        {[50,40,30,20,10].map(v=> <option key={v} value={v}>{v} 筆 / 頁</option>)}
      </select>

      <button onClick={()=> { setPage(0); runConditionQuery(0); }} disabled={qLoading} style={btnPrimary}>
        {qLoading ? "查詢中…" : "查詢條件資料"}
      </button>
      <button onClick={()=> {
        //清空
        setGridOpen(false); setLoadOpen(false); setSocOpen(false); setChgOpen(false); setDisOpen(false);
        setGridMinInput(''); setGridMaxInput(''); setLoadMinInput(''); setLoadMaxInput('');
        setSocMinInput(''); setSocMaxInput(''); setChargeMinInput(''); setChargeMaxInput('');
        setDischargeMinInput(''); setDischargeMaxInput('');
        setGridMin(''); setGridMax(''); setLoadMin(''); setLoadMax(''); setSocMin(''); setSocMax('');
        setChargeMin(''); setChargeMax(''); setDischargeMin(''); setDischargeMax('');
        setRows([]); setTotalElements(0); setTotalPages(0); setPage(0);
      }} style={btnGhost}>清空條件</button>
    </div>
  </div>
</Card>
        {/*結果表格*/}
<Card title="條件查詢之結果" style={{ marginTop: 12 }}>
  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
    <div style={{ opacity:.85, fontSize: THEME.font.sm }}>
      查詢筆數：共 {totalElements.toLocaleString()} 筆（第 {totalElements ? page+1 : 0} 頁 / {totalPages} 頁）
    </div>
    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
      {/*匯出CSV*/}
      <button disabled={qLoading || page<=0} onClick={()=> runConditionQuery(page-1)} style={btnGhost}>上一頁</button>
      <button disabled={qLoading || (page+1)>=totalPages} onClick={()=> runConditionQuery(page+1)} style={btnGhost}>下一頁</button>
      <button onClick={exportCsv_DataAnalysis} style={btnSuccess}>匯出 .CSV</button>
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
            <td style={tdStyle}>{r?.createdAt ?? r?.time ?? "—"}</td>
            <td style={tdStyle}>{num(r?.grid)}</td>
            <td style={tdStyle}>{num(r?.charge)}</td>
            <td style={tdStyle}>{num(r?.discharge)}</td>
            <td style={tdStyle}>{num(r?.soc)}</td>
            <td style={tdStyle}>{num(r?.load)}</td>
            <td style={tdStyle}>{r?.device ?? "—"}</td>
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
function num(n){ return typeof n === "number" ? (Number.isInteger(n) ? n : n.toFixed(1)) : n ?? "—"; }

function toNumOrNull(x, digits = 1) {
  const n = Number(x);
  if (!isFinite(n)) return null;
  return Number.isInteger(n) ? n : Number(n.toFixed(digits));
}
function dayRangeToUtcIso(startYmd, endYmd) {
  const startLocal = new Date(`${startYmd}T00:00:00`);
  const endLocal   = new Date(`${endYmd}T23:59:59.999`);
  return { startIso: startLocal.toISOString(), endIso: endLocal.toISOString() };
}
//Chips&Inputs
const selStyle = {
  background: "#14171c", color: THEME.text.primary, border: THEME.border,
  borderRadius: 8, padding: "6px 8px"
};
const btnPrimary = {
  background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10,
  padding: "8px 12px", fontWeight: 700, boxShadow: THEME.shadow, cursor: "pointer"
};
const btnGhost = {
  background: "transparent", color: THEME.text.secondary, border: THEME.border,
  borderRadius: 10, padding: "8px 12px", fontWeight: 600, cursor: "pointer"
};
const thStyle = { textAlign: 'left', padding: '8px 10px', borderBottom: THEME.border, color: THEME.text.secondary, fontWeight: 700 };
const tdStyle = { padding: '8px 10px', color: THEME.text.primary };

const highlightTh = {
  background: "rgba(59,130,246,0.25)", 
  color: "#3b82f6",                    
  fontWeight: 800
};

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
