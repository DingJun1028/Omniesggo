/**
 * @esggo/aios-matrix v0.1.0
 *
 * AIOS 系統終極融合矩陣（MECE 協同總表 v5.0）TypeScript 契約實作:
 *   「元件即代理」(Component as Agent) — 12 大 MECE 功能維度
 *   精確映射至 5 大 AI 行為核心，每維度恰屬一核心（不重不漏）。
 *
 * 5 大核心 (I–V): 感知 Perception / 認知 Cognition / 記憶 Memory /
 *                 表達 Expression / 連結 Nexus
 * 12 維度 (1–12): 核心引擎 / 符文系統 / 代理網絡 / 智庫中樞 / 同步矩陣 /
 *                 接口協議 / 進化環 / 監控體 / 安全域 / 元架構 /
 *                 標籤體系 / 主題引擎
 *
 * source_origin: 《AIOS 系統終極融合矩陣：MECE 協同總表》v5.0
 *   （Omniesggo 專案文件庫上傳文件；2026-11-12 全文逐條核對後編碼）
 *
 * 誠實揭露（不硬湊數字）:
 *   1. 藍圖自載「總計 64 項」；本檔可數條目逐條列舉共 92 項
 *      （45 維度條目 + 5 核心層條目 + 7 公理實踐 + 8 化身 + 4 聖柱
 *        + 6 奧義 + 4 公理 + 5 技術基石 + 5 外部整合 + 3 世界觀）。
 *      兩者計數口徑差異待釐清，verifyAiosTopology() 如實並列兩數。
 *   2. 藍圖稱「十大化身」但總表僅具名 8 位（真理探測者、第一建築師、
 *      熵減煉金師、啟蒙導師、符文連結師、秩序守衛者、創世編織者、
 *      代理執行官），餘 2 位藍圖未列舉 → AIOS_DECLARED_AVATAR_COUNT = 10
 *      與 AIOS_AVATARS.length = 8 如實並存。
 *   3. De-Google 政策: 藍圖提及之 Gemini API 僅為敘事引用
 *      (narrative-reference)，依倉庫 De-Google 政策不得成為倉內依賴；
 *      本套件零 runtime 依賴，測試強制把關。
 */

export const AIOS_SOURCE_ORIGIN =
  'AIOS 系統終極融合矩陣：MECE 協同總表 v5.0（Omniesggo 專案文件庫）' as const;

/** 藍圖自載化身總數（表內僅具名 8 位，如實並存）。 */
export const AIOS_DECLARED_AVATAR_COUNT = 10 as const;

/** 藍圖標題自載之總項數（計數口徑待釐清，僅作對照不作驗收）。 */
export const AIOS_DECLARED_ITEM_COUNT = 64 as const;

export type AiosCoreId = 'perception' | 'cognition' | 'memory' | 'expression' | 'nexus';

export type AiosDimensionId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

export interface AiosCore {
  readonly id: AiosCoreId;
  readonly index: 1 | 2 | 3 | 4 | 5;
  readonly zh: string;
  readonly en: string;
  readonly duty: string;
  /** 藍圖歸於核心層級之模組（僅記憶核心有：Asset Vault / SDR Archive）。 */
  readonly modules?: readonly string[];
  /** 藍圖歸於核心層級之實踐（僅表達核心有：心流儀錶盤等三項）。 */
  readonly practices?: readonly string[];
}

export interface AiosDimension {
  readonly id: AiosDimensionId;
  readonly zh: string;
  readonly en: string;
  readonly coreId: AiosCoreId;
  readonly concepts: readonly string[];
  readonly practices: readonly string[];
}

export interface AiosAvatar {
  readonly zh: string;
  /** 藍圖未提供英文名者為 null（如：符文連結師），不杜撰。 */
  readonly en: string | null;
  readonly coreId: AiosCoreId;
  readonly practice?: string;
}

