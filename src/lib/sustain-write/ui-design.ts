// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ESGGO UI Design System v3.7 — 固態極簡光學
 * 
 * 品牌色：
 * - Teal #009EB0 (核心綠)
 * - Gold #D4AF37 (永恆金)
 * - ZKP Blue #3B82F6 (密碼藍)
 * - Lethal #FF4D6D (致命)
 * - Optimal #219EBC (最佳)
 * 
 * 5T 真善美信通 報告系統統一使用此設計
 * 
 * CSS 來源：使用者提供的 v3.7 投影片設計系統
 */

export const ESGGO_COLORS = {
  brandTeal: '#009EB0',
  brandTealLight: '#00C2AB',
  brandGold: '#D4AF37',
  zkpBlue: '#3b82f6',
  lethal: '#FF4D6D',
  critical: '#FFB703',
  optimal: '#219EBC',
  white: '#FFFFFF',
  slate950: '#070a13',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate600: '#475569',
  slate100: '#f1f5f9',
} as const;

export const ESGGO_FONTS = {
  main: "'Noto Sans TC', sans-serif",
  mono: "'Fira Code', monospace",
  display: "'Montserrat', sans-serif",
} as const;

export const ESGGO_RADIUS = {
  atom: '8px',
  molecule: '12px',
} as const;

/**
 * 完整 CSS（v3.7 固態極簡光學）
 * 可用於報告 HTML 或前端頁面
 */
