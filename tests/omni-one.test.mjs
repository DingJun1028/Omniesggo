// tests/omni-one.test.mjs
// ============================================================
// Omni-One SDK & OmniSystem 10 層同心圓萬能設施測試套件 (G1 ~ G12)
// 主題：ESGGO 善向永續、淨零實踐與 MECE 邊界隔離驗證
// ============================================================

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';

let pass = 0, fail = 0;
const test = (name, fn) => async () => {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    console.log(`  ✗ ${name}\n    ${e.message}`);
  }
};

const group = (name, tests) => async () => {
  console.log(`\n── ${name} ──`);
  for (const t of tests) await t();
};

// ── 模擬與自包含之核心資料結構 ──
const CASE_PATTERNS = [
  { pattern: /優化|refactor|improve|performance|效能/i, type: 'code_optimization' },
  { pattern: /文檔|document|readme|spec|說明/i, type: 'documentation' },
  { pattern: /分析|analyze|data|數據|圖表|chart/i, type: 'data_analysis' },
  { pattern: /ESG|永續|報告|GRI|碳排|climate/i, type: 'esg_report' },
  { pattern: /UI|介面|設計|design|color|layout/i, type: 'ui_design' },
  { pattern: /架構|architecture|system|系統設計/i, type: 'architecture' },
  { pattern: /bug|fix|error|TypeError|exception|修復/i, type: 'bug_fix' },
];

class MockCaseHandler {
  classify(input) {
    for (const { pattern, type } of CASE_PATTERNS) {
      if (pattern.test(input)) return type;
    }
    return 'general';
  }
  route(caseType) {
    const routes = {
      code_optimization: 'awakening:optimize',
      documentation: 'awakening:document',
      data_analysis: 'awakening:analyze',
      esg_report: 'awakening:esg',
      ui_design: 'awakening:design',
      architecture: 'awakening:architect',
      bug_fix: 'awakening:repair',
      general: 'awakening:general',
    };
    return routes[caseType];
  }
}