export interface AiosPillar {
  readonly zh: string;
  readonly alias: string;
  /** 藍圖未為該聖柱載明 KPI 者為 null（如：進化性），不杜撰。 */
  readonly kpi: string | null;
}

export interface AiosSecretArt {
  readonly zh: string;
  readonly practice: string;
}

export interface AiosAxiom {
  readonly zh: string;
  readonly coreId: AiosCoreId;
  readonly practices: readonly string[];
}

export interface AiosExternalIntegration {
  readonly name: string;
  readonly coreId: AiosCoreId;
  readonly status: 'narrative-reference';
  readonly note: string;
}

export interface AiosTechStackItem {
  readonly name: string;
  readonly role: string;
  /** 是否已存在於本倉庫 manifest 依賴（如實標註，非宣稱）。 */
  readonly inRepoDependency: boolean;
}

export interface AiosWorldviewPrinciple {
  readonly zh: string;
  readonly practice: string;
}

export const AIOS_CORES: readonly AiosCore[] = Object.freeze([
  {
    id: 'perception',
    index: 1,
    zh: '感知核心',
    en: 'Perception',
    duty: '數據攝取與監控',
  },
  {
    id: 'cognition',
    index: 2,
    zh: '認知核心',
    en: 'Cognition',
    duty: '決策制定與進化',
  },
  {
    id: 'memory',
    index: 3,
    zh: '記憶核心',
    en: 'Memory',
    duty: '知識沉澱與資產化',
    modules: Object.freeze([
      'Asset Vault（NFT 卡牌鑄造）',
      'SDR Archive（本地知識庫）',
    ]),
  },
  {
    id: 'expression',
    index: 4,
    zh: '表達核心',
    en: 'Expression',
    duty: '輸出與可視化',
    practices: Object.freeze([
      '心流儀錶盤',
      '架構美學預言',
      '視覺引導（光精靈）',
    ]),
  },
  {
    id: 'nexus',
    index: 5,
    zh: '連結核心',
    en: 'Nexus',
    duty: '架構與整合控制',
  },
] as const);

/**
 * 12 大 MECE 維度（藍圖自帶編號 1–12）。
 * 核心-維度映射（每維度恰屬一核心）:
 *   感知 {6, 8} / 認知 {1, 7, 10} / 記憶 {4, 11} / 表達 {12} / 連結 {2, 3, 5, 9}
 */