export const ESGGO_CSS = `
:root {
  --brand-teal: #009EB0;
  --brand-teal-light: #00C2AB;
  --brand-gold: #D4AF37;
  --zkp-blue: #3b82f6;
  --lethal: #FF4D6D;
  --critical: #FFB703;
  --optimal: #219EBC;
  --base-bg: #FFFFFF;
  --slate-950: #070a13;
  --slate-900: #0f172a;
  --slate-800: #1e293b;
  --slate-600: #475569;
  --slate-100: #f1f5f9;
  --glass-blur: blur(12px);
  --border-glass: 1px solid rgba(255, 255, 255, 0.45);
  --radius-atom: 8px;
  --radius-molecule: 12px;
  --font-main: 'Noto Sans TC', sans-serif;
  --font-mono: 'Fira Code', monospace;
  --font-display: 'Montserrat', sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-main);
  background-color: #f8fafc;
  color: var(--slate-900);
  line-height: 1.8;
}

/* === 報告容器 === */
.report-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px;
}

/* === 封面 === */
.report-cover {
  background: linear-gradient(135deg, var(--brand-teal) 0%, #006d7a 100%);
  color: white;
  padding: 60px 40px;
  border-radius: var(--radius-molecule);
  margin-bottom: 30px;
  position: relative;
  overflow: hidden;
}
.report-cover::after {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background-color: rgba(255,255,255,0.08);
}
.report-cover h1 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 10px;
  position: relative;
  z-index: 1;
}
.report-cover .subtitle {
  font-size: 16px;
  opacity: 0.9;
  font-weight: 300;
  position: relative;
  z-index: 1;
}
.report-cover .badge-row {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
}

/* === 5T 狀態列 === */
.fiveT-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: var(--radius-molecule);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.fiveT-item {
  flex: 1;
  text-align: center;
  padding: 12px 8px;
  border-radius: var(--radius-atom);
  font-size: 13px;
  transition: transform 0.2s;
}
.fiveT-item:hover {
  transform: translateY(-2px);
}
.fiveT-item.passed {
  background-color: rgba(0, 158, 176, 0.08);
  color: var(--brand-teal);
  font-weight: 600;
}
.fiveT-item .icon {
  font-size: 20px;
  margin-bottom: 4px;
}

/* === 章節卡片 === */
.chapter {
  background: white;
  border-radius: var(--radius-molecule);
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chapter-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--slate-100);
}
.chapter-gate {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  color: white;
}
.gate-traceable { background-color: var(--brand-teal); }
.gate-transparent { background-color: var(--optimal); }
.gate-tangible { background-color: var(--brand-gold); }
.gate-trustworthy { background-color: var(--lethal); }
.gate-trackable { background-color: var(--zkp-blue); }
.chapter-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--slate-900);
}
.chapter-content p {
  margin-bottom: 12px;
  text-align: justify;
}

/* === OmniTag 標籤 === */
.omnitag {
  display: inline-block;
  background-color: var(--slate-900);
  color: #38bdf8;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
}

/* === 5T 合規標記 === */
.compliance-box {
  background-color: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-molecule);
  padding: 16px;
  margin-top: 20px;
}
.compliance-box ul {
  list-style: none;
  padding: 0;
}
.compliance-box li {
  padding: 4px 0;
  font-size: 13px;
}
.compliance-box li::before {
  content: "✓ ";
  color: #10b981;
  font-weight: bold;
}

/* === 按鈕系統 === */
.ui-btn {
  padding: 12px 24px;
  border-radius: var(--radius-atom);
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: inline-block;
  margin-right: 12px;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: var(--font-main);
}
.btn-primary {
  background-color: var(--brand-teal);
  color: white;
}
.btn-primary:hover {
  background-color: var(--brand-teal-light);
}
.btn-outline {
  border: 2px solid var(--brand-teal);
  color: var(--brand-teal);
  background-color: transparent;
}
.btn-outline:hover {
  background-color: var(--slate-100);
}
.btn-gold {
  background-color: var(--brand-gold);
  color: white;
}

/* === 輸入框 === */
.form-input {
  background-color: var(--slate-100);
  border: 1px solid #cbd5e1;
  padding: 12px;
  border-radius: var(--radius-atom);
  width: 100%;
  color: var(--slate-800);
  margin-bottom: 12px;
  font-size: 14px;
  font-family: var(--font-main);
}
.form-input:focus {
  outline: none;
  border-color: var(--brand-teal);
  box-shadow: 0 0 0 3px rgba(0, 158, 176, 0.1);
}
.form-input-zkp {
  border-left: 5px solid var(--zkp-blue);
  background-color: white;
}

/* === 狀態徽章 === */
.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  color: white;
  display: inline-block;
}
.badge-optimal { background-color: var(--brand-teal); }
.badge-zkp { background-color: var(--zkp-blue); }
.badge-trustworthy { background-color: var(--lethal); box-shadow: 0 0 10px rgba(255,77,109,0.3); }

/* === 色板 === */
.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  width: 100%;
}
.color-card { text-align: center; }
.color-swatch {
  height: 120px;
  border-radius: var(--radius-molecule);
  margin-bottom: 10px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.color-info {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--slate-600);
}
.color-label {
  font-weight: 700;
  margin-top: 4px;
  font-size: 14px;
}

/* === 玻璃卡片 === */
.glass-card {
  background-color: rgba(255, 255, 255, 0.45);
  backdrop-filter: var(--glass-blur);
  border: var(--border-glass);
  border-radius: var(--radius-molecule);
  padding: 25px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
}
.solid-card {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-molecule);
  padding: 25px;
}

/* === 代碼塊 === */
.code-block {
  background-color: var(--slate-800);
  color: #cbd5e1;
  padding: 16px 20px;
  border-radius: var(--radius-molecule);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.45;
  border-left: 6px solid var(--brand-teal);
  overflow-y: auto;
  max-height: 380px;
}
.code-key { color: #38bdf8; }
.code-type { color: #f472b6; }
.code-val { color: #fbbf24; }
.code-comment { color: #64748b; }

/* === OmniTag 視覺化 === */
.omnitag-display-card {
  border: 1px dashed var(--brand-teal);
  background-color: var(--slate-100);
  padding: 20px;
  border-radius: var(--radius-molecule);
}
.omnitag-visual-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
}
.omnitag-bubble {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: white;
  border: 3px solid var(--brand-teal);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: var(--slate-900);
  box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}
.omnitag-bubble.paired {
  border-color: var(--brand-gold);
}
.omnitag-bubble.entangled {
  animation: float-tag 2s infinite alternate ease-in-out;
}
.quantum-link {
  flex-grow: 1;
  height: 2px;
  background-color: var(--brand-gold);
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

@keyframes float-tag {
  0% { transform: translateY(-3px); }
  100% { transform: translateY(3px); }
}
@keyframes pulse {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

/* === 頁腳 === */
.report-footer {
  text-align: center;
  padding: 30px;
  color: var(--slate-600);
  font-size: 13px;
  border-top: 1px solid var(--slate-100);
  margin-top: 30px;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .report-container { padding: 20px; }
  .fiveT-bar { flex-direction: column; }
  .report-cover { padding: 40px 24px; }
  .color-grid { grid-template-columns: repeat(3, 1fr); }
}
`;

/**
 * 生成報告 HTML 使用 ESGGO v3.7 設計系統
 */
