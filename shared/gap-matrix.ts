// ===== OA-Team 缺口補齊 · 終始矩陣 單一真相源 (Single Source of Truth) =====
// 全域全端全量全面 | 雙語 (繁中 + English) | 程式化派生 72 配對 (深貫廣通無礙圓通)
//
// 設計哲學：
//   終 (canonical) = 本檔名冊(30) + 陣列對(10) + 樞紐規則 → 程式化派生 72 配對
//   始 (consumer)  = scripts/export-shared-types.js 再生 esggo-shared.d.ts → 各端雙向同步
//   不手寫 72 行配對表 → 杜絕枚舉漂移；任一端需求變更只改本檔 → 重跑 generator → 全端同步
//
// 5T 對齊：
//   Traceable   每配對帶 source_origin='gap-matrix-canon'
//   Trackable   配對由 deriveAllPairings() 可重現輸出 (同輸入同輸出)
//   Tangible    覆蓋率證明 IGapMatrixCoverage 可對外展示
//   Transparent 推導邏輯全公開 (本檔)，零幻覺
//   Trustworthy scripts/verify_gap_matrix.ts 實證 EXIT=0 方可宣稱通過 (不可篡改閉環)

import type {
  GapUnitKey,
  GapHubKind,
  IGapAgent,
  IGapPairing,
  IGapMatrixCoverage,
} from './types.js';

/** 五大陣列定義 (雙語) */
export const GAP_UNITS: ReadonlyArray<{ key: GapUnitKey; zh: string; en: string }> = [
  { key: 'strategy', zh: '策略組', en: 'Strategy' },
  { key: 'technology', zh: '技術組', en: 'Technology' },
  { key: 'creative', zh: '創意組', en: 'Creative' },
  { key: 'marketing', zh: '營銷組', en: 'Marketing' },
  { key: 'guard', zh: '守衛組', en: 'Guard' },
];

/**
 * 30 員名冊 (雙語) — 編號與 §二 30 矩陣嚴格對齊
 * 策略 01-06 / 技術 07-12 / 創意 13-18 / 營銷 19-24 / 守衛 25-30
 */
export const GAP_AGENTS: ReadonlyArray<IGapAgent> = [
  // 策略組 (Strategy)
  { id: 1, title: '萬能蜂后', titleEn: 'Queen Bee', unit: 'strategy' },
  { id: 2, title: '萬能規劃蜂', titleEn: 'Planning Bee', unit: 'strategy' },
  { id: 3, title: '萬能分析蜂', titleEn: 'Analytics Bee', unit: 'strategy' },
  { id: 4, title: '萬能策効蜂', titleEn: 'Strategy Bee', unit: 'strategy' },
  { id: 5, title: '萬能風險蜂', titleEn: 'Risk Bee', unit: 'strategy' },
  { id: 6, title: '萬能優化蜂', titleEn: 'Optimization Bee', unit: 'strategy' },
  // 技術組 (Technology)
  { id: 7, title: '萬能編碼蜂', titleEn: 'Coding Bee', unit: 'technology' },
  { id: 8, title: '萬能算法蜂', titleEn: 'Algorithm Bee', unit: 'technology' },
  { id: 9, title: '萬能架構蜂', titleEn: 'Architecture Bee', unit: 'technology' },
  { id: 10, title: '萬能數據蜂', titleEn: 'Data Bee', unit: 'technology' },
  { id: 11, title: '萬能測試蜂', titleEn: 'Testing Bee', unit: 'technology' },
  { id: 12, title: '萬能設計蜂', titleEn: 'Design Bee', unit: 'technology' },
  // 創意組 (Creative)
  { id: 13, title: '萬能圖像蜂', titleEn: 'Image Bee', unit: 'creative' },
  { id: 14, title: '萬能動畫蜂', titleEn: 'Animation Bee', unit: 'creative' },
  { id: 15, title: '萬能文案蜂', titleEn: 'Copywriting Bee', unit: 'creative' },
  { id: 16, title: '萬能音頻蜂', titleEn: 'Audio Bee', unit: 'creative' },
  { id: 17, title: '萬能市場蜂', titleEn: 'Market Bee', unit: 'creative' },
  { id: 18, title: '萬能社群蜂', titleEn: 'Community Bee', unit: 'creative' },
  // 營銷組 (Marketing)
  { id: 19, title: '萬能增長蜂', titleEn: 'Growth Bee', unit: 'marketing' },
  { id: 20, title: '萬能運營蜂', titleEn: 'Operations Bee', unit: 'marketing' },
  { id: 21, title: '萬能商業分析蜂', titleEn: 'Business Analytics Bee', unit: 'marketing' },
  { id: 22, title: '萬能探路蜂', titleEn: 'Scout Bee', unit: 'marketing' },
  { id: 23, title: '萬能外交蜂', titleEn: 'Diplomacy Bee', unit: 'marketing' },
  { id: 24, title: '萬能調研蜂', titleEn: 'Research Bee', unit: 'marketing' },
  // 守衛組 (Guard)
  { id: 25, title: '萬能測場蜂', titleEn: 'Field-Test Bee', unit: 'guard' },
  { id: 26, title: '萬能追蹤蜂', titleEn: 'Tracking Bee', unit: 'guard' },
  { id: 27, title: '萬能安全蜂', titleEn: 'Security Bee', unit: 'guard' },
  { id: 28, title: '萬能維護蜂', titleEn: 'Maintenance Bee', unit: 'guard' },
  { id: 29, title: '萬能支援蜂', titleEn: 'Support Bee', unit: 'guard' },
  { id: 30, title: '萬能質控蜂', titleEn: 'Quality Bee', unit: 'guard' },
];