export const AIOS_DIMENSIONS: readonly AiosDimension[] = Object.freeze([
  {
    id: 1,
    zh: '萬能核心引擎',
    en: 'Core Engine',
    coreId: 'cognition',
    concepts: Object.freeze(['中央決策', '量子決策模型']),
    practices: Object.freeze([
      'Strategy Oracle（策略模擬）',
      '因果推演矩陣（決策式奧義）',
    ]),
  },
  {
    id: 2,
    zh: '萬能符文系統',
    en: 'Rune System',
    coreId: 'nexus',
    concepts: Object.freeze(['API 整合']),
    practices: Object.freeze(['萬能符文（Omni-Rune）', '永生玫瑰綻放']),
  },
  {
    id: 3,
    zh: '萬能代理網絡',
    en: 'Agent Network',
    coreId: 'nexus',
    concepts: Object.freeze(['任務分派']),
    practices: Object.freeze([
      '代理星群',
      '多維度協作協議',
      '萬能化身（Omni-Avatar）',
    ]),
  },
  {
    id: 4,
    zh: '萬能智庫中樞',
    en: 'Knowledge Hub',
    coreId: 'memory',
    concepts: Object.freeze(['知識圖譜', '向量存儲']),
    practices: Object.freeze([
      'Quantum Lattice（知識節點量子化）',
      '記憶煉金術',
    ]),
  },
  {
    id: 5,
    zh: '萬能同步矩陣',
    en: 'Sync Matrix',
    coreId: 'nexus',
    concepts: Object.freeze(['雙向同步']),
    practices: Object.freeze([
      '循環防呆（狀態/版本檢查）',
      '雙向同步引擎',
    ]),
  },
  {
    id: 6,
    zh: '萬能接口協議',
    en: 'Interface Protocol',
    coreId: 'perception',
    concepts: Object.freeze(['多模態接口', '自適應 UI']),
    practices: Object.freeze(['匠人意圖顯現', 'Spectral Scanner（光學折射）']),
  },
  {
    id: 7,
    zh: '萬能進化環',
    en: 'Evolution Loop',
    coreId: 'cognition',
    concepts: Object.freeze(['強化學習', '架構演化']),
    practices: Object.freeze(['熵減演算', '自我重寫核心（超越式奧義）']),
  },
  {
    id: 8,
    zh: '萬能監控體',
    en: 'Monitoring Body',
    coreId: 'perception',
    concepts: Object.freeze(['日誌追蹤', '異常檢測']),
    practices: Object.freeze([
      'Data Lake Sensor（異常偵測）',
      'Health Diagnostician（雙軌診斷）',
    ]),
  },
  {
    id: 9,
    zh: '萬能安全域',
    en: 'Security Domain',
    coreId: 'nexus',
    concepts: Object.freeze(['遠界保護']),
    practices: Object.freeze([
      '權能封印（Authority Seals）',
      '零信任架構',
      'Audit Chain（HITL）',
    ]),
  },
  {
    id: 10,
    zh: '萬能元架構',
    en: 'Meta Architecture',
    coreId: 'cognition',
    concepts: Object.freeze(['架構自生成', '元學習']),
    practices: Object.freeze(['萬能元鑰（OmniKey）', '元圖（Omni-Schema）']),
  },
  {
    id: 11,
    zh: '萬能標籤體系',
    en: 'Tagging System',
    coreId: 'memory',
    concepts: Object.freeze(['元數據管理']),
    practices: Object.freeze(['結構化標籤', '語義印記']),
  },
  {
    id: 12,
    zh: '萬能主題引擎',
    en: 'Theme Engine',
    coreId: 'expression',
    concepts: Object.freeze(['UI 主題', '交互模式']),
    practices: Object.freeze([
      'GenUI Canvas（組件渲染）',
      'Omni-Cell（最小數據單元）',
    ]),
  },
] as const);

/** 藍圖表內具名之 8 位化身（自載總數 10 位，餘 2 位未列舉）。 */
export const AIOS_AVATARS: readonly AiosAvatar[] = Object.freeze([
  {
    zh: '真理探測者',
    en: 'Veritas',
    coreId: 'perception',
    practice: '監控系統的宇宙背景音階',
  },
  {
    zh: '第一建築師',
    en: 'Prime Architect',
    coreId: 'cognition',
  },
  {
    zh: '熵減煉金師',
    en: 'Alchemist',
    coreId: 'cognition',
  },
  {
    zh: '啟蒙導師',
    en: 'Luminar',
    coreId: 'expression',
    practice: '聖典智慧轉化為啟蒙詩篇',
  },
  {
    zh: '符文連結師',
    en: null,
    coreId: 'nexus',
  },
  {
    zh: '秩序守衛者',
    en: 'Aegis',
    coreId: 'nexus',
  },
  {
    zh: '創世編織者',
    en: 'Genesis Weaver',
    coreId: 'nexus',
  },
  {
    zh: '代理執行官',
    en: 'Agentus',
    coreId: 'nexus',
  },
] as const);

/** 四大聖柱（藍圖「補充：核心法則」表）。 */
export const AIOS_PILLARS: readonly AiosPillar[] = Object.freeze([
  { zh: '簡潔性', alias: '直覺脈動', kpi: '零摩擦整合' },
  { zh: '快速性', alias: '量子共鳴', kpi: '<300ms 響應時間' },
  { zh: '穩定性', alias: '永恆堅韌', kpi: '漏洞發現率 <0.001%' },
  { zh: '進化性', alias: '奇點迭代', kpi: null },
] as const);