export function generateReportHTML(report: { companyName: string; chapters: Array<{ fiveTGate: string; title: string; content: string }>; generatedAt: string; totalWords: number }): string {
  const parts: string[] = [];

  parts.push('<!DOCTYPE html>');
  parts.push('<html lang="zh-TW"><head><meta charset="UTF-8">');
  parts.push('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  parts.push('<title>' + report.companyName + ' — C版專業永續報告 | ESGGO</title>');
  parts.push('<link rel="preconnect" href="https://fonts.googleapis.com">');
  parts.push('<link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Montserrat:wght@600;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap" rel="stylesheet">');
  parts.push('<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">');
  parts.push('<style>' + ESGGO_CSS + '</style></head><body>');

  parts.push('<div class="report-container">');

  // 封面
  parts.push('<div class="report-cover">');
  parts.push('<h1>' + report.companyName + '</h1>');
  parts.push('<div class="subtitle">C版專業永續報告 | 5T 協議（真善美信通）| OmniTag 萬能標籤驗證</div>');
  parts.push('<div class="badge-row">');
  parts.push('<span class="status-badge badge-zkp"><i class="fa-solid fa-shield-halved"></i> ZKP Verified</span>');
  parts.push('<span class="status-badge badge-optimal"><i class="fa-solid fa-seedling"></i> 善向永續</span>');
  parts.push('</div></div>');

  // 5T 狀態列
  parts.push('<div class="fiveT-bar">');
  const gates = [
    { key: 'traceable', icon: 'fa-code-merge', name: '真', desc: '可溯源' },
    { key: 'transparent', icon: 'fa-eye', name: '善', desc: '透明驗算' },
    { key: 'tangible', icon: 'fa-palette', name: '美', desc: '可感知' },
    { key: 'trustworthy', icon: 'fa-lock', name: '信', desc: '不可篡改' },
    { key: 'trackable', icon: 'fa-tower-broadcast', name: '通', desc: '可追蹤' },
  ];
  for (const gate of gates) {
    parts.push('<div class="fiveT-item passed">');
    parts.push('<div class="icon"><i class="fa-solid ' + gate.icon + '"></i></div>');
    parts.push('<div><strong>' + gate.name + '</strong></div>');
    parts.push('<div style="font-size:11px;opacity:0.7">' + gate.desc + '</div>');
    parts.push('</div>');
  }
  parts.push('</div>');

  // 章節
  for (const chapter of report.chapters) {
    const gateClass = 'gate-' + chapter.fiveTGate;
    const gateNameMap: Record<string, string> = { traceable: '真', transparent: '善', tangible: '美', trustworthy: '信', trackable: '通' };
    const gateIconMap: Record<string, string> = { traceable: 'fa-code-merge', transparent: 'fa-eye', tangible: 'fa-palette', trustworthy: 'fa-lock', trackable: 'fa-tower-broadcast' };
    const _gateName = gateNameMap[chapter.fiveTGate] || '';
    const gateIcon = gateIconMap[chapter.fiveTGate] || '';
    const _gateIcon = gateIcon; // suppress unused warning

    parts.push('<div class="chapter">');
    parts.push('<div class="chapter-header">');
    parts.push('<div class="chapter-gate ' + gateClass + '"><i class="fa-solid ' + gateIcon + '"></i></div>');
    parts.push('<div class="chapter-title">' + chapter.title + '</div>');
    parts.push('</div>');

    parts.push('<div class="chapter-content">');
    const paragraphs = chapter.content.split('\n\n');
    for (const para of paragraphs) {
      if (para.indexOf('###') === 0) {
        parts.push('<h3 style="margin: 16px 0 8px 0; color: var(--slate-900); font-size: 16px;">' + para.replace('### ', '') + '</h3>');
      } else if (para.indexOf('[OmniTag:') === 0) {
        const tagMatch = para.match(/\[OmniTag:([^\]]+)\]/);
        const text = para.replace(/\[OmniTag:[^\]]+\]\s*/, '');
        if (text.trim()) {
          parts.push('<p><span class="omnitag">' + (tagMatch ? tagMatch[1].substring(0, 8) : '') + '</span> ' + text + '</p>');
        }
      } else if (para.indexOf('- [x]') >= 0) {
        parts.push('<div class="compliance-box"><ul>');
        const items = para.split('\n');
        for (const item of items) {
          if (item.trim()) parts.push('<li>' + item.replace('- [x] ', '') + '</li>');
        }
        parts.push('</ul></div>');
      } else if (para.trim()) {
        parts.push('<p>' + para + '</p>');
      }
    }
    parts.push('</div></div>');
  }

  // 頁腳
  parts.push('<div class="report-footer">');
  parts.push('<p><i class="fa-solid fa-seedling" style="color: var(--brand-teal);"></i> ESGGO 善向永續 | C版專業永續報告系統 v3.7</p>');
  parts.push('<p>報告生成時間：' + report.generatedAt + ' | 總字數：' + report.totalWords.toLocaleString() + ' 字 | 章節數：' + report.chapters.length + '</p>');
  parts.push('<p style="margin-top: 8px;"><span class="omnitag">OmniTag</span> <span class="omnitag">ZKP</span> <span class="omnitag">5T Protocol</span></p>');
  parts.push('</div>');

  parts.push('</div></body></html>');

  return parts.join('\n');
}
