// ============================================================
// 萬能標籤服務測試 — 收合版 omni-tag-service（Supabase function 契約）
// tests/omni-tag-service.test.ts
//
// 5T Traceable — 從 OmniTag 測試收合而來：
//   - 測試範圍：純函式（splitThinking / stripGemma4Thinking / extractJsonValue）
//     + DB 整合（autoPair / syncEsgTags / getEntityTags / createOmniTagPair），
//     全部以 Supabase function 契約 mock。
//   - 不依賴真實 Supabase / Oracle / 網路。
//   - 用相對 import 避免 @/ alias 在 core tsconfig 解析爭議（參見 omni-tag-service.ts 註解）。
//   - 所有斷言對齊 omni-tag-service.ts 的實際回傳結構（2026-10-28 校準）。
// ============================================================
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock factory 會被提升到檔案頂端，因此可被引用的 mock 物件必須以 vi.hoisted 宣告。
const { mockSupabase, tableData, singleData, mockState } = vi.hoisted(() => {
  // 各表預設回傳資料；測試可在 beforeEach 覆寫。
  const tableData: Record<string, unknown[]> = {
    esg_tags: [],
    universal_tags: [],
    tag_pairs: [],
  };
  // 需要回傳「有資料」的 single() 查詢，於此設定 table → row（預設無 → noRows）。
  const singleData: Record<string, unknown> = {};
  // autoPair 的本地模型輸出覆寫：null = 預設回傳 ESG 標籤陣列。
  const mockState = { modelOutput: null as string | null };
  const noRows = { data: null, error: { code: 'PGRST116', status: 406 } };

  // Supabase function 契約：from(table) 回傳 chainable，await 後解構 { data, error }。
  // select/eq/not/or/in/limit/order/upsert 皆回傳同一 chainable（可鏈式呼叫）。
  // single() 回傳 { data, error }（有 row 時 error=null，無 row 時 noRows）；insert() 回傳成功。
  function makeChainable(table: string) {
    const chain: Record<string, unknown> = { __table: table };
    // thenable：await chain 解析為該表資料（對應 select/limit/order 結尾的查詢）。
    (chain as { then?: unknown }).then = (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve({ data: tableData[table] ?? [], error: null }).then(onFulfilled);
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.not = vi.fn(() => chain);
    chain.or = vi.fn(() => chain);
    chain.in = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.upsert = vi.fn(() => chain);
    chain.single = vi.fn(() => {
      const row = singleData[table] ?? null;
      return Promise.resolve(row ? { data: row, error: null } : noRows);
    });
    chain.insert = vi.fn(() => Promise.resolve({ data: null, error: null }));
    return chain;
  }

  const supabaseMock = { from: vi.fn((table: string) => makeChainable(table)) };
  return { mockSupabase: supabaseMock, tableData, singleData, mockState };
});

vi.mock('@/lib/supabase-omni', () => ({ supabase: mockSupabase }));
vi.mock('@/core/tags/oracle-sync-service', () => ({
  syncTagPairToOracle: vi.fn().mockResolvedValue({ ok: false, reason: 'no-oracle-creds' }),
}));
vi.mock('@/lib/bus', () => ({
  publishThought: vi.fn(),
  subscribeBusEvent: vi.fn(),
}));

import {
  autoPair,
  syncEsgTags,
  getEntityTags,
  createOmniTagPair,
  splitThinking,
  stripGemma4Thinking,
  extractJsonValue,
} from '@/core/tags/omni-tag-service';
import { supabase } from '@/lib/supabase-omni';
import * as bus from '@/lib/bus';

// ============================================================
// autoPair — 萬能標籤自動配對
// 實際回傳：{ paired: boolean; labels: string[]; reason: string }
// ============================================================
describe('autoPair — 萬能標籤自動配對', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // anchor upsert→single 回傳 no rows → uErr truthy → skip（pairedCount=0）。
    tableData.omni_tags = [];
    tableData.tag_pairs = [];
    for (const k of Object.keys(singleData)) delete singleData[k];
    mockState.modelOutput = null; // 預設：回傳 ESG 標籤陣列
    process.env.LOCAL_GEMMA_SERVER_URL = 'http://gemma.test';
    // 本地模型 mock：回傳 { response: <modelOutput> }（對應 res.json().response）。
    // 每次 beforeEach 重新 spyOn，afterEach restoreAllMocks 還原，避免 spy 脫鉤。
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      const output =
        mockState.modelOutput ??
        '[{"label":"碳排","pillar":"environmental","confidence":0.9}]';
      return new Response(JSON.stringify({ response: output }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    });
    vi.spyOn(bus, 'publishThought').mockReturnValue({ hashLock: 'x' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.LOCAL_GEMMA_SERVER_URL;
  });

  it('正確解析 Gemma4 思考模式', async () => {
    mockState.modelOutput =
      '<|channel>thought\nThinking about ESG...\n' +
      '[{"label":"碳排放","pillar":"environmental","confidence":0.9}]';
    const res = await autoPair({
      entityType: 'regulation',
      entityId: 'g1',
      content: 'regulation content',
    });
    expect(res.paired).toBe(true);
    expect(res.labels).toContain('碳排放');
    // DB 無回傳（single → noRows）故 pairedCount=0，reason 反映實際配對數。
    expect(res.reason).toContain('paired 0 tags');
  });

  it('模型回傳無 JSON 時 paired=false', async () => {
    mockState.modelOutput = 'sorry, I cannot help with that.';
    const res = await autoPair({ entityType: 'regulation', entityId: 'g1', content: 'test' });
    expect(res.paired).toBe(false);
    expect(res.labels).toEqual([]);
    expect(res.reason).toContain('no JSON array');
  });

  it('回傳結構為 { paired, labels, reason }', async () => {
    const res = await autoPair({ entityType: 'regulation', entityId: 'g2', content: 'test' });
    expect(typeof res.paired).toBe('boolean');
    expect(Array.isArray(res.labels)).toBe(true);
    expect(typeof res.reason).toBe('string');
    // 不存在的欄位應確實缺席（防回归到 class-based 舊契約）。
    expect('pairedCount' in res).toBe(false);
    expect('synced' in res).toBe(false);
    expect('busPublished' in res).toBe(false);
  });
});