/** 六式奧義：構成「單次迴圈的效率與完整性」。 */
export const AIOS_SECRET_ARTS: readonly AiosSecretArt[] = Object.freeze([
  { zh: '感知式', practice: '奈秒級監測' },
  { zh: '解析式', practice: '意圖識別' },
  { zh: '決策式', practice: '零錯誤決策' },
  { zh: '執行式', practice: '光速通道' },
  { zh: '反饋式', practice: '遞歸學習' },
  { zh: '超越式', practice: '自我重寫' },
] as const);

/** 藍圖對六式奧義閉環之自述（原文照錄語義）。 */
export const AIOS_SECRET_ART_LOOP_NOTE =
  '構成「單次迴圈的效率與完整性」，確保從概念到知識沉澱的閉環' as const;

/** 四大公理（各歸屬一核心）。 */
export const AIOS_AXIOMS: readonly AiosAxiom[] = Object.freeze([
  {
    zh: '終始一如',
    coreId: 'cognition',
    practices: Object.freeze(['原罪煉金術（技術價轉化）']),
  },
  {
    zh: '萬能平衡',
    coreId: 'cognition',
    practices: Object.freeze(['宇宙常數調節器', '抑制極端']),
  },
  {
    zh: '創元實錄',
    coreId: 'memory',
    practices: Object.freeze(['萬能編年史（棄牌堆）', 'K（知識）資源']),
  },
  {
    zh: '萬有引力',
    coreId: 'nexus',
    practices: Object.freeze(['矩陣佈局學', '共鳴爆發（協同效應）']),
  },
] as const);

/**
 * 外部整合：藍圖敘事引用。依 De-Google 政策，Gemini API
 * 不得成為倉內依賴；本清單僅作藍圖如實記錄，不代表已整合。
 */
export const AIOS_EXTERNAL_INTEGRATIONS: readonly AiosExternalIntegration[] = Object.freeze([
  {
    name: 'AITable.ai',
    coreId: 'memory',
    status: 'narrative-reference',
    note: '藍圖稱「知識聖殿的數據基石」；本倉未整合',
  },
  {
    name: 'Supabase',
    coreId: 'memory',
    status: 'narrative-reference',
    note: '藍圖稱 PostgreSQL 數據庫；倉庫另有既存 Supabase 遷移案',
  },
  {
    name: 'Straico AI',
    coreId: 'nexus',
    status: 'narrative-reference',
    note: '藍圖稱「總令牌消耗方」；本倉未整合',
  },
  {
    name: 'Boost.space',
    coreId: 'nexus',
    status: 'narrative-reference',
    note: '藍圖稱「雙核心同步」；本倉未整合',
  },
  {
    name: 'Gemini API',
    coreId: 'nexus',
    status: 'narrative-reference',
    note: 'De-Google 政策：僅敘事引用，禁止成為倉內依賴',
  },
] as const);

/** 技術基石（inRepoDependency 如實標註現況）。 */
export const AIOS_TECH_STACK: readonly AiosTechStackItem[] = Object.freeze([
  { name: 'TypeScript', role: '類型安全', inRepoDependency: true },
  { name: 'Node.js', role: '運行時', inRepoDependency: true },
  { name: 'AITable.ai', role: '知識數據基石（藍圖敘事）', inRepoDependency: false },
  { name: 'Supabase', role: 'PostgreSQL 數據庫', inRepoDependency: true },
  { name: 'Straico AI', role: 'API 整合（藍圖敘事）', inRepoDependency: false },
] as const);

/** 世界觀。 */
export const AIOS_WORLDVIEW: readonly AiosWorldviewPrinciple[] = Object.freeze([
  { zh: '以終為始，始終如一', practice: '願景與使命' },
  { zh: '萬能進化無限循環', practice: '實現 0 到 1 再到無限的創世藍圖' },
  { zh: '人機共生', practice: '願景與使命' },
] as const);

