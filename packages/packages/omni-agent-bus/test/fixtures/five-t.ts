/**
 * 5T 閘門共用測試 fixture
 *
 * 存在的理由 (消除重複與漂移):
 *   - 合規長文只維護一份, 兩支測試共用, 避免門檻調高時要改兩處
 *   - 提供「僅失敗單一維度」的樣本, 讓 GATE_PATTERNS 的逐維度映射可被斷言
 *
 * ⚠️ 門檻耦合警告:
 *   本檔的文本長度是綁定 src/bus.ts 的 GATE_MIN_LENGTH (最高 tangible≥200)。
 *   若該常數調高, 本檔需同步延長; 測試會以「某維度掉下去」的形式紅燈,
 *   失敗訊息會指出具體維度名稱, 不會是無從判讀的單一 boolean。
 */
import type { OATaskResult, SubFrameId } from '../../src/index.js';

/** 與 test/smoke.ts 同一工廠: 填滿 OATaskResult 必填欄位, 不用 as 轉型 */
export function makeResult(
  output: string,
  subFrame: SubFrameId = 'adk',
): OATaskResult {
  return {
    uuid: `${subFrame}-test`,
    version: '0.1.0',
    timestamp: Date.now(),
    subFrame,
    output,
    t5: {
      traceable: true, trackable: true, tangible: true,
      transparent: true, trustworthy: true,
    },
    hashLock: 'a'.repeat(64),
  };
}

/**
 * 合規輸出: 每行對應一個 5T 維度, 長度必須 > 200 (tangible 門檻最高)
 * 與 smoke.ts 的 GOOD 同構, 但更長以留緩衝。
 */
export const COMPLIANT_OUTPUT = [
  '【來源/source_origin】OA-Team 子框架 core | 引用 GRI/ISO 對齊之來源, 保留 reference 清單',
  '【透明/揭露】整體比率 98%, 公開揭露所有失敗維度與改進計畫',
  '【量化/達成】本次完成 12 項交付物, 建立可追溯元件, 導入 3 個子框架並推動上線, 數量與金額均已覈算',
  '【信任/封印】已建立 SHA256 hash 封印, 通過驗證與審計, audit trail 完整記錄',
  '【追蹤/期間】期間為 2026 年度第 38 週, 自 2026-09-25 至 2026-09-28, 所有事件均已追蹤 monitor',
  '原始產出: omni-agent-bus 圓通扇出驗證完成, 儀表板同步更新。',
].join('\n');

/** 明確不合格: 遠低於所有長度門檻, 五維全滅 */
export const REJECTED_OUTPUT = '做完了。';

/**
 * 中性填充字: 中文數字, 不含任何英文字母、阿拉伯數字或 5T 關鍵詞。
 * 用來把文本拉長到過長度門檻, 從而「單獨」控制關鍵詞這個變因。
 */
const NEUTRAL = '一二三四五六七八九十'.repeat(30); // 300 字, 純中性

/**
 * 逐維度關鍵詞。刻意「每個維度留一組不使用」, 以便單獨剔除某維度。
 * 填入順序刻意交錯, 避免相鄰維度誤含他維關鍵詞。
 */
const KEYWORDS = {
  transparent: '整體比率 98%',
  tangible: '已完成並建立元件',
  trustworthy: 'SHA256 封印 審計',
  trackable: '2026 年度期間',
  traceable: '來源 GRI ISO 引用 reference',
} as const;

export type FiveTDim = keyof typeof KEYWORDS;

/**
 * 構造「僅失敗 dim 這一個維度」的樣本。
 *
 * 原理: 先以 NEUTRAL 把長度拉過所有門檻 (最高 200), 再填入其餘四維的關鍵詞,
 * 最後「不」填 dim 自己的關鍵詞 → 該維度因正則不符而失敗, 其餘四維皆通過。
 */
export function defeatsOnly(dim: FiveTDim): string {
  const parts: string[] = [NEUTRAL];
  for (const k of Object.keys(KEYWORDS) as FiveTDim[]) {
    if (k === dim) continue; // 唯一不填的維度
    parts.push(KEYWORDS[k]);
  }
  return parts.join(' ');
}

/**
 * 逐關鍵詞 token — 直接對應 src/bus.ts 的 GATE_PATTERNS 各條正則的分支。
 *
 * 為什麼需要這一層 (mutation test 實證的教訓):
 *   維度層級的 `defeatsOnly()` 抓不到「正則分支退化」。實測把
 *   GATE_PATTERNS.trustworthy 從 /ZKP|hash|sha|封印|驗證|審計|audit/i 砍成 /封印/i,
 *   五維度斷言仍全綠 —— 因為合規樣本同時含「封印」與「hash」, 砍掉哪個都仍匹配。
 *   唯有「僅含單一 token」的樣本, 才能鎖住每一個分支。
 */
export const KEYWORD_TOKENS: Record<FiveTDim, string[]> = {
  traceable: ['GRI', 'ISO', 'TCFD', 'SDG', '來源', '引用', 'reference'],
  transparent: ['%', '百分比', '比率', '比例', '公開', '揭露'],
  tangible: ['完成', '達成', '實現', '推動', '建立', '導入', '數量', '金額'],
  trustworthy: ['ZKP', 'hash', 'sha', '封印', '驗證', '審計', 'audit'],
  trackable: ['2027', '年度', '期間', '日期', '追蹤', 'monitor'],
};

/**
 * 構造「dim 維度僅靠 token 這一個關鍵詞通過」的樣本。
 * 其餘四維各填一組關鍵詞, dim 維度則只放 token。
 * 若 GATE_PATTERNS[dim] 移除 token 這個分支, 本樣本即會失敗 dim → 測試轉紅。
 */
export function withOnlyToken(dim: FiveTDim, token: string): string {
  const parts: string[] = [NEUTRAL, token];
  for (const k of Object.keys(KEYWORDS) as FiveTDim[]) {
    if (k === dim) continue; // dim 只由上面的單一 token 滿足
    parts.push(KEYWORDS[k]);
  }
  return parts.join(' ');
}