// ============================================================
// syncEsgTags — ESG 標籤同步為萬能標籤
// 實際回傳：{ synced: number; labels: string[] }
// ============================================================
describe('syncEsgTags — ESG 標籤同步', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(singleData)) delete singleData[k];
  });

  it('同步 ESG 標籤並回傳 labels', async () => {
    tableData.esg_tags = [
      { id: 'e1', name: 'test-tag', category: 'environmental', description: 'd' },
    ];
    tableData.omni_tags = []; // 尚不存在 → 會 insert
    const res = await syncEsgTags();
    expect(res.synced).toBe(1);
    expect(res.labels).toContain('test-tag');
  });

  it('已存在的萬能標籤略過（不重複 sync）', async () => {
    tableData.esg_tags = [
      { id: 'e1', name: 'existing-tag', category: 'social', description: 'd' },
    ];
    tableData.universal_tags = [{ id: 'u1' }]; // 已存在 → skip
    const res = await syncEsgTags();
    expect(res.synced).toBe(0);
    expect(res.labels).toEqual([]);
  });
});

// ============================================================
// getEntityTags — 實體標籤查詢
// 實際回傳：tag_pairs 列陣列（非 { pairs }）
// ============================================================
describe('getEntityTags — 實體標籤查詢', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const k of Object.keys(singleData)) delete singleData[k];
  });

  it('無資料時回傳空陣列', async () => {
    tableData.tag_pairs = [];
    const res = await getEntityTags('regulation', 'r1');
    expect(Array.isArray(res)).toBe(true);
    expect(res).toEqual([]);
  });

  it('回傳該實體的配對列', async () => {
    tableData.tag_pairs = [
      { uuid: 'p1', entity_type: 'regulation', entity_id: 'r1', confidence: 0.9 },
      { uuid: 'p2', entity_type: 'regulation', entity_id: 'r1', confidence: 0.5 },
    ];
    const res = await getEntityTags('regulation', 'r1');
    expect(res).toHaveLength(2);
    expect((res as Array<{ uuid: string }>)[0].uuid).toBe('p1');
  });
});

