import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import axiosWithAuth from "../utils/axiosWithAuth";
import { BASE_URL } from "../config";

export default function Dashboard({
  onNavigate = () => {},
  onQuickAction = () => {},
  username = "",
  theme,
}) {
  const navigate = useNavigate();
  const [recentReports, setRecentReports] = useState([]);

  const THEME_FALLBACK = {
    bg: { canvas: "#141A24", surface: "#343A46", tile: "rgba(255,255,255,.075)" },
    text: { primary: "#E6EBF2", secondary: "rgba(230,235,242,.86)" },
    brand: { ok: "#22C55E", warn: "#F59E0B", danger: "#EF4444", line: "rgba(255,255,255,.10)" },
    border: "1px solid rgba(255,255,255,.10)",
    radius: "16px",
    shadow: "0 10px 26px rgba(0,0,0,.32)",
  };
  const t = theme || THEME_FALLBACK;

  const css = `
  :root{
    --panel:${t.bg.surface};
    --text:${t.text.primary};
    --muted:${t.text.secondary};
    --accent:${t.brand.ok};
    --line:${t.brand.line};
    --card-radius:${t.radius};
    --tile-bg:${t.bg.tile || 'rgba(255,255,255,.07)'};
  }

  .wrap{ min-height:calc(100vh - 4rem); display:flex; justify-content:center; align-items:flex-start; background:${t.bg.canvas}; }
  .grid{ width:clamp(64rem, 92vw, 100rem); display:grid; gap:1rem; grid-template-columns: repeat(12, 1fr); }
  .card{ background:var(--panel); border:${t.border}; border-radius:var(--card-radius); box-shadow:${t.shadow}; color:var(--text); padding:1.2rem; }
  .title{ font-size:1.15rem; color:var(--muted); margin:0 0 .6rem 0; }

  .hero{ grid-column:1 / -1; padding:1.8rem; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03)); text-align:center; }
  .hello{ font-size:1.7rem; font-weight:800; letter-spacing:.3px; }
  .sub{ opacity:.9; font-size:1rem; color:var(--muted); }

  .col-12{ grid-column: span 12; }
  
  .tiles{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:1.2rem; align-items:stretch; }
  @media (max-width:900px){ .tiles{ grid-template-columns: 1fr; } }

  .tile{
    display:flex; gap:1rem; align-items:center;
    padding:1.2rem 1.3rem;
    border:1px solid var(--line);
    border-radius:18px;
    background:var(--tile-bg);
    cursor:pointer;
    transition:transform .08s ease, filter .12s ease;
    text-align:left;            
    width:100%;                 
  }
  .tile:hover{ filter:brightness(1.07); transform:translateY(-1px); }
  .tile:active{ transform:translateY(0); }
  .tile:focus{ outline:2px solid rgba(255,255,255,.18); outline-offset:2px; }

  .tile .icon{
    width:56px; height:56px; display:grid; place-items:center;
    border-radius:14px; font-weight:900;
    background:#60A5FA; color:#0F1922;   
    flex:0 0 56px;
  }

  .tile .text{ display:flex; flex-direction:column; gap:.1rem; min-width:0; }
  .tile .t{ font-weight:900; font-size:1.05rem; color:#E6EBF2; }
  .tile .d{ color:var(--muted); font-size:.98rem; }

  .list{ margin:0; padding:0; list-style:none; display:flex; flex-direction:column; gap:.6rem; }
  .item{ display:flex; justify-content:space-between; align-items:center; gap:.8rem; padding:.6rem .4rem; border-radius:.6rem; }
  .item:hover{ background:rgba(255,255,255,.04); }
  .btn{ padding:.65rem 1rem; border-radius:.8rem; border:1px solid var(--line); background:transparent; color:var(--text); cursor:pointer; }
  .btn.disabled{ opacity:.5; pointer-events:none; }
  .btn.primary{ background:var(--accent); border-color:transparent; color:#14202b; font-weight:800; }
  .muted{ color:var(--muted); font-size:.95rem; }

  .section-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:.4rem; }
  .right-muted{ color:var(--muted); font-size:.95rem; }
  .list a {
    color: #60A5FA;              
    text-decoration: none;
    font-weight: 600;
  }
  .list a:hover {
    color: #93C5FD;              
    text-decoration: underline;  
  }
  `;

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 5) return "夜深了 注意休息"; if (h < 11) return "早安"; if (h < 14) return "午安"; if (h < 18) return "下午好"; return "晚安";
  })();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axiosWithAuth().get('/api/report/history');
      if (Array.isArray(res.data)) {
        setRecentReports(res.data);
      }
    } catch (err) {
      console.error("無法取得報表歷史", err);
    }
  };

  const handleNav = (path) => {
    navigate(path);
  };

  const handleReDownload = (report) => {
    alert(`準備下載報表: ${report.name}`);
    navigate("/data-analysis"); 
  };

  // =================================================================
  // [修改重點] 讓版面永遠保持 5 行
  // =================================================================
  const MIN_ROWS = 6;
  
  // 計算需要補幾個空位
  const emptyCount = Math.max(0, MIN_ROWS - recentReports.length);
  
  // 產生空位陣列
  const placeholders = Array.from({ length: emptyCount }, (_, i) => ({
    id: `ph-${i}`,
    name: "—",
    period: "—",
    isPlaceholder: true // 標記為佔位符
  }));

  // 合併：真實資料 + 佔位符，並確保總數是 5 筆 (如果真實資料超過5筆就只顯示真實資料)
  const displayRows = [...recentReports, ...placeholders].slice(0, Math.max(recentReports.length, MIN_ROWS));
  // =================================================================

  return (
    <div className="wrap">
      <style>{css}</style>

      <div className="grid">
        <section className="card hero col-12">
          <div>
            <div className="hello">{greeting}{username ? `，${username}` : ""}</div>
            <div className="sub">即時監控・排程查詢・區間資料分析</div>
          </div>
        </section>

        <section className="card col-12">
          <div className="section-head">
            <div className="title">快速操作</div>
            <div className="right-muted">常用任務鍵</div>
          </div>
          <div className="tiles">
            <Tile icon="LIVE" title="即時監測" desc="查看即時趨勢與排程最新變化" onClick={()=>handleNav("/monitor")} />
            <Tile icon="HIS"  title="排程記錄" desc="查詢已執行排程與成本總結" onClick={()=>handleNav("/schedule-result")} />
            <Tile icon="ANL"  title="資料分析" desc="進入分析頁面，瀏覽圖表、趨勢" onClick={()=>handleNav("/data-analysis")} />
            <Tile icon="PDF"  title="產生報表" desc="下載區間 PDF 報表" onClick={()=>handleNav("/data-analysis")} />
          </div>
        </section>

        <section className="card col-12">
          <div className="section-head">
            <div className="title">報表生成紀錄</div>
            <div className="right-muted">本次登入下載紀錄</div>
          </div>
          <ul className="list">
              {displayRows.map((r, i) => (
                <li key={r.id || i} className="item">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <span style={{ color: "var(--muted)", fontWeight: 700, minWidth: "2rem" }}>
                      #{i + 1}
                    </span>

                    {/* 如果是佔位符，顯示橫線；如果是資料，顯示可點擊連結 */}
                    {r.name === "—" ? (
                      <span className="muted">—</span>
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleReDownload(r);
                        }}
                      >
                        {r.name}
                      </a>
                    )}
                    <span className="muted" style={{ marginLeft: ".5rem" }}>
                      {r.period || "—"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: ".4rem" }}>
                    <button
                      className={`btn ${r.name === "—" ? "disabled" : ""}`}
                      onClick={() => r.name !== "—" && handleReDownload(r)}
                    >
                      下載
                    </button>
                  </div>
                </li>
              ))}
            </ul>
        </section>
      </div>
    </div>
  );
}

function Tile({ icon, title, desc, onClick }){
  return (
    <button className="tile" onClick={onClick}>
      <div className="icon">{icon}</div>
      <div className="text">
        <div className="t">{title}</div>
        <div className="d">{desc}</div>
      </div>
    </button>
  );
}