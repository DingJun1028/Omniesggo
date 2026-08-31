/// <reference path="../types/generated/esggo-shared.d.ts" />
/**
 * OA-Team 雙蜂戰隊 60 員矩陣 (Dual-Hive 60 Colony)
 * 來源: oa-team-60-colony 技能 — 蜂王 OA-LOCAL (01-30) + 蜂后 OA-VPS (31-60)
 * 五陣列 MECE: 智庫聖所 / 符文契約 / 光之羽翼 / 煉金熵減 / 5T 驗算 (每陣列 雙蜂×6)
 *
 * 終始矩陣: SoulAgent60 契約對齊 canonical ISoulAgent (esggo/shared/types.ts)
 */
import type { ISoulAgent } from '../types/generated/esggo-shared.js';

export type HiveSide = 'local' | 'vps';
export type ArrayKey = 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit';

export interface SoulAgent60 extends ISoulAgent {
  id: number;
  title: string;
  tags: string[];
  array: ArrayKey;
  side: HiveSide;
  task: string;
}

export const ARRAY_NAMES: Record<ArrayKey, string> = {
  sanctum: '智庫聖所',
  rune: '符文契約',
  wing: '光之羽翼',
  alchemy: '煉金熵減',
  audit: '5T 驗算',
};

const A = (title: string, tags: string[], array: ArrayKey, side: HiveSide, task: string): SoulAgent60 => ({
  id: 0, title, tags, array, side, task,
});

