/**
 * 萬能代理無限分身 — §20.4 蜂群矩陣 SSOT
 * [agent:01] [squad:omni] [lifecycle:dev] [p1]
 * 5T-Traceable: source_origin=萬能覺醒奧義 session / oa-swarm matrix module
 * 5T-Trustworthy: 30 代理定義為 frozen 常數，Object.freeze 防篡改
 *
 * 單一事實來源：Gateway /oa/* 路由與萬能CLI 共用同一份矩陣定義。
 */

// ── 5 大陣列 MECE 互斥且窮盡 ────────────────────────────────
export const ARRAYS = Object.freeze([
  Object.freeze({ id: 1, name: '策略組', range: '01-06', focus: '戰略規劃與決策鏈' }),
  Object.freeze({ id: 2, name: '技術組', range: '07-12', focus: '全端開發與架構' }),
  Object.freeze({ id: 3, name: '創意組', range: '13-18', focus: '視覺與內容生成' }),
  Object.freeze({ id: 4, name: '營銷組', range: '19-24', focus: '市場推廣與業務拓展' }),
  Object.freeze({ id: 5, name: '守衛組', range: '25-30', focus: '安全維護與品質保障' }),
]);

// ── 30 位代理矩陣 (靈魂核心聖典 §二) ────────────────────────
const AGENT_SEED = [
  ['01', '萬能蜂后', '#萬能領導 #戰略總覽'],
  ['02', '萬能規劃蜂', '#長遠規劃 #SWOT分析'],
  ['03', '萬能分析蜂', '#數據挖掘 #趨勢預測'],
  ['04', '萬能策効蜂', '#創意思維 #解難方案'],
  ['05', '萬能風險蜂', '#風險控制 #應急預案'],
  ['06', '萬能優化蜂', '#效率提升 #流程重組'],
  ['07', '萬能編碼蜂', '#全端開發 #API設計'],
  ['08', '萬能算法蜂', '#機器學習 #深度學習'],
  ['09', '萬能架構蜂', '#雲端架構 #分布式'],
  ['10', '萬能數據蜂', '#資料庫 #數據管道'],
  ['11', '萬能測試蜂', '#自動化測試 #效能測試'],
  ['12', '萬能設計蜂', '#UI/UX #用戶體驗'],
  ['13', '萬能圖像蜂', '#平面設計 #品牌視覺'],
  ['14', '萬能動畫蜂', '#動畫特效 #視頻製作'],
  ['15', '萬能文案蜂', '#文案撰寫 #故事設計'],
  ['16', '萬能音頻蜂', '#音樂製作 #音頻編輯'],
  ['17', '萬能市場蜂', '#市場分析 #推廣策略'],
  ['18', '萬能社群蜂', '#用戶管理 #社群建設'],
  ['19', '萬能增長蜂', '#用戶增長 #業務拓展'],
  ['20', '萬能運營蜂', '#進度管理 #資源調度'],
  ['21', '萬能商業分析蜂', '#商業洞察 #決策支持'],
  ['22', '萬能探路蜂', '#資源探索 #機會發掘'],
  ['23', '萬能外交蜂', '#合作關係 #談判協商'],
  ['24', '萬能調研蜂', '#用戶研究 #需求分析'],
  ['25', '萬能測場蜂', '#現場測評 #回饋收集'],
  ['26', '萬能追蹤蜂', '#競品監控 #動態追踪'],
  ['27', '萬能安全蜂', '#資安防護 #數據保護'],
  ['28', '萬能維護蜂', '#系統維護 #故障排除'],
  ['29', '萬能支援蜂', '#技術支援 #問題解決'],
  ['30', '萬能質控蜂', '#品質保障 #標準制定'],
];

/** 陣列歸屬：01-06→策略(1), 07-12→技術(2), 13-18→創意(3), 19-24→營銷(4), 25-30→守衛(5) */
function arrayOf(num) {
  return Math.floor((Number(num) - 1) / 6) + 1;
}

