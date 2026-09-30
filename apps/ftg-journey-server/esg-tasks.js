// ESG 任務目錄 + 影響數據換算（純函式，零 I/O、零 express 依賴）
//
// 為何要抽成模組（2026-09-30 實測修正）:
//
//   修正前同一組「ESG 任務」規則散落三處、彼此漂移:
//     1. server.js GET  /esg-tasks        → 只回 {id,title,icon}，沒有 fields
//     2. server.js POST /esg-tasks        → impactSync 硬編碼 metric 對應
//     3. server.js GET  /esg-tasks totals → 碳足跡係數又寫一份
//     4. ImpactNotePage.jsx               → 宣告了 11 個 metric 的 SDG/GRI 對應
//
//   實測後果（三個真實缺陷，皆已用 test 鎖住）:
//     A. 任務目錄缺 fields → 前端 openTask() 讀 task.fields.forEach 直接
//        TypeError，使用者點任何一個 ESG 任務都開不了表單 = 覺曉流整條死掉。
//     B. carbon_saved 寫入的是「公里數」但 unit 標示 kg
//        → Impact Note 對外輸出 GRI 305 報告時單位錯誤。
//     C. 碳係數查表用 factors[mode] || 0.17
//        → factors['步行'] === 0 為 falsy，會穿透到 0.17，
//        步行/腳踏車（零排放）被算成開汽車的碳排。
//
// 5T-Traceable: 任務目錄、metric 對應、碳換算改為單一真實來源（此檔），
//   server.js 與測試皆 import 同一份，避免再次漂移。
// 5T-Trustworthy: 對外揭露的數值必須與單位一致（kg / km / 件 / 種 / 元 / L）。

// ===== 碳足跡排放係數（kg CO2e / /passenger-km）=====
// 注意：步行與腳踏車為 0。0 是合法值，查找時必須用 hasOwnProperty 判定存在性，
// 不可用 || 兜底，否則零排放模式會被誤算成汽車（見缺陷 C）。
export const CARBON_FACTORS = {
  '步行': 0,
  '腳踏車': 0,
  '公車/捷運': 0.05,
  '火車': 0.04,
  '汽車': 0.17,
  '飛機': 0.25,
};

export const DEFAULT_CARBON_MODE = '汽車';

// ===== ESG 任務目錄（含 fields，供前端動態產生表單）=====
// fields[].type 僅支援 'number' | 'text' | 'select'；
// type === 'select' 時必須提供非空 options（前端 field.options.map 直接迭代）。
// 欄位 name 必須與 impactRowsForTask 讀的 key 一致，否則使用者填了卻不會進 impact。
export const ESG_TASKS = [
  {
    id: 'cleanup',
    title: 'Clean-up Walk',
    icon: '🗑️',
    fields: [
      { name: 'count', label: '撿拾垃圾件數', type: 'number', placeholder: '例如 12' },
    ],
  },
  {
    id: 'carbon',
    title: '碳足跡記錄',
    icon: '🌱',
    fields: [
      { name: 'distance', label: '移動距離（km）', type: 'number', placeholder: '例如 10' },
      {
        name: 'mode',
        label: '交通方式',
        type: 'select',
        options: Object.keys(CARBON_FACTORS),
      },
      { name: 'passengers', label: '乘客人數', type: 'number', placeholder: '例如 1' },
    ],
  },
  {
    id: 'biodiversity',
    title: '生態觀察',
    icon: '🦋',
    fields: [
      { name: 'count', label: '觀察到幾種生物', type: 'number', placeholder: '例如 3' },
    ],
  },
  {
    id: 'local',
    title: '地方支持',
    icon: '🏪',
    fields: [
      { name: 'amount', label: '在地消費金額（元）', type: 'number', placeholder: '例如 450' },
    ],
  },
  {
    id: 'water',
    title: '水資源',
    icon: '💧',
    fields: [
      { name: 'saved', label: '節約用水（L）', type: 'number', placeholder: '例如 120' },
    ],
  },
  {
    id: 'waste',
    title: '廢棄物減量',
    icon: '♻️',
    fields: [
      { name: 'count', label: '減廢件數', type: 'number', placeholder: '例如 5' },
    ],
  },
];

// 依 id 取得任務目錄項
export function getTask(taskId) {
  return ESG_TASKS.find((t) => t.id === taskId) || null;
}

// ===== 碳足跡換算 =====