// ============================================================
// createOmniTagPair — 建立萬能配對（anchor + evidence）
// 實際回傳：{ pairId: string; anchorId: string; evidenceId?: string }
// ============================================================
describe('createOmniTagPair — 萬能配對建立', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tableData.omni_tags = [];
    tableData.tag_pairs = [];
    for (const k of Object.keys(singleData)) delete singleData[k];
  });

  it('universal_tags single 無回傳時回傳空 pairId（graceful）', async () => {
    const res = await createOmniTagPair({
      anchorLabel: 'net-zero',
      entityType: 'company',
      entityId: 'c1',
    });
    expect(res.pairId).toBe('');
    expect(res.anchorId).toBe('');
    expect(res.evidenceId).toBeUndefined();
  });

  it('single 回傳 id 時成功建立 anchor 與 tag_pairs', async () => {
    singleData.universal_tags = { id: 'UT-ABC' };
    const res = await createOmniTagPair({
      anchorLabel: 'net-zero',
      entityType: 'company',
      entityId: 'c1',
    });
    expect(res.pairId).not.toBe('');
    expect(res.pairId).toMatch(/^PAIR-/);
    expect(res.anchorId).toBe('UT-ABC');
    expect(res.evidenceId).toBeUndefined();
    // tag_pairs insert 必被呼叫。
    expect(supabase.from).toHaveBeenCalledWith('tag_pairs');
  });

  it('提供 evidenceLabel 時回傳 evidenceId', async () => {
    singleData.universal_tags = { id: 'UT-ABC' };
    const res = await createOmniTagPair({
      anchorLabel: 'net-zero',
      evidenceLabel: 'sbt',
      entityType: 'company',
      entityId: 'c1',
    });
    expect(res.anchorId).toBe('UT-ABC');
    expect(res.evidenceId).toBe('UT-ABC');
  });
});

// ============================================================
// splitThinking — 分段思考（純函式）
// 實際回傳：{ thoughts: string[]; clean: string }（物件，非陣列）
// ============================================================
describe('splitThinking — 分段思考', () => {
  it('正確分段（多段 <channel thought>）', () => {
    const raw =
      '<channel thought>Step 1: analyze</channel>' +
      '<channel thought>Step 2: plan</channel>' +
      '<channel thought>Step 3: execute</channel>answer';
    const result = splitThinking(raw);
    expect(result.thoughts).toHaveLength(3);
    expect(result.thoughts[0]).toContain('Step 1');
    expect(result.thoughts[2]).toContain('Step 3');
    expect(result.clean).toContain('answer');
  });

  it('單段思考', () => {
    const raw = '<channel thought>Just one thought</channel>final answer';
    const result = splitThinking(raw);
    expect(result.thoughts).toHaveLength(1);
    expect(result.thoughts[0]).toContain('one thought');
    expect(result.clean).toBe('final answer');
  });

  it('無思考標籤時 thoughts 為空、clean 為純答案', () => {
    const result = splitThinking('plain answer');
    expect(result.thoughts).toEqual([]);
    expect(result.clean).toBe('plain answer');
  });

  it('非字串輸入回傳空 thoughts 與字串化 clean', () => {
    expect(splitThinking(null).thoughts).toEqual([]);
    expect(splitThinking(null).clean).toBe(''); // null/undefined → ''
    expect(splitThinking(undefined).clean).toBe('');
    expect(splitThinking(123).clean).toBe('123');
  });
});

// ============================================================
// stripGemma4Thinking — 清理思考頻道與 markdown 柵欄（純函式）
// 實際回傳：string（即 splitThinking().clean）
// ============================================================
describe('stripGemma4Thinking — 移除 Gemma4 思考模式', () => {
  it('移除開頭思考標籤', () => {
    const raw = '<channel thought>Thinking...</channel>some text';
    const result = stripGemma4Thinking(raw);
    expect(result).toBe('some text');
  });

  it('無標籤時原樣回傳', () => {
    const result = stripGemma4Thinking('plain answer');
    expect(result).toBe('plain answer');
  });

  it('移除 markdown 代碼柵欄', () => {
    const raw = '```json\n{"a":1}\n```';
    const result = stripGemma4Thinking(raw);
    expect(result).toBe('{"a":1}');
  });
});

// ============================================================
// extractJsonValue — 提取 JSON 值（純函式）
// 實際回傳：解析後的物件/陣列，或 null（非原始字串）
// ============================================================
describe('extractJsonValue — 提取 JSON 值', () => {
  it('提取物件', () => {
    const result = extractJsonValue('prefix {"key":"value"} suffix');
    expect(result).toEqual({ key: 'value' });
  });

  it('提取陣列', () => {
    const result = extractJsonValue('before [{"label":"test"}] after');
    expect(result).toEqual([{ label: 'test' }]);
  });

  it('無 JSON 回傳 null', () => {
    expect(extractJsonValue('no json here')).toBeNull();
    expect(extractJsonValue('')).toBeNull();
  });

  it('非法 JSON 回傳 null', () => {
    expect(extractJsonValue('{"key": }')).toBeNull();
  });
});