export interface AiosTopologyReport {
  readonly ok: boolean;
  readonly sourceOrigin: string;
  readonly coreCount: number;
  readonly dimensionCount: number;
  readonly dimensionIds: readonly AiosDimensionId[];
  readonly perCoreDimensionCounts: Readonly<Record<AiosCoreId, number>>;
  readonly avatarNamedCount: number;
  readonly avatarDeclaredCount: number;
  readonly pillarCount: number;
  readonly secretArtCount: number;
  readonly axiomCount: number;
  readonly externalIntegrationCount: number;
  readonly techStackCount: number;
  readonly worldviewCount: number;
  /** 本檔逐條列舉之可數條目總數（與藍圖自載 64 並列對照）。 */
  readonly encodedItemCount: number;
  readonly declaredItemCount: number;
  readonly violations: readonly string[];
}

const CORE_IDS: readonly AiosCoreId[] = ['perception', 'cognition', 'memory', 'expression', 'nexus'];

function countEncodedItems(): number {
  const dimensionEntries = AIOS_DIMENSIONS.reduce(
    (sum, d) => sum + d.concepts.length + d.practices.length,
    0,
  );
  const coreEntries = AIOS_CORES.reduce(
    (sum, c) => sum + (c.modules?.length ?? 0) + (c.practices?.length ?? 0),
    0,
  );
  const axiomEntries = AIOS_AXIOMS.reduce((sum, a) => sum + a.practices.length, 0);
  return (
    dimensionEntries +
    coreEntries +
    AIOS_AVATARS.length +
    AIOS_PILLARS.length +
    AIOS_SECRET_ARTS.length +
    AIOS_AXIOMS.length +
    axiomEntries +
    AIOS_TECH_STACK.length +
    AIOS_EXTERNAL_INTEGRATIONS.length +
    AIOS_WORLDVIEW.length
  );
}

/**
 * MECE 拓撲驗證：5 核心 / 12 維度（各恰屬一核心）/ 12 維度全覆蓋 /
 * 化身、聖柱、奧義、公理計數正確 / 外部整合一律為敘事引用。
 * violations 為空陣列時 ok 為 true（可作為 CI 斷言）。
 */