/** 陣列 → 成員編號 (由名冊派生, 單一真相源, 不硬編碼) */
export const AGENTS_BY_UNIT: Readonly<Record<GapUnitKey, ReadonlyArray<number>>> = (() => {
  const m: Record<GapUnitKey, number[]> = {
    strategy: [], technology: [], creative: [], marketing: [], guard: [],
  };
  for (const a of GAP_AGENTS) m[a.unit].push(a.id);
  return m;
})();

/** 五陣列兩兩組合 C(5,2)=10 對 (雙向無序, 固定小→大順序) */
export const UNIT_PAIRS: ReadonlyArray<readonly [GapUnitKey, GapUnitKey]> = (() => {
  const pairs: Array<[GapUnitKey, GapUnitKey]> = [];
  const keys = GAP_UNITS.map((u) => u.key);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      pairs.push([keys[i], keys[j]]);
    }
  }
  return pairs;
})();

const SRC: IGapPairing['source_origin'] = 'gap-matrix-canon';

/**
 * 基礎配對: 每陣列對 1:1 職能映射 ×6 = 60
 * 採索引對齊 (各陣列第 i 員互配)，保證 MECE 窮盡且不越界；
 * 人類可讀的具名配對詳見 soul canon §4.1 (本檔保證其不變式: 60 基礎 / 10 陣列對 / 30 觸達)。
 */
export function deriveBasePairings(): IGapPairing[] {
  const out: IGapPairing[] = [];
  for (const [uA, uB] of UNIT_PAIRS) {
    const aList = AGENTS_BY_UNIT[uA];
    const bList = AGENTS_BY_UNIT[uB];
    for (let i = 0; i < 6; i++) {
      out.push({
        a: aList[i], b: bList[i],
        aUnit: uA, bUnit: uB,
        role: 'base',
        source_origin: SRC,
      });
    }
  }
  return out;
}

/**
 * 樞紐配對: 守衛防護 6 + 蜂后總控 6 = 12 (疊加於基礎配對)
 * b=0 為哨兵: 表示覆蓋陣列 (coverage) 所指的全體, 非單一成員
 */
