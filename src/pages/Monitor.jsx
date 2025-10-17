//即時監控畫面
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables, _adapters } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import zoomPlugin from 'chartjs-plugin-zoom';
import 'chartjs-adapter-luxon';

import { DateTime } from 'luxon';

ChartJS.register(...registerables);
ChartJS.register(annotationPlugin);
ChartJS.register(zoomPlugin);

//時間格式設定
_adapters._date.override(DateTime);

//套件與元件
import 'react-circular-progressbar/dist/styles.css';
import { BASE_URL } from '@/config.js';
import axiosWithAuth from '@/utils/axiosWithAuth';
import { Card } from '@/ui/Card';
import { Surface } from '@/ui/Surface';
import { THEME } from '@/ui/theme';
import { FlipClock } from "@/ui/FlipClock";
import { FlipText } from "@/ui/FlipText";
import { HourglassFlip } from "@/ui/HourglassFlip";
import { Metric } from '@/ui/Metric';
import StatusRow from '@/components/StatusCards.jsx';
import ExtraStatsRow from '@/components/ExtraStats.jsx';

function Monitor() {
  const [data, setData] = useState(null);
  const [recent, setRecent] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [prediction, setPrediction] = useState([]);
  const intervalRef = useRef(null);
  const chartRef = useRef(null);
  const [contractLimit, setContractLimit] = useState(null);
  const [monitoringDate, setMonitoringDate] = useState(null);
  const monitoringDateRef = useRef(null);
  const [chartSize, setChartSize] = useState(15);
  const chartSizeRef = useRef(chartSize);
  const [pressed, setPressed] = useState(false);
  const [predFilled, setPredFilled] = useState([]);
  const recentRef = useRef([]);
  const [maxIdx, setMaxIdx] = useState(null);
  const maxIdxRef = useRef(null);
  const persistedRef = useRef({ date: null, done: false });
  const SLOT_MINUTES = 15;
  const safeDate = monitoringDate ? DateTime.fromISO(monitoringDate) : null;
  const overLimitRanges = [];
  let start = null;

  //處理當日期改變時清空舊資料並抓新資料
  useEffect(() => {
    if (monitoringDate) {
      const updateData = async () => {
        setRecent([]);
        setPrediction([]);
        await fetchRecent(monitoringDate, chartSizeRef.current);
      };
      updateData();
    }
  }, [monitoringDate]);

  useEffect(() => {
    chartSizeRef.current = chartSize;
  }, [chartSize]);

  //在切換時間時立即重新拉資料
  useEffect(() => {
    if (monitoringDate) {
      fetchRecent(monitoringDate, chartSizeRef.current);
    }
  }, [chartSize]);

  //預測值補上時間軸 讓圖表能接在實際值後面
  useEffect(() => {
    if (!prediction.length || !monitoringDate || maxIdx == null) return;

    const interval = chartSizeRef.current;
    const baseTime = DateTime.fromISO(monitoringDate)
      .startOf('day')
      .plus({ minutes: maxIdx * interval });

    const filled = prediction.map((d, i) => ({
      ...d,
      load: d.value,
      createdAt: baseTime.plus({ minutes: i * interval }).toISO()
    }));

    setPredFilled(filled);
  }, [prediction, monitoringDate, maxIdx]);

  //用來查詢目前可用的最大預測
  const getMaxPredictionIdx = async (dateStr) => {
    try {
      const res = await axiosWithAuth().get(`/api/status/max-idx?date=${dateStr}`);
      const idx = typeof res.data === 'number' ? res.data : null;
      if (idx !== null) {
        setMaxIdx(idx);
        maxIdxRef.current = idx;
      }
      return idx;
    } catch (err) {
      console.error("取得最大預測失敗", err);
      return null;
    }
  };

  //抓最新狀態並推進當前監測日期以及必要的圖表資料
  const fetchLatest = async (size = chartSizeRef.current) => {
    try {
      const res = await axiosWithAuth().get('/api/status/latest');
      setData(res.data);

      const createdAtDate = DateTime.fromISO(res.data.createdAt).toFormat('yyyy-MM-dd');
      monitoringDateRef.current = createdAtDate;
      setMonitoringDate(createdAtDate);

      await fetchRecent(createdAtDate, size, maxIdx);
      await fetchSummary(createdAtDate);
    } catch (err) {
      console.error("最新資料抓取失敗", err);
    }
  };

  //抓每日summary以取得契約容量用於水平警示線
  const fetchSummary = async (date, sequence = 0) => {
    try {
      const res = await axiosWithAuth().get(`/api/schedule-summary/${date}`, {
        params: { sequence }
      });
      if (typeof res.data?.signedContractCapacity === 'number') {
        setContractLimit(res.data.signedContractCapacity);
      } else {
        setContractLimit(null);
      }
    } catch (err) {
      console.error('取得summary資料錯誤:', err);
      setContractLimit(null);
    }
  };

  const forceFetch = () => {
    const date = monitoringDateRef.current;
    const size = chartSizeRef.current;
    if (date) {
      fetchRecent(date, size);
    }
  };

  //指定日期的即時資料並依時間格填補缺值
  const fetchRecent = async (date, interval = chartSizeRef.current, maxIdx = null) => {
    try {
      const res = await axiosWithAuth().get(`/api/status/recent?date=${date}`);
      const rows = Array.isArray(res.data) ? res.data : [];

      const dayStart = DateTime.fromISO(date).startOf('day').setZone('Asia/Taipei');
      const binsCount = Math.ceil((24 * 60) / interval);

      const firstByIdx = new Map();
      for (const row of rows) {
        const idx = Number(row.sample_idx ?? row.sampleIdx ?? row.idx ?? row.sampleIndex);
        if (!Number.isFinite(idx)) continue;
        if (idx < 0 || idx >= binsCount) continue;

        const t = DateTime.fromISO(row.createdAt);
        const existed = firstByIdx.get(idx);
        if (!existed || t < DateTime.fromISO(existed.createdAt)) {
          firstByIdx.set(idx, row);
        }
      }

      const limit = typeof maxIdx === 'number' ? Math.min(binsCount, maxIdx + 1) : binsCount;

      const filled = [];
      for (let i = 0; i < limit; i++) {
        const r = firstByIdx.get(i);
        filled.push({
          createdAt: dayStart.plus({ minutes: i * interval }).toISO(),
          load: r?.load != null ? Number(r.load) : null,
          charge: r?.charge != null ? Number(r.charge) : null,
          discharge: r?.discharge != null ? Number(r.discharge) : null,
          soc: r?.soc != null ? Number(r.soc) : null,
          grid: r?.grid != null ? Number(r.grid) : null,
          tou: r?.tou != null ? Number(r.tou) : null,
        });
      }

      setRecent(filled);
      recentRef.current = filled;
    } catch (err) {
      console.error('趨勢資料抓取失敗', err);
    }
  };

  //抓預測資料並併入畫面顯示
  const fetchPrediction = async (Idx) => {
    const dateStr = monitoringDateRef.current;
    if (!dateStr) {
      console.warn("無 monitoringDateRef，取消預測請求");
      return;
    }

    try {
      const res = await axiosWithAuth().get(`/api/prediction/load/${Idx}?date=${dateStr}`);
      setPrediction(res.data);
      console.log(`fetchPrediction idx=${Idx}, date=${dateStr}`);
    } catch (err) {
      console.error('取得預測資料失敗', err);
    }
  };

  //自訂Chart 在圖上畫現在時間的垂直線與標籤
  const useNowLinePlugin = () => React.useMemo(() => ({
    id: 'nowLinePlugin',
    afterDatasetsDraw(chart, _args, opts) {
      const value = opts?.value;
      if (!value) return;
      const { ctx, chartArea, scales } = chart;
      const x = scales?.x?.getPixelForValue?.(value);
      if (!isFinite(x)) return;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.setLineDash(opts?.dash ?? [8, 6]);
      ctx.lineWidth = opts?.width ?? 3;
      ctx.strokeStyle = opts?.color ?? 'rgba(255,255,255,0.7)';
      ctx.stroke();

      const label = opts?.label;
      if (label?.text) {
        const padX = label.padX ?? 6;
        const padY = label.padY ?? 3;
        const fontSize = label.fontSize ?? 12;
        const fontWeight = label.fontWeight ?? 600;
        const fontFamily = label.fontFamily ?? 'Noto Sans TC, sans-serif';
        const offsetX = label.offsetX ?? 0;
        const offsetY = label.offsetY ?? 8;
        const radius = label.radius ?? 6;

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = label.text;
        const textW = ctx.measureText(text).width;
        const boxW = textW + padX * 2;
        const boxH = fontSize + padY * 2;
        const boxX = x - boxW / 2 + offsetX;
        const boxY = chartArea.top + offsetY;

        ctx.beginPath();
        const r = Math.min(radius, boxW / 2, boxH / 2);
        ctx.moveTo(boxX + r, boxY);
        ctx.arcTo(boxX + boxW, boxY, boxX + boxW, boxY + boxH, r);
        ctx.arcTo(boxX + boxW, boxY + boxH, boxX, boxY + boxH, r);
        ctx.arcTo(boxX, boxY + boxH, boxX, boxY, r);
        ctx.arcTo(boxX, boxY, boxX + boxW, boxY, r);
        ctx.closePath();
        ctx.fillStyle = label.backgroundColor ?? 'rgba(0,0,0,0.6)';
        ctx.fill();
        if (label.borderWidth) {
          ctx.lineWidth = label.borderWidth;
          ctx.strokeStyle = label.borderColor ?? 'rgba(255,255,255,0.25)';
          ctx.stroke();
        }

        ctx.fillStyle = label.textColor ?? '#fff';
        ctx.fillText(text, boxX + boxW / 2, boxY + boxH / 2);
      }

      ctx.restore();
    }
  }), []);

  const currentTimeLabel = React.useMemo(() => {
    if (!monitoringDate || maxIdx == null) return '—';
    const t = DateTime.fromISO(monitoringDate)
      .startOf('day')
      .plus({ minutes: (maxIdx) * SLOT_MINUTES });
    return t.toFormat('HH:mm');
  }, [monitoringDate, maxIdx, SLOT_MINUTES]);

  //整理高電價區段用來上色標示
  const touSegments = React.useMemo(() => {
    if (!Array.isArray(recent) || !recent.length || !safeDate) return [];
    const segs = [];
    const stepMin = SLOT_MINUTES;

    let runStart = null;

    for (let i = 0; i < recent.length; i++) {
      const r = recent[i];
      const rate = Number(r?.tou);
      const t = r?.createdAt ? DateTime.fromISO(r.createdAt) : null;
      if (!t?.isValid) continue;

      if (rate === 5.78) {
        if (runStart == null) runStart = t;
      } else {
        if (runStart) {
          segs.push({
            xMin: runStart.toISO(),
            xMax: t.plus({ minutes: 0 }).toISO(),
          });
          runStart = null;
        }
      }
    }

    if (runStart) {
      const last = DateTime.fromISO(recent[recent.length - 1]?.createdAt);
      if (last?.isValid) {
        segs.push({
          xMin: runStart.toISO(),
          xMax: last.plus({ minutes: stepMin }).toISO(),
        });
      }
    }
    return segs;
  }, [recent, SLOT_MINUTES, safeDate]);

  const actualData = (() => {
    const arr = recent.filter(d => d.load !== null);
    if (typeof maxIdx === 'number') {
      return arr.slice(0, maxIdx + 1);
    }
    return arr;
  })();

  const latest = actualData.length ? actualData[actualData.length - 1] : null;
  const socVal = latest?.soc ?? 0;
  const gridVal = latest?.grid ?? 0;
  const chargeVal = latest?.charge ?? 0;
  const dischargeVal = latest?.discharge ?? 0;
  const actual = Array.isArray(actualData) ? actualData : [];
  const predicted = Array.isArray(predFilled) ? predFilled : [];

  const labels = React.useMemo(() => {
    if (!safeDate) return [];
    return [
      ...actual.map(d => d.createdAt),
      ...predicted.map(d => d.createdAt),
    ];
  }, [safeDate, actual, predicted]);

  //組裝圖表資料集
  const chartData = React.useMemo(() => ({
    labels: labels,
    datasets: [
      {
        label: "Load_actual (kW)",
        data: [
          ...actualData.map(d => d.load),
          ...new Array(predFilled.length).fill(null),
        ],
        borderColor: "rgba(179, 98, 241, 1)",
        yAxisID: "y",
      },
      {
        label: "Load_prediction (kW)",
        data: [
          ...new Array(actualData.length).fill(null),
          ...predFilled.map(d => d.load),
        ],
        borderColor: "rgba(179, 98, 241, 1)",
        yAxisID: "y",
        borderDash: [5, 10],
      },
      {
        label: "Discharge (kW)",
        data: [
          ...actualData.map(d => d.discharge),
          ...new Array(predFilled.length).fill(null),
        ],
        borderColor: "red",
        yAxisID: "y",
      },
      {
        label: "Charge (kW)",
        data: [
          ...actualData.map(d => d.charge),
          ...new Array(predFilled.length).fill(null),
        ],
        borderColor: "rgba(36,255,18,1)",
        yAxisID: "y",
      },
      {
        label: "SOC (%)",
        data: [
          ...actualData.map(d => d.soc),
          ...new Array(predFilled.length).fill(null),
        ],
        borderColor: "orange",
        yAxisID: "y1",
      },
      {
        label: "Grid (kW)",
        data: [
          ...actualData.map(d => d.grid),
          ...new Array(predFilled.length).fill(null),
        ],
        borderColor: "aqua",
        yAxisID: "y",
      },
      {
        label: "Contract Limit",
        data: new Array(actualData.length + predFilled.length).fill(contractLimit ?? 0),
        borderColor: "rgba(255,255,255,0.85)",
        borderDash: [6, 6],
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        yAxisID: "y",
      },
    ]
  }), [labels, actual, predicted, contractLimit]);

  recent.forEach((d, i) => {
    if (d.grid > contractLimit) {
      if (start === null) {
        start = d.createdAt;
      }
    } else {
      if (start !== null) {
        overLimitRanges.push({ start, end: recent[i - 1].createdAt });
        start = null;
      }
    }
  });
  if (start !== null) {
    overLimitRanges.push({ start, end: recent[recent.length - 1].createdAt });
  }

  const nowLinePlugin = useNowLinePlugin();

  //設定圖表軸線網格圖例
  const chartOptions = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 150,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMin: 0,
        suggestedMax: 1400,
        title: { display: true, text: "Power (kW)", color: '#ccc' },
        ticks: { color: '#ccc' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y1: {
        beginAtZero: true,
        min: 0, max: 100,
        position: "right",
        title: { display: true, text: "SOC (%)", color: '#ccc' },
        ticks: { color: '#ccc' },
        grid: { drawOnChartArea: false }
      },
      x: {
        type: 'time',
        time: { unit: 'minute', displayFormats: { minute: 'HH:mm' } },
        min: safeDate ? safeDate.startOf('day').toISO() : undefined,
        max: safeDate ? safeDate.plus({ days: 1 }).startOf('day').toISO() : undefined,
        ticks: { color: '#ccc' },
        grid: { color: 'rgba(255, 255, 255, 0.07)' },
      }
    },
    plugins: {
      legend: {
        labels: { color: '#fff', font: { size: 13, family: 'Noto Sans TC' }, boxWidth: 20, boxHeight: 12 },
        position: 'top', align: 'center'
      },
      annotation: {
        annotations: touSegments.reduce((acc, seg, i) => {
          acc[`tou_hi_${i}`] = {
            type: 'box',
            xMin: seg.xMin,
            xMax: seg.xMax,
            yScaleID: 'y',
            yMin: 0,
            yMax: 1600,
            backgroundColor: 'rgba(239, 68, 68, 0.10)',
            borderWidth: 0,
            drawTime: 'beforeDatasetsDraw',
          };
          return acc;
        }, {})
      },
      nowLinePlugin: {
        value: safeDate && typeof maxIdx === 'number'
          ? safeDate.startOf('day').plus({ minutes: (maxIdx ?? 0) * SLOT_MINUTES }).toMillis()
          : undefined,
        color: 'rgba(255,255,255,0.7)',
        width: 4, dash: [8, 0],
        label: {
          text: '當前時間', offsetY: 6, padX: 6, padY: 3,
          fontSize: 14, fontWeight: 700,
          backgroundColor: 'rgba(0,0,0,0.6)', textColor: '#fff', radius: 6
        }
      }
    },
    elements: { point: { radius: 0 } },
    layout: { padding: { top: 28, right: 0 } }
  }), [safeDate, maxIdx, SLOT_MINUTES]);

  //負責啟動輪詢流程並同步實際與預測資料
  const startMonitoring = async () => {
    await fetchLatest(chartSizeRef.current);

    const date = monitoringDateRef.current;
    if (date) {
      const idx = await getMaxPredictionIdx(date);
      if (typeof idx === 'number') {
        maxIdxRef.current = idx;
        setMaxIdx(idx);
        await fetchPrediction(idx);
      }
    }

    forceFetch();

    intervalRef.current = setInterval(async () => {
      await fetchLatest(chartSizeRef.current);
      forceFetch();
      const d = monitoringDateRef.current;
      if (d) {
        const i = await getMaxPredictionIdx(d);
        if (typeof i === 'number') {
          maxIdxRef.current = i;
          setMaxIdx(i);
          await fetchPrediction(i);
        }
      }
    }, 3000);

    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    clearInterval(intervalRef.current);
    setIsMonitoring(false);
  };

  const toggleMonitoring = () => {
    isMonitoring ? stopMonitoring() : startMonitoring();
  };

  return (
    <div style={{
      padding: 8,
      display: 'grid',
      gap: '0.5rem' }}>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0,1fr))',
          gap: '0.5rem'
        }}
      >
        <Card title="契約容量" subtitle="Contract">
          <Metric
            value={typeof contractLimit === 'number' ? contractLimit : '—'}
            unit="kW"
            size={'1.5rem'}
          />
        </Card>

        <Card title="監測日期" subtitle="Date">
          <Metric value={monitoringDate ?? '載入中…'} size={'1.5rem'} />
        </Card>

        <Card title="當前監測時間" subtitle="Now">
          <div style={{
            height: 44,
            display: 'flex',
            alignItems: 'baseline',
            lineHeight: 1,
            fontFamily: THEME.font.mono,
            fontSize: '1.5rem',
            fontVariantNumeric: 'tabular-nums'
          }}>
            <Metric value={currentTimeLabel ?? '--:--'} size={'1.5rem'} />
          </div>
        </Card>

        <Card
          title="控制"
          subtitle="Monitoring"
          right={
            <button
              onClick={toggleMonitoring}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 0,
                fontWeight: 700,
                background: '#60A5FA',
                color: '#0F141B',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {isMonitoring ? '停止監測' : '啟動監測'}
            </button>
          }
        >
          <Metric
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>{isMonitoring ? '監測中' : '未啟動監測'}</span>
                {isMonitoring && <HourglassFlip size={'1.5rem'} color="#60A5FA" />}
              </div>
            }
            size={28}
          />
        </Card>
      </div>

      <Card title="當前監控" subtitle="kW / SOC">
        <div style={{ height: 400, minWidth: 0 }}>
          <div
            style={{
              height: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {safeDate && labels.length > 0 ? (
              <Line
                ref={chartRef}
                data={chartData}
                options={chartOptions}
                plugins={[nowLinePlugin]}
              />
            ) : (
              <div
                style={{
                  color: '#9AA4B2',
                  display: 'grid',
                  placeItems: 'center',
                  height: '100%',
                  fontSize: '1.5rem'
                }}
              >
                載入圖表資料中…
              </div>
            )}

            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                opacity: 0.95,
                pointerEvents: 'none'
              }}
            >
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

              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '1rem',
                  opacity: 0.85,
                  color: 'white'
                }}
              >
                當前時段：
                {typeof recent?.[Math.min(maxIdx ?? 0, recent.length - 1)]?.tou ===
                'number'
                  ? `NT$${Number(
                      recent[Math.min(maxIdx ?? 0, recent.length - 1)].tou
                    ).toFixed(2)}/kWh`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <StatusRow
        grid={gridVal}
        contractLimit={contractLimit}
        soc={socVal}
        charge={chargeVal}
        discharge={dischargeVal}
      />

      <ExtraStatsRow
        recent={actualData}
        predFilled={predFilled}
        contractLimit={contractLimit}
        SLOT_MINUTES={SLOT_MINUTES}
      />
    </div>
  );
}

export default Monitor;