export function verifyAiosTopology(): AiosTopologyReport {
  const violations: string[] = [];

  if (AIOS_CORES.length !== 5) violations.push(`核心數應為 5，實為 ${AIOS_CORES.length}`);
  const coreIdSet = new Set(AIOS_CORES.map((c) => c.id));
  if (coreIdSet.size !== AIOS_CORES.length) violations.push('核心 id 重複');
  if (AIOS_CORES.some((c, i) => c.index !== (i + 1))) violations.push('核心順序應為 I–V');

  if (AIOS_DIMENSIONS.length !== 12) violations.push(`維度數應為 12，實為 ${AIOS_DIMENSIONS.length}`);
  const dimIds = AIOS_DIMENSIONS.map((d) => d.id);
  if (new Set(dimIds).size !== dimIds.length) violations.push('維度 id 重複');
  for (let i = 1; i <= 12; i += 1) {
    if (!dimIds.includes(i as AiosDimensionId)) violations.push(`維度 ${i} 缺失`);
  }

  const perCoreDimensionCounts = Object.fromEntries(
    CORE_IDS.map((id) => [id, 0]),
  ) as Record<AiosCoreId, number>;
  for (const d of AIOS_DIMENSIONS) {
    if (!coreIdSet.has(d.coreId)) violations.push(`維度 ${d.id}（${d.zh}）歸屬未知核心 ${d.coreId}`);
    else perCoreDimensionCounts[d.coreId] += 1;
  }
  // MECE：12 維度全覆蓋且每維度恰屬一核心（總指派數 = 12）。
  const assigned = CORE_IDS.reduce((sum, id) => sum + perCoreDimensionCounts[id], 0);
  if (assigned !== AIOS_DIMENSIONS.length) {
    violations.push(`維度指派總數 ${assigned} ≠ 維度數 ${AIOS_DIMENSIONS.length}（MECE 破裂）`);
  }
  for (const id of CORE_IDS) {
    if (perCoreDimensionCounts[id] < 1) violations.push(`核心 ${id} 無任何維度`);
  }
  const expected = { perception: 2, cognition: 3, memory: 2, expression: 1, nexus: 4 };
  for (const id of CORE_IDS) {
    if (perCoreDimensionCounts[id] !== expected[id]) {
      violations.push(`核心 ${id} 維度數應為 ${expected[id]}，實為 ${perCoreDimensionCounts[id]}`);
    }
  }

  if (AIOS_AVATARS.length !== 8) {
    violations.push(`藍圖表內具名化身應為 8 位，實為 ${AIOS_AVATARS.length}`);
  }
  if (AIOS_AVATARS.length > AIOS_DECLARED_AVATAR_COUNT) {
    violations.push('具名化身數超過藍圖自載總數 10');
  }
  const avatarCoreIds = new Set(AIOS_AVATARS.map((a) => a.coreId));
  for (const id of avatarCoreIds) {
    if (!coreIdSet.has(id)) violations.push(`化身歸屬未知核心 ${id}`);
  }

  if (AIOS_PILLARS.length !== 4) violations.push(`四大聖柱應為 4，實為 ${AIOS_PILLARS.length}`);
  if (AIOS_SECRET_ARTS.length !== 6) violations.push(`六式奧義應為 6，實為 ${AIOS_SECRET_ARTS.length}`);
  if (AIOS_AXIOMS.length !== 4) violations.push(`四大公理應為 4，實為 ${AIOS_AXIOMS.length}`);
  for (const a of AIOS_AXIOMS) {
    if (!coreIdSet.has(a.coreId)) violations.push(`公理「${a.zh}」歸屬未知核心 ${a.coreId}`);
  }
  for (const x of AIOS_EXTERNAL_INTEGRATIONS) {
    if (x.status !== 'narrative-reference') violations.push(`外部整合 ${x.name} 應標記為敘事引用`);
    if (!coreIdSet.has(x.coreId)) violations.push(`外部整合 ${x.name} 歸屬未知核心 ${x.coreId}`);
  }
  const extNames = AIOS_EXTERNAL_INTEGRATIONS.map((x) => x.name);
  if (new Set(extNames).size !== extNames.length) violations.push('外部整合名稱重複');

  const perCoreDimensionCountsFrozen: Readonly<Record<AiosCoreId, number>> = Object.freeze(
    { ...perCoreDimensionCounts },
  );

  return Object.freeze({
    ok: violations.length === 0,
    sourceOrigin: AIOS_SOURCE_ORIGIN,
    coreCount: AIOS_CORES.length,
    dimensionCount: AIOS_DIMENSIONS.length,
    dimensionIds: Object.freeze([...dimIds]),
    perCoreDimensionCounts: perCoreDimensionCountsFrozen,
    avatarNamedCount: AIOS_AVATARS.length,
    avatarDeclaredCount: AIOS_DECLARED_AVATAR_COUNT,
    pillarCount: AIOS_PILLARS.length,
    secretArtCount: AIOS_SECRET_ARTS.length,
    axiomCount: AIOS_AXIOMS.length,
    externalIntegrationCount: AIOS_EXTERNAL_INTEGRATIONS.length,
    techStackCount: AIOS_TECH_STACK.length,
    worldviewCount: AIOS_WORLDVIEW.length,
    encodedItemCount: countEncodedItems(),
    declaredItemCount: AIOS_DECLARED_ITEM_COUNT,
    violations: Object.freeze(violations),
  });
}