export function deriveHubPairings(): IGapPairing[] {
  const out: IGapPairing[] = [];
  const ALL: GapUnitKey[] = ['strategy', 'technology', 'creative', 'marketing', 'guard'];

  // 守衛防護樞紐 (§4.1.5)
  const guardHubs: ReadonlyArray<[number, GapUnitKey[], GapHubKind]> = [
    [27, ALL, 'guard-defense'], // 安全蜂 × 全陣列
    [30, ALL, 'guard-defense'], // 質控蜂 × 全陣列
    [25, ['creative', 'marketing'], 'guard-defense'],
    [26, ['strategy', 'technology'], 'guard-defense'],
    [28, ['technology', 'marketing'], 'guard-defense'],
    [29, ALL, 'guard-defense'],
  ];
  for (const [id, cov, kind] of guardHubs) {
    out.push({ a: id, b: 0, aUnit: 'guard', bUnit: 'guard', role: 'hub', hubKind: kind, coverage: cov, source_origin: SRC });
  }

  // 蜂后總控樞紐 (§4.1.6)
  const queenHubs: ReadonlyArray<readonly [number, number]> = [
    [1, 14], [1, 7], [1, 13], [1, 20], [1, 22], [1, 27],
  ];
  for (const [qa, qb] of queenHubs) {
    const a = GAP_AGENTS.find((x) => x.id === qa)!;
    const b = GAP_AGENTS.find((x) => x.id === qb)!;
    out.push({ a: qa, b: qb, aUnit: a.unit, bUnit: b.unit, role: 'hub', hubKind: 'queen-command', source_origin: SRC });
  }
  return out;
}

/**
 * §4.1 具名跨組配對範例 (15 對) — 人類可讀層 (documentation exemplars)
 * 不影響 72 數理不變式；此處以名冊 title 為單一真相源解析出 (a,b) 編號，
 * 故若 canon §4.1 標頭與名冊單位不符（例: 設計蜂實屬技術組而非創意組），
 * 以名冊單位為準 (5T 誠實, 不盲從漂移標頭)。
 */
const NAMED_TITLES: ReadonlyArray<readonly [string, string]> = [
  // 策略×創意(實解析為 strat×tech/crea)
  ['萬能規劃蜂', '萬能設計蜂'],
  ['萬能分析蜂', '萬能圖像蜂'],
  ['萬能策効蜂', '萬能動畫蜂'],
  ['萬能風險蜂', '萬能文案蜂'],
  ['萬能優化蜂', '萬能音頻蜂'],
  // 技術×營銷
  ['萬能編碼蜂', '萬能市場蜂'],
  ['萬能算法蜂', '萬能社群蜂'],
  ['萬能架構蜂', '萬能增長蜂'],
  ['萬能數據蜂', '萬能運營蜂'],
  ['萬能測試蜂', '萬能商業分析蜂'],
  // 探險(營銷)×策略
  ['萬能探路蜂', '萬能規劃蜂'],
  ['萬能外交蜂', '萬能策効蜂'],
  ['萬能調研蜂', '萬能分析蜂'],
  ['萬能測場蜂', '萬能風險蜂'],
  ['萬能追蹤蜂', '萬能優化蜂'],
];

/** 由名冊 title 解析出具名配對 (跨陣列 MECE 斷言由 verify 守門) */
export function deriveNamedExemplars(): IGapPairing[] {
  const byTitle = new Map(GAP_AGENTS.map((a) => [a.title, a]));
  return NAMED_TITLES.map(([ta, tb]) => {
    const A = byTitle.get(ta)!;
    const B = byTitle.get(tb)!;
    return {
      a: A.id, b: B.id,
      aUnit: A.unit, bUnit: B.unit,
      role: 'base',
      source_origin: SRC,
    };
  });
}

/** 全量配對 (基礎 + 樞紐) */
export function deriveAllPairings(): IGapPairing[] {
  return [...deriveBasePairings(), ...deriveHubPairings()];
}

/** 覆蓋率證明 — 深貫廣通無礙圓通 */
export const GAP_COVERAGE: IGapMatrixCoverage = {
  totalAgents: 30,
  totalBase: 60,
  totalHub: 12,
  totalPairings: 72,
  arrayPairs: 10,
  reach: '30/30',
};

export default {
  GAP_UNITS, GAP_AGENTS, AGENTS_BY_UNIT, UNIT_PAIRS,
  deriveBasePairings, deriveHubPairings, deriveAllPairings, GAP_COVERAGE,
};
