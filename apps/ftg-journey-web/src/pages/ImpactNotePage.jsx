import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

const SDGS = [
  { id: 1, name: '消除貧窮', icon: '🚫', color: '#E5243B' },
  { id: 2, name: '零飢餓', icon: '🌾', color: '#DDA63A' },
  { id: 3, name: '健康與福祉', icon: '💚', color: '#4C9F38' },
  { id: 4, name: '優質教育', icon: '📚', color: '#C5192D' },
  { id: 5, name: '性別平等', icon: '⚖️', color: '#FF3A21' },
  { id: 6, name: '淨水與衛生', icon: '💧', color: '#26BDE2' },
  { id: 7, name: '可負擔能源', icon: '⚡', color: '#FCC30B' },
  { id: 8, name: '就業與經濟成長', icon: '💼', color: '#A21942' },
  { id: 9, name: '工業創新基礎', icon: '🏗️', color: '#FD6925' },
  { id: 10, name: '減少不平等', icon: '🤝', color: '#DD1367' },
  { id: 11, name: '永續城市', icon: '🏙️', color: '#FD9D24' },
  { id: 12, name: '責任消費生產', icon: '♻️', color: '#BF8B2E' },
  { id: 13, name: '氣候行動', icon: '🌡️', color: '#3F7E44' },
  { id: 14, name: '海洋生態', icon: '🌊', color: '#0A97D9' },
  { id: 15, name: '陸域生態', icon: '🌳', color: '#56C02B' },
  { id: 16, name: '和平正義制度', icon: '⚖️', color: '#00689D' },
  { id: 17, name: '全球夥伴', icon: '🌐', color: '#19486A' },
];

const METRIC_SDGS_MAP = {
  participants: [3, 8, 11],
  carbon_saved: [13, 7],
  distance: [13, 11],
  satisfaction: [3, 8],
  volunteer_hours: [17, 10],
  trees_planted: [15, 13],
  trash_collected: [12, 14, 15],
  species_observed: [15],
  local_spending: [8, 11, 12],
  water_saved: [6, 12],
  waste_reduced: [12],
};

const METRIC_GRI_MAP = {
  participants: ['GRI 403', 'GRI 404'],
  carbon_saved: ['GRI 305'],
  distance: ['GRI 305'],
  satisfaction: ['GRI 403'],
  volunteer_hours: ['GRI 413'],
  trees_planted: ['GRI 304'],
  trash_collected: ['GRI 306', 'GRI 304'],
  species_observed: ['GRI 304'],
  local_spending: ['GRI 204', 'GRI 413'],
  water_saved: ['GRI 303'],
  waste_reduced: ['GRI 306'],
};