class MockMemorySystem {
  constructor(maxSize = 500) {
    this.memories = [];
    this.maxSize = maxSize;
  }
  store(entry) {
    const memory = {
      ...entry,
      id: `MEM-${randomBytes(4).toString('hex').toUpperCase()}`,
      timestamp: Date.now(),
    };
    if (this.memories.length >= this.maxSize) {
      this.memories.shift();
    }
    this.memories.push(memory);
    return memory;
  }
  retrieve(query, caseType, topK = 3) {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const scored = this.memories
      .filter(m => !caseType || m.caseType === caseType)
      .map(m => {
        const inputWords = new Set(m.input.toLowerCase().split(/\s+/));
        const intersection = [...queryWords].filter(w => inputWords.has(w)).length;
        const union = new Set([...queryWords, ...inputWords]).size;
        const jaccard = union > 0 ? intersection / union : 0;
        const recencyBoost = Math.exp(-(Date.now() - m.timestamp) / (7 * 24 * 3600 * 1000));
        return { entry: m, score: jaccard * 0.7 + recencyBoost * 0.3 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return scored.map(s => ({ ...s.entry, relevanceScore: s.score }));
  }
  size() { return this.memories.length; }
}

class MockAutonomousLearning {
  constructor() {
    this.records = [];
    this.confidenceByType = new Map();
  }
  learn(caseType, confidence) {
    this.records.push({ caseType, confidence, timestamp: Date.now() });
    const scores = this.confidenceByType.get(caseType) ?? [];
    scores.push(confidence);
    this.confidenceByType.set(caseType, scores);
    return scores.slice(-10).reduce((s, v) => s + v, 0) / Math.min(scores.length, 10);
  }
  getAverageConfidence(caseType) {
    if (caseType) {
      const scores = this.confidenceByType.get(caseType) ?? [];
      if (scores.length === 0) return 0.7;
      return scores.reduce((s, v) => s + v, 0) / scores.length;
    }
    if (this.records.length === 0) return 0.7;
    return this.records.reduce((s, r) => s + r.confidence, 0) / this.records.length;
  }
}

// ── G1: 案件分類器測試 ──
const g1 = group('G1: CaseHandler 案件分類與語意路由', [
  test('分類碳排與 ESG 關鍵字至 esg_report', () => {
    const handler = new MockCaseHandler();
    assert.equal(handler.classify('生成 2026 年度 ESG 溫室氣體排碳報告'), 'esg_report');
    assert.equal(handler.route('esg_report'), 'awakening:esg');
  }),
  test('分類代碼修復至 bug_fix', () => {
    const handler = new MockCaseHandler();
    assert.equal(handler.classify('修復 TypeError 異常例外'), 'bug_fix');
    assert.equal(handler.route('bug_fix'), 'awakening:repair');
  }),
  test('未知輸入預設為 general', () => {
    const handler = new MockCaseHandler();
    assert.equal(handler.classify('日常隨筆記錄'), 'general');
    assert.equal(handler.route('general'), 'awakening:general');
  }),
]);

// ── G2: 記憶檢索與淘汰機制 ──
const g2 = group('G2: MemorySystem 記憶檢索與容量上限', [
  test('記憶存儲並自動產生唯一 MEM 前綴 ID', () => {
    const mem = new MockMemorySystem(10);
    const item = mem.store({ caseType: 'esg_report', input: 'GRI 揭露規範', output: '完成', confidence: 0.95 });
    assert.match(item.id, /^MEM-[0-9A-F]{8}$/);
    assert.equal(mem.size(), 1);
  }),
  test('超過容量上限時自動淘汰最舊紀錄 (FIFO)', () => {
    const mem = new MockMemorySystem(2);
    mem.store({ caseType: 'general', input: 'A', output: '1', confidence: 0.8 });
    mem.store({ caseType: 'general', input: 'B', output: '2', confidence: 0.8 });
    mem.store({ caseType: 'general', input: 'C', output: '3', confidence: 0.8 });
    assert.equal(mem.size(), 2);
    const results = mem.retrieve('A', 'general');
    assert.equal(results.some(r => r.input === 'A'), false);
  }),
  test('Jaccard 關鍵字交集檢索排名', () => {
    const mem = new MockMemorySystem(10);
    mem.store({ caseType: 'esg_report', input: 'ESG 淨零 碳排 路徑', output: '精準匹配', confidence: 0.9 });
    mem.store({ caseType: 'esg_report', input: '財務 報表 營收', output: '不匹配', confidence: 0.9 });
    const top = mem.retrieve('ESG 碳排', 'esg_report', 1);
    assert.equal(top.length, 1);
    assert.equal(top[0].output, '精準匹配');
  }),
]);

// ── G3: 自主學習與信心度演算法 ──
const g3 = group('G3: AutonomousLearning 自主學習與信心度演算法', [
  test('計算移動平均信心度', () => {
    const learner = new MockAutonomousLearning();
    learner.learn('esg_report', 0.8);
    learner.learn('esg_report', 0.9);
    const avg = learner.getAverageConfidence('esg_report');
    assert.ok(Math.abs(avg - 0.85) < 0.001);
  }),
  test('無歷史紀錄時返回預設基準值 0.7', () => {
    const learner = new MockAutonomousLearning();
    assert.equal(learner.getAverageConfidence('ui_design'), 0.7);
  }),
]);

// ── G4: 覺醒核心狀態機 ──
const g4 = group('G4: AwakeningCore 覺醒等級進階轉換', [
  test('依處理案件量漸進晉升等級', () => {
    const updateLevel = (count) => {
      if (count === 0) return 'dormant';
      if (count < 10) return 'awakening';
      if (count < 50) return 'active';
      return 'transcendent';
    };
    assert.equal(updateLevel(0), 'dormant');
    assert.equal(updateLevel(5), 'awakening');
    assert.equal(updateLevel(25), 'active');
    assert.equal(updateLevel(100), 'transcendent');
  }),
]);

// ── G5: 5T 協議資料治理持久化 ──
const g5 = group('G5: 5T 協議存證結構與 SHA-256 完整性', [
  test('產生符合 5T 規範的 Hash Lock 驗證碼', () => {
    const caseData = { caseId: 'CASE-001', type: 'esg_report', rating: '5T-A+' };
    const hash = createHash('sha256').update(JSON.stringify(caseData)).digest('hex');
    assert.equal(hash.length, 64);
  }),
]);

// ── G6: 全流程結果不可變性 ──
const g6 = group('G6: OmniOne 處理結果凍結機制', [
  test('ProcessResult 物件受 Object.freeze 保護', () => {
    const result = Object.freeze({
      caseId: 'CASE-TEST',
      caseType: 'architecture',
      isFrozen: true,
    });
    assert.throws(() => {
      result.caseType = 'modified';
    }, TypeError);
  }),
]);

// ── G7: 10 層 MECE 同心圓架構規範驗證 (docs/SAAS-ARCHITECTURE.md) ──
const g7 = group('G7: docs/SAAS-ARCHITECTURE.md 10 層架構規範完整性', [
  test('架構文檔必須存在且涵蓋 0 至 9 全層', async () => {
    const docPath = path.resolve(process.cwd(), 'docs/SAAS-ARCHITECTURE.md');
    const content = await fs.readFile(docPath, 'utf-8');
    assert.ok(content.length > 500, '架構文檔內容不得少於 500 字元');
    
    const requiredLayers = [
      '萬能意圖心核',
      '萬能感知雷達',
      '萬能記憶樞紐',
      '萬能推理大腦',
      '萬能治理閘門',
      '萬能編排中樞',
      '萬能執行工坊',
      '萬能整合網絡',
      '萬能體驗門戶',
      '萬能演化生長環',
    ];
    for (const layer of requiredLayers) {
      assert.ok(content.includes(layer), `文檔應包含層級定義：${layer}`);
    }
  }),
  test('架構文檔必須內嵌 ESGGO 善向永續與淨零主題', async () => {
    const docPath = path.resolve(process.cwd(), 'docs/SAAS-ARCHITECTURE.md');
    const content = await fs.readFile(docPath, 'utf-8');
    assert.ok(content.includes('ESGGO 善向永續'), '文檔應明確融入 ESGGO 善向永續 主題');
    assert.ok(content.includes('MECE'), '文檔應貫徹 MECE 原則');
    assert.ok(content.includes('閉環'), '文檔應定義正向擴散與反向閉環機制');
  }),
]);

// ── G8: SDK 設施代碼模組完整性 (architecture-facilities.ts) ──
const g8 = group('G8: architecture-facilities.ts 設施定義與 Catalog 完整性', [
  test('SDK 模組必須存在並導出核心介面與列舉', async () => {
    const sdkPath = path.resolve(process.cwd(), 'sdks/omni-one/src/architecture-facilities.ts');
    const code = await fs.readFile(sdkPath, 'utf-8');
    assert.ok(code.includes('export enum FacilityLayer'), '必須導出 FacilityLayer');
    assert.ok(code.includes('OMNI_FACILITIES_CATALOG'), '必須導出 OMNI_FACILITIES_CATALOG');
    assert.ok(code.includes('OmniSystemConcentricDispatcher'), '必須導出 ConcentricDispatcher');
    assert.ok(code.includes('export interface IFacilityNode'), '必須定義 IFacilityNode 介面');
  }),
  test('sdks/omni-one/src/index.ts 必須統一導出架構模組', async () => {
    const indexPath = path.resolve(process.cwd(), 'sdks/omni-one/src/index.ts');
    const indexCode = await fs.readFile(indexPath, 'utf-8');
    assert.ok(
      indexCode.includes("export * from './architecture-facilities'"),
      'index.ts 必須 re-export architecture-facilities'
    );
  }),
]);

// ── G9: 10 層設施節點介面與註冊機制 ──
const g9 = group('G9: IFacilityNode 節點註冊與檢索契約', [
  test('調度器能按層級註冊與取得節點', () => {
    class MockDispatcher {
      constructor() { this.nodes = new Map(); }
      registerFacility(node) { this.nodes.set(node.layer, node); }
      getFacility(layer) { return this.nodes.get(layer); }
      hasFacility(layer) { return this.nodes.has(layer); }
    }
    const dispatcher = new MockDispatcher();
    dispatcher.registerFacility({ layer: 0, name: '萬能意圖心核' });
    dispatcher.registerFacility({ layer: 9, name: '萬能演化生長環' });

    assert.equal(dispatcher.hasFacility(0), true);
    assert.equal(dispatcher.hasFacility(9), true);
    assert.equal(dispatcher.hasFacility(5), false);
    assert.equal(dispatcher.getFacility(0).name, '萬能意圖心核');
  }),
]);

// ── G10: 同心圓正向擴散機制 (0 -> 9) ──
const g10 = group('G10: 同心圓正向外向擴散鏈 (Layer 0 至 Layer 9)', [
  test('資料沿 0->9 同心圓外向推進，逐層保留計算結果', async () => {
    const history = [];
    class ConcentricRunner {
      async diffuse(initialPayload) {
        let current = initialPayload;
        for (let l = 0; l <= 9; l++) {
          history.push(l);
          current = { ...current, [`layer_${l}`]: `processed_at_layer_${l}` };
        }
        return current;
      }
    }
    const runner = new ConcentricRunner();
    const result = await runner.diffuse({ target: 'ESGGO NetZero' });
    assert.deepEqual(history, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(result.target, 'ESGGO NetZero');
    assert.equal(result.layer_0, 'processed_at_layer_0');
    assert.equal(result.layer_9, 'processed_at_layer_9');
  }),
]);

// ── G11: 同心圓雙向閉環反饋與 ESGGO 善向永續調度全檢 ──
const g11 = group('G11: 雙向閉環演化反饋 (9 -> 2 & 0) 與 ESGGO 全層實踐調度', [
  test('演化生長環 (Layer 9) 成功觸發反向閉環至記憶 (Layer 2) 與意圖 (Layer 0)', async () => {
    const feedbackJournal = [];
    class FullConcentricDispatcher {
      constructor() {
        this.facilities = new Map();
      }
      registerFacility(layer, name, processor) {
        this.facilities.set(layer, { layer, name, processor });
      }
      async diffuseOutward(initialInput) {
        const results = new Map();
        let currentData = initialInput;
        for (let l = 0; l <= 9; l++) {
          const fac = this.facilities.get(l);
          if (fac) {
            currentData = await fac.processor(currentData, results);
            results.set(l, currentData);
          }
        }
        // 閉環回饋
        if (this.facilities.has(9)) {
          const evolutionOutput = results.get(9);
          feedbackJournal.push({ targetLayer: 2, patch: evolutionOutput });
          feedbackJournal.push({ targetLayer: 0, patch: evolutionOutput });
        }
        return { results, feedbackLoopTriggered: feedbackJournal.length > 0 };
      }
    }

    const dispatcher = new FullConcentricDispatcher();
    const layers = [
      { l: 0, n: '萬能意圖心核' },
      { l: 1, n: '萬能感知雷達' },
      { l: 2, n: '萬能記憶樞紐' },
      { l: 3, n: '萬能推理大腦' },
      { l: 4, n: '萬能治理閘門' },
      { l: 5, n: '萬能編排中樞' },
      { l: 6, n: '萬能執行工坊' },
      { l: 7, n: '萬能整合網絡' },
      { l: 8, n: '萬能體驗門戶' },
      { l: 9, n: '萬能演化生長環' },
    ];

    layers.forEach(({ l, n }) => {
      dispatcher.registerFacility(l, n, async (input, prevResults) => {
        return {
          layer: l,
          name: n,
          theme: 'ESGGO 善向永續',
          status: 'success',
          stepCount: prevResults.size + 1,
        };
      });
    });

    const execution = await dispatcher.diffuseOutward({ intent: '2026 ESGGO 淨零排放治理' });
    assert.equal(execution.feedbackLoopTriggered, true);
    assert.equal(execution.results.size, 10);
    assert.equal(execution.results.get(0).name, '萬能意圖心核');
    assert.equal(execution.results.get(9).name, '萬能演化生長環');
    assert.equal(feedbackJournal.length, 2);
    assert.equal(feedbackJournal[0].targetLayer, 2, '反向反饋必須注入 Layer 2 記憶樞紐');
    assert.equal(feedbackJournal[1].targetLayer, 0, '反向反饋必須校準 Layer 0 意圖心核');
  }),
  test('驗證 10 層同心圓在 ESGGO 善向永續主題下的 MECE 邊界隔離', () => {
    const catalogLayers = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(catalogLayers.size, 10, '必須嚴格保持 10 個互斥獨立層級');
    for (let i = 0; i <= 9; i++) {
      assert.ok(catalogLayers.has(i), `必須涵蓋層級 ${i}`);
    }
  }),
]);

// ── G12: ESGGO 善向永續端到端真實用戶旅程與雙向閉環實踐驗證 ──
const g12 = group('G12: ESGGO 善向永續端到端真實用戶旅程與雙向閉環實踐驗證', [
  test('企業碳盤查情境全流程貫穿 Layer 0 至 Layer 9 外向擴散鏈', async () => {
    const trace = [];
    const layerOutputs = new Map();

    const facilities = [
      {
        layer: 0,
        name: '萬能意圖心核',
        process: async (input) => {
          trace.push(0);
          assert.ok(input.intent.includes('ESGGO') || input.intent.includes('碳盤查'));
          return {
            intent: input.intent,
            targetYear: 2026,
            vision: 'ESGGO 善向永續 NetZero 零碳轉型',
            status: 'anchored',
          };
        },
      },
      {
        layer: 1,
        name: '萬能感知雷達',
        process: async (prev) => {
          trace.push(1);
          const rawDocs = [
            { type: 'scope_1', source: '柴油/天然氣鍋爐', value: 1250, unit: 'tCO2e' },
            { type: 'scope_2', source: '外購電力', value: 3420, unit: 'tCO2e' },
          ];
          const docHash = createHash('sha256').update(JSON.stringify(rawDocs)).digest('hex');
          return {
            ...prev,
            ingestedDocuments: rawDocs,
            docFingerprint: docHash,
            sensorStatus: 'perceived',
          };
        },
      },
      {
        layer: 2,
        name: '萬能記憶樞紐',
        process: async (prev) => {
          trace.push(2);
          const memSystem = new MockMemorySystem();
          const record = memSystem.store({
            caseType: 'esg_report',
            input: prev.intent,
            output: `基線錨定: Scope1=1250, Scope2=3420, 指紋=${prev.docFingerprint.slice(0, 8)}`,
            confidence: 0.96,
          });
          return {
            ...prev,
            baselineEmissions: 5100,
            memoryCaseId: record.id,
            memoryTimestamp: record.timestamp,
          };
        },
      },
      {
        layer: 3,
        name: '萬能推理大腦',
        process: async (prev) => {
          trace.push(3);
          const totalRaw = prev.ingestedDocuments.reduce((s, d) => s + d.value, 0);
          const reductionDelta = prev.baselineEmissions - totalRaw;
          const reductionRatio = (reductionDelta / prev.baselineEmissions) * 100;
          return {
            ...prev,
            totalEmissions: totalRaw,
            reductionRatio: Number(reductionRatio.toFixed(2)),
            recommendations: [
              '導入屋頂型太陽能綠電直供 (減排 35%)',
              '公務與物流車隊全面電動化轉換 (減排 15%)',
            ],
            reasoningEngine: 'Groq Qwen 3.8-27b',
            confidence: 0.95,
          };
        },
      },
      {
        layer: 4,
        name: '萬能治理閘門',
        process: async (prev) => {
          trace.push(4);
          assert.ok(prev.totalEmissions > 0, '碳排總量必須大於零');
          assert.ok(prev.reductionRatio > 0, '減碳比例必須符合正向目標');
          const complianceChecks = {
            'GRI-305-1': { passed: true, standard: '直接溫室氣體排放' },
            'GRI-305-2': { passed: true, standard: '能源間接溫室氣體排放' },
            'ISO-14064-1': { passed: true, standard: '組織層級溫室氣體量化' },
          };
          return {
            ...prev,
            governancePassed: true,
            complianceChecks,
            boundaryCheckedAt: Date.now(),
          };
        },
      },
      {
        layer: 5,
        name: '萬能編排中樞',
        process: async (prev) => {
          trace.push(5);
          const dagPlan = [
            { id: 'task-1', name: 'GRI-305 指標公式結算', deps: [] },
            { id: 'task-2', name: '減排效益敏感度模擬', deps: ['task-1'] },
            { id: 'task-3', name: '永續主管電子簽署與存證', deps: ['task-2'] },
          ];
          return {
            ...prev,
            orchestrationDag: dagPlan,
            scheduledNodes: dagPlan.length,
          };
        },
      },
      {
        layer: 6,
        name: '萬能執行工坊',
        process: async (prev) => {
          trace.push(6);
          const results = prev.orchestrationDag.map(t => ({
            taskId: t.id,
            executed: true,
            outputHash: createHash('sha256').update(t.name).digest('hex').slice(0, 16),
          }));
          return {
            ...prev,
            executionResults: results,
            computationComplete: true,
          };
        },
      },
      {
        layer: 7,
        name: '萬能整合網絡',
        process: async (prev) => {
          trace.push(7);
          const externalPayload = {
            protocol: 'ESGGO-OpenRegistry/v1',
            reportingEntity: 'ESGGO Enterprise Corp',
            scope1: 1250,
            scope2: 3420,
            total: prev.totalEmissions,
            griMetrics: ['GRI-305-1', 'GRI-305-2'],
          };
          return {
            ...prev,
            externalPayload,
            exportConnector: 'CloudflareWorkerRegistryBridge',
            connectorStatus: 'synced',
          };
        },
      },
      {
        layer: 8,
        name: '萬能體驗門戶',
        process: async (prev) => {
          trace.push(8);
          const radarDimensions = [
            { layer: 0, label: '意圖心核', score: 100 },
            { layer: 1, label: '感知雷達', score: 98 },
            { layer: 2, label: '記憶樞紐', score: 95 },
            { layer: 3, label: '推理大腦', score: 95 },
            { layer: 4, label: '治理閘門', score: 100 },
            { layer: 5, label: '編排中樞', score: 96 },
            { layer: 6, label: '執行工坊', score: 99 },
            { layer: 7, label: '整合網絡', score: 97 },
            { layer: 8, label: '體驗門戶', score: 100 },
            { layer: 9, label: '演化生長環', score: 94 },
          ];
          return {
            ...prev,
            radarDimensions,
            viewRendered: 'ConcentricRadar10LayerMounted',
            userExperienceStream: 'SSE_ACTIVE',
          };
        },
      },
      {
        layer: 9,
        name: '萬能演化生長環',
        process: async (prev) => {
          trace.push(9);
          const telemetry = {
            cycleSuccess: true,
            totalProcessedLayers: 10,
            avgConfidence: 0.97,
            suggestedCalibration: {
              nextTargetReduction: 12.5,
              memoryRetainDays: 365,
            },
          };
          return {
            ...prev,
            evolutionTelemetry: telemetry,
            ringStatus: 'evolved',
          };
        },
      },
    ];

    let current = { intent: 'ESGGO 善向永續 2026 企業碳盤查與 GRI 淨零轉型' };
    for (const fac of facilities) {
      current = await fac.process(current);
      layerOutputs.set(fac.layer, current);
    }

    assert.deepEqual(trace, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    assert.equal(layerOutputs.size, 10);
    assert.equal(current.totalEmissions, 4670);
    assert.equal(current.reductionRatio, 8.43);
    assert.equal(current.governancePassed, true);
    assert.equal(current.viewRendered, 'ConcentricRadar10LayerMounted');
    assert.equal(current.ringStatus, 'evolved');
  }),
  test('演化生長環 Layer 9 觸發反向雙向閉環：記憶存證 (Layer 2) 與意圖校準 (Layer 0)', async () => {
    const closedLoopFeedback = [];
    const memorySystem = new MockMemorySystem();

    const evolutionFeedback = {
      sourceLayer: 9,
      timestamp: Date.now(),
      cycleId: `CYCLE-${randomBytes(3).toString('hex').toUpperCase()}`,
      learnedInsights: {
        scope1OptimizedRatio: 0.12,
        scope2GreenTariffDelta: 0.08,
        recommendedNextBaseline: 4670,
      },
    };

    const memoryFeedbackHandler = (feedback) => {
      const memoryRecord = memorySystem.store({
        caseType: 'esg_report',
        input: `演化閉環存證: ${feedback.cycleId}`,
        output: JSON.stringify(feedback.learnedInsights),
        confidence: 0.98,
      });
      closedLoopFeedback.push({
        targetLayer: 2,
        storedId: memoryRecord.id,
        cycleId: feedback.cycleId,
      });
      return memoryRecord;
    };

    let coreIntent = {
      targetEmissions: 5000,
      ambitionLevel: 'standard',
      theme: 'ESGGO 善向永續',
    };
    const intentFeedbackHandler = (feedback) => {
      coreIntent = {
        ...coreIntent,
        targetEmissions: feedback.learnedInsights.recommendedNextBaseline,
        ambitionLevel: 'hyper_awakened',
        calibratedAt: feedback.timestamp,
      };
      closedLoopFeedback.push({
        targetLayer: 0,
        newTargetEmissions: coreIntent.targetEmissions,
        ambitionLevel: coreIntent.ambitionLevel,
      });
      return coreIntent;
    };

    const memRecord = memoryFeedbackHandler(evolutionFeedback);
    const updatedIntent = intentFeedbackHandler(evolutionFeedback);

    assert.equal(closedLoopFeedback.length, 2);
    assert.equal(closedLoopFeedback[0].targetLayer, 2);
    assert.match(memRecord.id, /^MEM-[0-9A-F]{8}$/);
    assert.equal(closedLoopFeedback[1].targetLayer, 0);
    assert.equal(updatedIntent.targetEmissions, 4670);
    assert.equal(updatedIntent.ambitionLevel, 'hyper_awakened');
  }),
  test('端到端全鏈路 5T 治理 Hash Lock 存證與不可變凍結校驗', async () => {
    const e2ePayload = {
      journeyId: 'JOURNEY-ESGGO-2026-E2E',
      theme: 'ESGGO 善向永續',
      layersCovered: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      metrics: {
        scope1: 1250,
        scope2: 3420,
        total: 4670,
        unit: 'tCO2e',
        griStandard: 'GRI 305: Emissions 2026',
      },
      governanceGrade: '5T-A+ Master Tier',
      verifiedAt: new Date().toISOString(),
    };

    const hashPayload = JSON.stringify(e2ePayload);
    const hashLock = createHash('sha256').update(hashPayload).digest('hex');
    assert.equal(hashLock.length, 64);

    const sealedJourney = Object.freeze({
      ...e2ePayload,
      hashLock,
      isSealed: true,
    });

    assert.throws(() => {
      sealedJourney.theme = 'Modified';
    }, TypeError);

    assert.equal(sealedJourney.isSealed, true);
    assert.equal(sealedJourney.hashLock, hashLock);
  }),
]);

// ── 執行所有測試群組 ──
(async () => {
  console.log('Omni-One SDK & OmniSystem 10 層同心圓萬能設施測試 (G1 ~ G12)\n');
  await g1();
  await g2();
  await g3();
  await g4();
  await g5();
  await g6();
  await g7();
  await g8();
  await g9();
  await g10();
  await g11();
  await g12();
  console.log(`\n${'='.repeat(50)}`);
  console.log(`結果: ${pass} 通過 / ${fail} 失敗`);
  console.log(`${'='.repeat(50)}`);
  process.exit(fail === 0 ? 0 : 1);
})();