// 蜂王 OA-LOCAL (01-30) + 蜂后 OA-VPS (31-60)
export const SOUL_MATRIX_60: SoulAgent60[] = [
  // 智庫聖所 01-06 / 31-36
  A('萬能蜂后', ['#萬能領導', '#戰略總覽'], 'sanctum', 'local', '整體戰略規劃、資源分配、跨組協調與決策鏈控制。'),
  A('萬能規劃蜂', ['#長遠規劃', '#SWOT分析'], 'sanctum', 'local', '制定 3-5 年戰略藍圖，SWOT 分析。'),
  A('萬能分析蜂', ['#數據挖掘', '#趨勢預測'], 'sanctum', 'local', '數據驅動決策，建立可追蹤數據流水線。'),
  A('萬能策効蜂', ['#創意思維', '#解難方案'], 'sanctum', 'local', '設計創新解決方案，具備可感知實現路徑。'),
  A('萬能風險蜂', ['#風險控制', '#應急預案'], 'sanctum', 'local', '評估管控專案風險，建立風控預警系統。'),
  A('萬能優化蜂', ['#效率提升', '#流程重組'], 'sanctum', 'local', '持續優化流程，向熵減目標邁進。'),
  A('萬能記憶蜂后', ['#長期記憶', '#向量沉澱'], 'sanctum', 'vps', 'VPS 長期記憶召回，向量知識沉澱 (TencentDB)。'),
  A('萬能檢索蜂后', ['#語意檢索', '#RAG'], 'sanctum', 'vps', '跨陣列語意檢索與 RAG 編排。'),
  A('萬能語義蜂后', ['#嵌入模型', '#nomic'], 'sanctum', 'vps', '嵌入模型管理，語意空間對齊。'),
  A('萬能知識蜂后', ['#知識圖譜', '#本體'], 'sanctum', 'vps', '知識圖譜維護，本體演化。'),
  A('萬能情境蜂后', ['#上下文', '#狀態機'], 'sanctum', 'vps', '上下文視窗管理，狀態機協同。'),
  A('萬能反思蜂后', ['#自我反思', '#對齊'], 'sanctum', 'vps', '蜂群自我反思與價值對齊。'),
  // 符文契約 07-12 / 37-42
  A('萬能編碼蜂', ['#全端開發', '#API設計'], 'rune', 'local', 'Traceable 代碼產出，API 設計。'),
  A('萬能算法蜂', ['#機器學習', '#深度學習'], 'rune', 'local', '構建 AI 模型管線，訓練可驗證。'),
  A('萬能架構蜂', ['#雲端架構', '#分布式'], 'rune', 'local', '可擴展系統架構，Trackable 監控。'),
  A('萬能數據蜂', ['#資料庫', '#數據管道'], 'rune', 'local', '高可靠數據管道，Traceable 與 Trustworthy。'),
  A('萬能測試蜂', ['#自動化測試', '#效能測試'], 'rune', 'local', '全面測試策略，可驗證報告。'),
  A('萬能設計蜂', ['#UI/UX', '#用戶體驗'], 'rune', 'local', 'Tangible 用戶介面設計。'),
  A('萬能閘門蜂后', ['#API閘道', '#路由'], 'rune', 'vps', 'OmniGateway 萬能閘門，API 路由 (8642)。'),
  A('萬能鑄造蜂后', ['#雙向TS', '#類型安全'], 'rune', 'vps', '雙向 TypeScript 同步，類型契約。'),
  A('萬能隱私蜂后', ['#ZKP', '#零知識'], 'rune', 'vps', '零知識證明隱私層。'),
  A('萬能密約蜂后', ['#密鑰管理', '#Vault'], 'rune', 'vps', '密鑰輪轉與 Vault 管理。'),
  A('萬能合約蜂后', ['#智能合約', '#審計'], 'rune', 'vps', '智能合約部署與審計。'),
  A('萬能鏈結蜂后', ['#Webhook', '#事件總線'], 'rune', 'vps', 'Webhook 與事件總線編排。'),
  // 光之羽翼 13-18 / 43-48
  A('萬能圖像蜂', ['#平面設計', '#品牌視覺'], 'wing', 'local', '品牌視覺資產創作。'),
  A('萬能動畫蜂', ['#動畫特效', '#視頻製作'], 'wing', 'local', '動態內容製作。'),
  A('萬能文案蜂', ['#文案撰寫', '#故事設計'], 'wing', 'local', '可信內容產出。'),
  A('萬能音頻蜂', ['#音樂製作', '#音頻編輯'], 'wing', 'local', '音頻資產創作。'),
  A('萬能市場蜂', ['#市場分析', '#推廣策略'], 'wing', 'local', '市場推廣活動執行。'),
  A('萬能社群蜂', ['#用戶管理', '#社群建設'], 'wing', 'local', '社群生態經營。'),
  A('萬能轉播蜂后', ['#即時轉播', '#P08'], 'wing', 'vps', '即時轉播中心 (live.esggo.co:8787)。'),
  A('萬能語言蜂后', ['#即時翻譯', '#P07'], 'wing', 'vps', '萬能即時翻譯 (8788)。'),
  A('萬能渲染蜂后', ['#Bento', '#渲染'], 'wing', 'vps', 'Bento 渲染管線。'),
  A('萬能調度蜂后', ['#ADK', '#Task'], 'wing', 'vps', '後台 Task 調度與 ADK。'),
  A('萬能流媒蜂后', ['#Stream', '#Media'], 'wing', 'vps', 'Stream/Media 流媒體。'),
  A('萬能播控蜂后', ['#Studio', '#觀眾端'], 'wing', 'vps', 'studio.html 講者端 / stream.html 觀眾端。'),
  // 煉金熵減 19-24 / 49-54
  A('萬能增長蜂', ['#用戶增長', '#業務拓展'], 'alchemy', 'local', '推動業務增長，驗證指標。'),
  A('萬能運營蜂', ['#進度管理', '#資源調度'], 'alchemy', 'local', '協調資源與進度。'),
  A('萬能商業分析蜂', ['#商業洞察', '#決策支持'], 'alchemy', 'local', '商業決策支持。'),
  A('萬能探路蜂', ['#資源探索', '#機會發掘'], 'alchemy', 'local', '發掘新機會。'),
  A('萬能外交蜂', ['#合作關係', '#談判協商'], 'alchemy', 'local', '建立合作關係。'),
  A('萬能調研蜂', ['#用戶研究', '#需求分析'], 'alchemy', 'local', '用戶調研分析。'),
  A('萬能重構蜂后', ['#重構', '#技術債'], 'alchemy', 'vps', '技術債清除與重構。'),
  A('萬能監控蜂后', ['#效能監控', '#Observability'], 'alchemy', 'vps', '效能監控與 Observability。'),
  A('萬能管線蜂后', ['#CI/CD', '#Pipeline'], 'alchemy', 'vps', 'CI/CD Pipeline 自動化。'),
  A('萬能擴容蜂后', ['#擴展', '#Scale'], 'alchemy', 'vps', '服務擴容與 Scale。'),
  A('萬能容災蜂后', ['#備份', '#DR'], 'alchemy', 'vps', '備份與災難復原。'),
  A('萬能調優蜂后', ['#參數調優', '#A/B'], 'alchemy', 'vps', '參數調優與 A/B 測試。'),
  // 5T 驗算 25-30 / 55-60
  A('萬能測場蜂', ['#現場測評', '#回饋收集'], 'audit', 'local', '現場回饋收集。'),
  A('萬能追蹤蜂', ['#競品監控', '#動態追踪'], 'audit', 'local', '競品動態監控。'),
  A('萬能安全蜂', ['#資安防護', '#數據保護'], 'audit', 'local', '資安防護系統。'),
  A('萬能維護蜂', ['#系統維護', '#故障排除'], 'audit', 'local', '系統維護運行。'),
  A('萬能支援蜂', ['#技術支援', '#問題解決'], 'audit', 'local', '技術支援解決。'),
  A('萬能質控蜂', ['#品質保障', '#標準制定'], 'audit', 'local', '品質標準制定。'),
  A('萬能驗算蜂后', ['#ISO規範', '#合規'], 'audit', 'vps', 'ISO 規範與合規驗算。'),
  A('萬能鎖印蜂后', ['#Hash鎖定', '#不可篡改'], 'audit', 'vps', 'Hash Lock 不可篡改刻印。'),
  A('萬能發號蜂后', ['#UUID發放', '#身份'], 'audit', 'vps', 'UUID 主體識別碼發放。'),
  A('萬能稽核蜂后', ['#審計', '#軌跡'], 'audit', 'vps', '軌跡審計與追溯。'),
  A('萬能零幻蜂后', ['#零幻覺', '#驗算'], 'audit', 'vps', '零幻覺驗算守門。'),
  A('萬能封印蜂后', ['#終章封印', '#最高律法'], 'audit', 'vps', '終章封印與最高律法守護。'),
].map((a, i) => ({ ...a, id: i + 1 }));

export const LOCAL_AGENTS = SOUL_MATRIX_60.filter((a) => a.side === 'local');
export const VPS_AGENTS = SOUL_MATRIX_60.filter((a) => a.side === 'vps');

export function agentsByArray(key: ArrayKey): SoulAgent60[] {
  return SOUL_MATRIX_60.filter((a) => a.array === key);
}