export function ImpactNotePage() {
  const { id } = useParams();
  const token = localStorage.getItem('ftg_token');
  const [journey, setJourney] = useState(null);
  const [impact, setImpact] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const chartRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/journeys/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setJourney);
    fetch(`${API_BASE}/api/journeys/${id}/impact`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setImpact);
    fetch(`${API_BASE}/api/journeys/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setNotes);
  }, [id, token]);

  // Draw chart when tab changes or data updates
  useEffect(() => {
    if (activeTab === 'chart' && chartRef.current && impact.length > 0) {
      drawChart();
    }
  }, [activeTab, impact]);

  const drawChart = () => {
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    // Aggregate by metric_id
    const agg = {};
    impact.forEach(i => {
      agg[i.metric_id] = (agg[i.metric_id] || 0) + i.value;
    });

    const entries = Object.entries(agg).filter(([_, v]) => v > 0);
    if (entries.length === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暫無數據', w / 2, h / 2);
      return;
    }

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    const maxVal = Math.max(...entries.map(([_, v]) => v));
    const barWidth = Math.min(60, (w - 80) / entries.length - 10);
    const chartH = h - 80;
    const startX = (w - (entries.length * (barWidth + 10) - 10)) / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw bars
    entries.forEach(([key, val], i) => {
      const barH = (val / maxVal) * chartH;
      const x = startX + i * (barWidth + 10);
      const y = h - 40 - barH;

      // Bar
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Value on top
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val.toFixed(1), x + barWidth / 2, y - 6);

      // Label at bottom
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px sans-serif';
      const label = key.length > 8 ? key.slice(0, 8) + '...' : key;
      ctx.fillText(label, x + barWidth / 2, h - 20);
    });
  };

  if (!journey) return <div className="py-12 text-center">載入中...</div>;

  const totalImpact = impact.reduce((sum, i) => sum + (i.value || 0), 0);
  const impactByMetric = impact.reduce((acc, i) => {
    acc[i.metric_id] = (acc[i.metric_id] || 0) + i.value;
    return acc;
  }, {});

  const metrics = [
    { id: 'participants', label: '參與人次', icon: '👥', unit: '人' },
    { id: 'carbon_saved', label: '碳減量', icon: '🌱', unit: 'kg' },
    { id: 'distance', label: '步行距離', icon: '🚶', unit: 'km' },
    { id: 'satisfaction', label: '滿意度', icon: '⭐', unit: '/5' },
    { id: 'volunteer_hours', label: '志工時數', icon: '⏱️', unit: '小時' },
    { id: 'trees_planted', label: '植樹數量', icon: '🌳', unit: '棵' },
    { id: 'trash_collected', label: '垃圾撿拾', icon: '🗑️', unit: '件' },
    { id: 'species_observed', label: '生態觀察', icon: '🦋', unit: '種' },
    { id: 'local_spending', label: '在地消費', icon: '🏪', unit: '元' },
    { id: 'water_saved', label: '節約用水', icon: '💧', unit: 'L' },
    { id: 'waste_reduced', label: '減廢數量', icon: '♻️', unit: '件' },
  ];

  // Collect all relevant SDGs
  const relevantSdgs = new Set();
  Object.keys(impactByMetric).forEach(metricId => {
    (METRIC_SDGS_MAP[metricId] || []).forEach(sdgId => relevantSdgs.add(sdgId));
  });

  // Collect all relevant GRI standards
  const relevantGri = new Set();
  Object.keys(impactByMetric).forEach(metricId => {
    (METRIC_GRI_MAP[metricId] || []).forEach(gri => relevantGri.add(gri));
  });

  // Generate PPT slides
  const generatePPT = () => {
    const metrics_with_data = metrics.filter(m => impactByMetric[m.id] > 0);
    const sdg_list = SDGS.filter(s => relevantSdgs.has(s.id));
    const gri_list = Array.from(relevantGri).sort();
    
    const slides = [];
    
    // Slide 1: Title
    slides.push(`
      <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#10243f 0%,#1a3a5c 100%);color:#fff;padding:60px;box-sizing:border-box;">
        <div style="font-size:64px;margin-bottom:24px;">🌍</div>
        <h1 style="font-size:48px;font-weight:800;margin-bottom:16px;color:#c9a24b;">ESG Impact Note</h1>
        <p style="font-size:24px;color:rgba(255,255,255,0.8);">${journey.title}</p>
        <p style="font-size:18px;color:rgba(255,255,255,0.6);margin-top:8px;">${journey.destination} · ${journey.start_date} ~ ${journey.end_date}</p>
      </div>
    `);

    // Slide 2: Journey Overview
    slides.push(`
      <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
        <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">旅程概覽</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size:14px;color:#6b7280;">目的地</div>
            <div style="font-size:20px;font-weight:700;color:#10243f;margin-top:4px;">${journey.destination}</div>
          </div>
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size:14px;color:#6b7280;">日期</div>
            <div style="font-size:20px;font-weight:700;color:#10243f;margin-top:4px;">${journey.start_date} ~ ${journey.end_date}</div>
          </div>
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size:14px;color:#6b7280;">目的</div>
            <div style="font-size:20px;font-weight:700;color:#10243f;margin-top:4px;">${journey.purpose || 'ESG 永續行動'}</div>
          </div>
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-size:14px;color:#6b7280;">方案類型</div>
            <div style="font-size:20px;font-weight:700;color:#10243f;margin-top:4px;">${journey.service_type || 'ESG 戶外團隊日'}</div>
          </div>
        </div>
      </div>
    `);

    // Slide 3: Key Metrics
    slides.push(`
      <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
        <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">關鍵影響力數據</h2>
        <div style="display:grid;grid-template-columns:repeat(${Math.min(metrics_with_data.length, 4)},1fr);gap:20px;flex:1;">
          ${metrics_with_data.map(m => `
            <div style="background:#fff;border-radius:16px;padding:24px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
              <div style="font-size:48px;margin-bottom:12px;">${m.icon}</div>
              <div style="font-size:32px;font-weight:800;color:#10243f;">${impactByMetric[m.id]?.toFixed(1) || 0}</div>
              <div style="font-size:14px;color:#6b7280;margin-top:4px;">${m.label} (${m.unit})</div>
            </div>
          `).join('')}
        </div>
      </div>
    `);

    // Slide 4: ESG Summary
    slides.push(`
      <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
        <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">ESG 面向摘要</h2>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;flex:1;">
          <div style="background:#dcfce7;border-radius:16px;padding:32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">🌿</div>
            <div style="font-size:24px;font-weight:700;color:#166534;">環境面</div>
            <div style="font-size:16px;color:#166534;margin-top:8px;">${(impactByMetric.carbon_saved || 0).toFixed(1)} kg 減碳</div>
          </div>
          <div style="background:#dbeafe;border-radius:16px;padding:32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">👥</div>
            <div style="font-size:24px;font-weight:700;color:#1e40af;">社會面</div>
            <div style="font-size:16px;color:#1e40af;margin-top:8px;">${(impactByMetric.participants || 0)} 人次參與</div>
          </div>
          <div style="background:#fef3c7;border-radius:16px;padding:32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:12px;">⏱️</div>
            <div style="font-size:24px;font-weight:700;color:#92400e;">治理面</div>
            <div style="font-size:16px;color:#92400e;margin-top:8px;">${(impactByMetric.volunteer_hours || 0).toFixed(1)} 志工時數</div>
          </div>
        </div>
      </div>
    `);

    // Slide 5: SDGs
    if (sdg_list.length > 0) {
      slides.push(`
        <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
          <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">對應 SDGs 永續發展目標</h2>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(sdg_list.length, 4)},1fr);gap:16px;flex:1;">
            ${sdg_list.map(sdg => `
              <div style="background:#fff;border-radius:16px;padding:20px;text-align:center;border:3px solid ${sdg.color};">
                <div style="font-size:40px;margin-bottom:8px;">${sdg.icon}</div>
                <div style="font-size:14px;font-weight:700;color:${sdg.color};">目標 ${sdg.id}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px;">${sdg.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
    }

    // Slide 6: GRI
    if (gri_list.length > 0) {
      slides.push(`
        <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
          <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">GRI 準則對應</h2>
          <div style="display:flex;flex-direction:column;gap:12px;flex:1;">
            ${gri_list.map(gri => {
              const relatedMetrics = Object.keys(impactByMetric).filter(m => (METRIC_GRI_MAP[m] || []).includes(gri));
              return `
                <div style="background:#dbeafe;border-radius:12px;padding:20px;border:2px solid #93c5fd;">
                  <div style="font-size:18px;font-weight:700;color:#1e40af;">${gri}</div>
                  <div style="font-size:14px;color:#1e40af;margin-top:4px;">${relatedMetrics.map(m => {
                    const metric = metrics.find(me => me.id === m);
                    return `${metric?.label || m}: ${impactByMetric[m]?.toFixed(1)}${metric?.unit || ''}`;
                  }).join('、')}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `);
    }

    // Slide 7: Participant Feedback
    if (notes.length > 0) {
      slides.push(`
        <div style="height:100vh;display:flex;flex-direction:column;background:#f3ede1;padding:60px;box-sizing:border-box;">
          <h2 style="font-size:36px;font-weight:800;color:#10243f;margin-bottom:32px;">參與者回饋</h2>
          <div style="display:flex;flex-direction:column;gap:16px;flex:1;">
            ${notes.slice(0, 4).map(n => `
              <div style="background:#fff;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <div style="font-size:12px;color:#9ca3af;margin-bottom:4px;">${n.date} · ${n.mood}</div>
                <div style="font-size:14px;color:#374151;">${n.text}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
    }

    // Last Slide: Thank You
    slides.push(`
      <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#10243f 0%,#1a3a5c 100%);color:#fff;padding:60px;box-sizing:border-box;">
        <div style="font-size:64px;margin-bottom:24px;">🌱</div>
        <h1 style="font-size:48px;font-weight:800;margin-bottom:16px;color:#c9a24b;">善向永續</h1>
        <p style="font-size:20px;color:rgba(255,255,255,0.8);text-align:center;">每一步都是改變的開始<br/>感謝參與 ${journey.title}</p>
        <p style="font-size:14px;color:rgba(255,255,255,0.5);margin-top:32px;">FTG TOURS 墾趣旅遊 · ${new Date().toLocaleDateString('zh-TW')}</p>
      </div>
    `);

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <title>ESG Impact Note - ${journey.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans TC', sans-serif; }
    .slide { width: 100vw; height: 100vh; page-break-after: always; }
    @media print {
      .slide { page-break-after: always; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  ${slides.map(s => `<div class="slide">${s}</div>`).join('')}
  <div class="no-print" style="position:fixed;bottom:20px;right:20px;display:flex;gap:12px;">
    <button onclick="window.print()" style="background:#10243f;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;">🖨️ 列印 / 存 PDF</button>
    <button onclick="window.close()" style="background:#6b7280;color:#fff;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:16px;">✕ 關閉</button>
  </div>
</body>
</html>`;

    const pptWindow = window.open('', '_blank');
    pptWindow.document.write(html);
    pptWindow.document.close();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-primary mb-2">ESG Impact Note</h1>
        <p className="text-gray-500 mb-8">{journey.title} · {journey.destination}</p>
      </motion.div>

      <div className="flex gap-2 mb-8 border-b border-gray-200 pb-2 flex-wrap">
        {[
          { id: 'overview', label: '📊 總覽' },
          { id: 'metrics', label: '📈 數據' },
          { id: 'chart', label: '📉 圖表' },
          { id: 'sdgs', label: '🎯 SDGs' },
          { id: 'gri', label: '📋 GRI' },
          { id: 'notes', label: '💬 回饋' },
          { id: 'export', label: '🖨️ 匯出' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.filter(m => impactByMetric[m.id] > 0).map(m => (
              <div key={m.id} className="card text-center">
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="text-2xl font-bold text-primary">{impactByMetric[m.id]?.toFixed(1) || 0}</div>
                <div className="text-sm text-gray-500">{m.label} ({m.unit})</div>
              </div>
            ))}
          </div>

          {relevantSdgs.size > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg mb-4">對應永續發展目標 (SDGs)</h3>
              <div className="flex flex-wrap gap-3">
                {SDGS.filter(s => relevantSdgs.has(s.id)).map(sdg => (
                  <div key={sdg.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: sdg.color }}>
                    <span className="text-xl">{sdg.icon}</span>
                    <span className="text-sm font-medium">{sdg.id}. {sdg.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {relevantGri.size > 0 && (
            <div className="card">
              <h3 className="font-bold text-lg mb-4">GRI 準則對應</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(relevantGri).sort().map(gri => (
                  <span key={gri} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{gri}</span>
                ))}
              </div>
            </div>
          )}

          <div className="card bg-green-50 border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">ESG 面向摘要</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl">🌿</div>
                <div className="text-sm font-bold text-green-700">環境面</div>
                <div className="text-xs text-green-600">{(impactByMetric.carbon_saved || 0).toFixed(1)} kg 減碳</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">👥</div>
                <div className="text-sm font-bold text-blue-700">社會面</div>
                <div className="text-xs text-blue-600">{(impactByMetric.participants || 0)} 人次參與</div>
              </div>
              <div className="text-center">
                <div className="text-2xl">⏱️</div>
                <div className="text-sm font-bold text-yellow-700">治理面</div>
                <div className="text-xs text-yellow-600">{(impactByMetric.volunteer_hours || 0).toFixed(1)} 志工時數</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">影響力數據明細</h3>
          {impact.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚未記錄數據</p>
          ) : (
            <div className="space-y-2">
              {impact.map(i => (
                <div key={i.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                  <div>
                    <span className="text-sm font-medium">{i.metric_id}</span>
                    <div className="flex gap-1 mt-1">
                      {(METRIC_SDGS_MAP[i.metric_id] || []).map(sdgId => (
                        <span key={sdgId} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                          {SDGS.find(s => s.id === sdgId)?.icon}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="font-semibold">{i.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'chart' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">數據視覺化</h3>
          <canvas ref={chartRef} style={{ width: '100%', height: '300px' }} />
        </div>
      )}

      {activeTab === 'sdgs' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">UN SDGs 永續發展目標對應</h3>
          <p className="text-sm text-gray-500 mb-4">本旅程之 ESG 行動對應以下永續發展目標：</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SDGS.filter(s => relevantSdgs.has(s.id)).map(sdg => (
              <div key={sdg.id} className="flex items-start gap-3 p-4 rounded-lg border-2" style={{ borderColor: sdg.color + '40' }}>
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: sdg.color + '20' }}>
                  {sdg.icon}
                </div>
                <div>
                  <div className="font-bold" style={{ color: sdg.color }}>目標 {sdg.id}: {sdg.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {Object.keys(impactByMetric).filter(m => (METRIC_SDGS_MAP[m] || []).includes(sdg.id)).map(m => {
                      const metric = metrics.find(me => me.id === m);
                      return `${metric?.label || m}: ${impactByMetric[m]?.toFixed(1)}${metric?.unit || ''}`;
                    }).join('、')}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {relevantSdgs.size === 0 && (
            <p className="text-gray-500 text-center py-8">尚未記錄任何 ESG 數據</p>
          )}
        </div>
      )}

      {activeTab === 'gri' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">GRI 準則報告對應</h3>
          <p className="text-sm text-gray-500 mb-4">本旅程成果對應之全球報告倡議組織 (GRI) 準則：</p>
          {relevantGri.size === 0 ? (
            <p className="text-gray-500 text-center py-8">尚未記錄任何 ESG 數據</p>
          ) : (
            <div className="space-y-4">
              {Array.from(relevantGri).sort().map(gri => {
                const relatedMetrics = Object.keys(impactByMetric).filter(m => (METRIC_GRI_MAP[m] || []).includes(gri));
                return (
                  <div key={gri} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-bold text-blue-800">{gri}</div>
                    <div className="text-sm text-blue-600 mt-1">
                      相關指標：{relatedMetrics.map(m => {
                        const metric = metrics.find(me => me.id === m);
                        return `${metric?.label || m} (${impactByMetric[m]?.toFixed(1)}${metric?.unit || ''})`;
                      }).join('、')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">參與者回饋</h3>
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚無回饋記錄</p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">{n.date} · {n.mood}</div>
                  <p className="text-sm">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="card text-center py-12">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-bold mb-2">報告匯出</h3>
            <p className="text-gray-500 mb-6">此報告包含 ESG 數據、SDGs 對應、GRI 準則與參與者回饋</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button className="btn-primary" onClick={() => window.print()}>🖨️ 列印 / 儲存 PDF</button>
              <button className="btn-outline" onClick={() => {
                const data = { journey, impact, metrics: impactByMetric, sdgs: Array.from(relevantSdgs), gri: Array.from(relevantGri), exported_at: new Date().toISOString() };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `impact-note-${id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}>💾 下載 JSON</button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">📽️ PPT 簡報產生器</h3>
            <p className="text-sm text-gray-500 mb-4">自動產生 ESG 成果簡報，可直接下載 HTML 簡報檔或列印成 PPT</p>
            <button className="btn-primary w-full" onClick={() => generatePPT()}>🎬 產生 ESG 簡報</button>
          </div>
        </div>
      )}
    </div>
  );
}