// 將單筆 carbon 任務資料換算成 kg CO2e。
// 回傳 0 代表「不適用 / 無排放」（步行、腳踏車、距離缺漏、輸入為 0 或負數）。
export function carbonKg(data) {
  const distance = Number(data?.distance);
  if (!Number.isFinite(distance) || distance <= 0) return 0;

  const mode = data?.mode || DEFAULT_CARBON_MODE;
  // 缺陷 C 的修正：用存在性判定取代 || 兜底，讓 0（步行/腳踏車）能正確回傳。
  const factor = Object.prototype.hasOwnProperty.call(CARBON_FACTORS, mode)
    ? CARBON_FACTORS[mode]
    : CARBON_FACTORS[DEFAULT_CARBON_MODE];

  const passengers = Number(data?.passengers);
  const divisor = Number.isFinite(passengers) && passengers > 0 ? passengers : 1;

  return distance * factor / divisor;
}

// 任務 → impact metric 對應（key 為該任務紀錄中的欄位名）
// 缺陷 B 的修正：carbon 不再把「公里數」當成 kg 寫入。
// 碳排（kg）與距離（km）拆成兩筆獨立 impact，兩者單位各自正確。
const IMPACT_SYNC = {
  cleanup: [{ metric_id: 'trash_collected', key: 'count', unit: '件' }],
  carbon: [
    { metric_id: 'carbon_saved', key: '__carbonKg', unit: 'kg' },
    { metric_id: 'distance', key: 'distance', unit: 'km' },
  ],
  biodiversity: [{ metric_id: 'species_observed', key: 'count', unit: '種' }],
  local: [{ metric_id: 'local_spending', key: 'amount', unit: '元' }],
  water: [{ metric_id: 'water_saved', key: 'saved', unit: 'L' }],
  waste: [{ metric_id: 'waste_reduced', key: 'count', unit: '件' }],
};

// 該任務會寫入 impact 的所有 metric_id（供測試與文件核對用）
export function metricIdsForTask(taskId) {
  return (IMPACT_SYNC[taskId] || []).map((m) => m.metric_id);
}

// 該任務會讀取的所有欄位 key（供測試核對 fields 是否涵蓋）
export function sourceKeysForTask(taskId) {
  return (IMPACT_SYNC[taskId] || [])
    .filter((m) => m.key !== '__carbonKg')
    .map((m) => m.key);
}

// 將一筆任務紀錄轉換成要寫入 impact 表的列。
// 只回傳 value > 0 的列：0 代表「此指標對本次紀錄不適用」，
// 寫進資料庫只會產生噪音列，且前端一律以 > 0 過濾，行為一致。
export function impactRowsForTask(taskId, data) {
  const rules = IMPACT_SYNC[taskId];
  if (!rules) return [];

  const rows = [];
  for (const rule of rules) {
    const value = rule.key === '__carbonKg' ? carbonKg(data) : Number(data?.[rule.key]);
    if (!Number.isFinite(value) || value <= 0) continue;
    rows.push({ metric_id: rule.metric_id, value, unit: rule.unit });
  }
  return rows;
}

// ===== 影響彙總 =====

// 回傳「依 metric 分組」的彙總，而非把不同單位硬加總。
// 缺陷 D：舊版 total_impact_value = impact.reduce(+value) 會把
// kg + 件 + 種 + 元 + L 加成一個數字，該數字沒有任何物理意義，
// 卻會被當作「總影響值」呈現。跨單位加總在此明確拒絕。
export function summarizeImpact(rows) {
  const byMetric = {};
  for (const row of rows || []) {
    const value = Number(row?.value);
    if (!Number.isFinite(value)) continue;
    byMetric[row.metric_id] = (byMetric[row.metric_id] || 0) + value;
  }
  return { by_metric: byMetric, metric_count: Object.keys(byMetric).length };
}

// ===== 歷程統計（GET /api/journeys/:id/esg-tasks 的 totals）=====
// 與 impact 分開：totals 給 JourneyDetail 的任務卡即時顯示（原始單位），
// impact 給 ImpactNote 對外揭露（換算後單位）。兩者不可混用。
export function summarizeTaskLogs(logs) {
  const totals = {};
  for (const log of logs || []) {
    const data = safeParse(log?.data);
    if (log?.task_id === 'cleanup' && data.count) {
      totals.cleanup = (totals.cleanup || 0) + Number(data.count);
    }
    if (log?.task_id === 'carbon' && data.distance) {
      totals.carbon = (totals.carbon || 0) + carbonKg(data);
      totals.distance = (totals.distance || 0) + Number(data.distance);
    }
    if (log?.task_id === 'biodiversity' && data.count) {
      totals.biodiversity = (totals.biodiversity || 0) + Number(data.count);
    }
    if (log?.task_id === 'local' && data.amount) {
      totals.local = (totals.local || 0) + Number(data.amount);
    }
    if (log?.task_id === 'water' && data.saved) {
      totals.water = (totals.water || 0) + Number(data.saved);
    }
    if (log?.task_id === 'waste' && data.count) {
      totals.waste = (totals.waste || 0) + Number(data.count);
    }
  }
  return totals;
}

function safeParse(raw) {
  if (raw && typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