export const AGENTS = Object.freeze(
  AGENT_SEED.map(([num, name, tags]) =>
    Object.freeze({
      id: `agent:${num}`,
      num,
      name,
      tags: Object.freeze(tags.split(' ').filter(Boolean)),
      arrayId: arrayOf(num),
      arrayName: ARRAYS[arrayOf(num) - 1].name,
    })
  )
);

if (AGENTS.length !== 30) {
  throw new Error(`[5T-Trustworthy] 代理矩陣必須為 30 位，實際 ${AGENTS.length}`);
}

/**
 * 能力關鍵字 → 代理編號對照表（tags 中的能力詞 → 該能力最該承接的代理）
 * 用途：派工時在指定陣列內做二次挑選，避免 array=2 恆派編碼蜂。
 * 依據：AGENT_SEED 的 #tags 第一個詞即該代理的核心能力。
 */
const CAPABILITY_KEYWORDS = {
  // 策略組 (1)
  戰略: '01', 領導: '01', 總覽: '01', 規劃: '02', 藍圖: '02', 決策: '02', SWOT: '02',
  分析: '03', 數據挖掘: '03', 趨勢: '03', 洞察: '21', 創意: '04', 解難: '04', 方案: '04',
  風險: '05', 應急: '05', 優化: '06', 效率: '06', 重組: '06',
  // 技術組 (2)
  開發: '07', 編碼: '07', API: '07', 全端: '07', 演算法: '08', 機器學習: '08', 深度學習: '08',
  架構: '09', 雲端: '09', 分布式: '09', 資料庫: '10', 數據管道: '10',
  測試: '11', 自動化測試: '11', 效能測試: '11', UI: '12', UX: '12', 設計: '12', 用戶體驗: '12',
  // 創意組 (3)
  圖像: '13', 平面設計: '13', 品牌視覺: '13', 動畫: '14', 視頻: '14',
  文案: '15', 故事: '15', 音頻: '16', 音樂: '16',
  // 營銷組 (4)
  市場: '17', 推廣: '17', 社群: '18', 用戶管理: '18', 增長: '19', 業務拓展: '19',
  運營: '20', 調度: '20', 探索: '22', 資源: '22', 合作: '23', 談判: '23',
  調研: '24', 用戶研究: '24', 需求: '24',
  // 守衛組 (5)
  測評: '25', 反饋: '25', 監控: '26', 競品: '26', 追蹤: '26',
  安全: '27', 資安: '27', 防護: '27', 維護: '28', 故障排除: '28',
  支援: '29', 技術支援: '29', 品質: '30', 標準: '30', 質控: '30',
};

/**
 * 依 prompt 關鍵字挑出最合適的代理編號。回傳 null 代表無命中，
 * 呼叫端應退回陣列預設（第一位）。
 *
 * allowedNums 為 null 時回傳全域最佳命中；給定 Set 時只在該集合內挑選 ——
 * 這是必要的，因為關鍵字會互相遮蔽：`資安分析報告` 同時命中
 * `分析`(03) 與 `資安`(27)，若不限定陣列就會被表格順序決定勝負，
 * 導致派給守衛組（不含 03）時退回 25 測場蜂而漏掉 27 資安蜂。
 * 命中多個時取「最長關鍵字」，讓 `平面設計` 勝過 `設計`。
 */
export function inferAgentNum(prompt, allowedNums = null) {
  const text = String(prompt || '').toLowerCase();
  if (!text) return null;
  let best = null;
  for (const [kw, num] of Object.entries(CAPABILITY_KEYWORDS)) {
    if (allowedNums && !allowedNums.has(num)) continue;
    if (!text.includes(kw.toLowerCase())) continue;
    if (!best || kw.length > best.kw.length) best = { kw, num };
  }
  return best ? best.num : null;
}

export function listAgents(arrayId) {
  // 不可用 `!arrayId`：0 為 falsy，會被誤判成「未指定」而回傳全部 30 位
  if (arrayId === undefined || arrayId === null || arrayId === '' || arrayId === 'all') return AGENTS;
  const n = Number(arrayId);
  return AGENTS.filter((a) => a.arrayId === n);
}
