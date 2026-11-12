import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  AIOS_AVATARS,
  AIOS_AXIOMS,
  AIOS_CORES,
  AIOS_DECLARED_AVATAR_COUNT,
  AIOS_DECLARED_ITEM_COUNT,
  AIOS_DIMENSIONS,
  AIOS_EXTERNAL_INTEGRATIONS,
  AIOS_PILLARS,
  AIOS_SECRET_ARTS,
  AIOS_SOURCE_ORIGIN,
  AIOS_TECH_STACK,
  AIOS_WORLDVIEW,
  verifyAiosTopology,
} from '../src/matrix';
import {
  AiosFusionMatrix,
  AiosMatrixError,
  type AiosIntentResult,
} from '../src/fusion';

describe('AIOS 融合矩陣: MECE 拓撲（資料正典）', () => {
  const report = verifyAiosTopology();

  it('verifyAiosTopology 全綠（零 violations）', () => {
    expect(report.violations).toEqual([]);
    expect(report.ok).toBe(true);
    expect(report.sourceOrigin).toBe(AIOS_SOURCE_ORIGIN);
  });

  it('5 大核心（I–V 感知/認知/記憶/表達/連結）', () => {
    expect(report.coreCount).toBe(5);
    expect(AIOS_CORES.map((c) => c.id)).toEqual([
      'perception',
      'cognition',
      'memory',
      'expression',
      'nexus',
    ]);
    expect(AIOS_CORES.map((c) => c.index)).toEqual([1, 2, 3, 4, 5]);
  });

  it('12 維度（1–12 不重不漏）且各恰屬一核心（MECE）', () => {
    expect(report.dimensionCount).toBe(12);
    expect(report.dimensionIds).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(report.perCoreDimensionCounts).toEqual({
      perception: 2, // 維度 6, 8
      cognition: 3, // 維度 1, 7, 10
      memory: 2, // 維度 4, 11
      expression: 1, // 維度 12
      nexus: 4, // 維度 2, 3, 5, 9
    });
    // MECE 反證：任何核心層的維度集合互斥且聯集恰為 12 維。
    const union = Object.values(report.perCoreDimensionCounts).reduce((a, b) => a + b, 0);
    expect(union).toBe(12);
  });

  it('維度資料逐條非空（概念與實踐不可為空陣列）', () => {
    for (const d of AIOS_DIMENSIONS) {
      expect(d.concepts.length).toBeGreaterThan(0);
      expect(d.practices.length).toBeGreaterThan(0);
      expect(d.zh.length).toBeGreaterThan(0);
      expect(d.en.length).toBeGreaterThan(0);
    }
  });

  it('化身：藍圖自載 10 位，表內具名 8 位（如實並存，不杜撰缺額）', () => {
    expect(report.avatarNamedCount).toBe(8);
    expect(report.avatarDeclaredCount).toBe(AIOS_DECLARED_AVATAR_COUNT);
    expect(AIOS_DECLARED_AVATAR_COUNT).toBe(10);
    expect(AIOS_AVATARS.map((a) => a.zh)).toContain('真理探測者');
    expect(AIOS_AVATARS.map((a) => a.zh)).toContain('代理執行官');
    // 藍圖未提供英文名者如實為 null。
    expect(AIOS_AVATARS.find((a) => a.zh === '符文連結師')?.en).toBeNull();
  });

  it('四大聖柱、六式奧義、四大公理', () => {
    expect(AIOS_PILLARS.map((p) => p.zh)).toEqual([
      '簡潔性',
      '快速性',
      '穩定性',
      '進化性',
    ]);
    expect(AIOS_SECRET_ARTS.map((a) => a.zh)).toEqual([
      '感知式',
      '解析式',
      '決策式',
      '執行式',
      '反饋式',
      '超越式',
    ]);
    expect(AIOS_AXIOMS.map((a) => a.zh)).toEqual([
      '終始一如',
      '萬能平衡',
      '創元實錄',
      '萬有引力',
    ]);
    expect(AIOS_PILLARS.find((p) => p.zh === '快速性')?.kpi).toBe('<300ms 響應時間');
    // 藍圖未為進化性載明 KPI，如實為 null。
    expect(AIOS_PILLARS.find((p) => p.zh === '進化性')?.kpi).toBeNull();
  });

  it('項數誠實揭露：逐條列舉 92 項，與藍圖自載 64 項並列對照', () => {
    expect(report.encodedItemCount).toBe(92);
    expect(report.declaredItemCount).toBe(AIOS_DECLARED_ITEM_COUNT);
    expect(AIOS_DECLARED_ITEM_COUNT).toBe(64);
  });
});

describe('AIOS 融合矩陣: De-Google 政策把關', () => {
  it('外部整合一律標記為敘事引用（narrative-reference）', () => {
    for (const x of AIOS_EXTERNAL_INTEGRATIONS) {
      expect(x.status).toBe('narrative-reference');
    }
  });

  it('Gemini API 僅為敘事引用，註記 De-Google 禁令', () => {
    const gemini = AIOS_EXTERNAL_INTEGRATIONS.find((x) => x.name === 'Gemini API');
    expect(gemini).toBeDefined();
    expect(gemini?.note).toContain('De-Google');
  });

  it('本套件 manifest 零 runtime 依賴，且無任何 Google/Gemini 相依', () => {
    const manifestPath = fileURLToPath(new URL('../package.json', import.meta.url));
    const manifest: {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    } = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    const all = {
      ...(manifest.dependencies ?? {}),
      ...(manifest.devDependencies ?? {}),
    };
    expect(Object.keys(manifest.dependencies ?? {})).toEqual([]);
    for (const [name] of Object.entries(all)) {
      expect(name.toLowerCase()).not.toMatch(/google|gemini|firebase/);
    }
  });

  it('技術基石 inRepoDependency 如實標註（不宣稱未整合之項）', () => {
    const narrative = AIOS_TECH_STACK.filter((t) => !t.inRepoDependency).map((t) => t.name);
    expect(narrative).toEqual(['AITable.ai', 'Straico AI']);
  });
});

describe('AIOS 融合矩陣: 元件即代理運行層', () => {
  const ok = (detail: string): AiosIntentResult => ({ ok: true, trace: [detail], detail });

  it('註冊維度代理 → dispatch → 軌跡留 MECE 核心歸因', async () => {
    const matrix = new AiosFusionMatrix()
      .register(6, () => ok('接口攝取')) // 感知
      .register(1, () => ok('中央決策')) // 認知
      .register(12, () => ok('主題渲染')); // 表達
    expect(matrix.has(6)).toBe(true);
    expect(matrix.has(2)).toBe(false);

    await matrix.dispatch({ dimension: 6, action: 'ingest', payload: { raw: 'x' } });
    await matrix.dispatch({ dimension: 1, action: 'decide' });
    const last = await matrix.dispatch({ dimension: 12, action: 'render' });

    const trail = matrix.trail();
    expect(trail.map((r) => r.seq)).toEqual([1, 2, 3]);
    expect(trail.map((r) => r.coreId)).toEqual(['perception', 'cognition', 'expression']);
    expect(trail.map((r) => r.coreZh)).toEqual(['感知核心', '認知核心', '表達核心']);
    expect(last.dimensionZh).toBe('萬能主題引擎');
    expect(last.ok).toBe(true);
    // 軌跡紀錄深凍結。
    expect(Object.isFrozen(last)).toBe(true);
  });

  it('單次迴圈場景：感知 → 認知 → 表達（奧義閉環）', async () => {
    const matrix = new AiosFusionMatrix()
      .register(8, () => ok('監控異常偵測')) // 感知
      .register(1, () => ok('量子決策模型裁決')) // 認知
      .register(11, () => ok('語義印記落庫')) // 記憶
      .register(12, () => ok('啟蒙詩篇輸出')); // 表達
    await matrix.dispatch({ dimension: 8, action: 'sense' });
    await matrix.dispatch({ dimension: 1, action: 'decide' });
    await matrix.dispatch({ dimension: 11, action: 'settle' });
    await matrix.dispatch({ dimension: 12, action: 'express' });
    expect(matrix.trail().map((r) => r.coreId)).toEqual([
      'perception',
      'cognition',
      'memory',
      'expression',
    ]);
  });

  it('防呆：未知維度 / 重複註冊 / 未註冊調度 / 維度錯置', async () => {
    const matrix = new AiosFusionMatrix();
    // 未知維度（13 不在 1–12）
    expect(() => matrix.register(13 as never, () => ok('x'))).toThrowError(AiosMatrixError);
    matrix.register(1, () => ok('d'));
    // 重複註冊
    expect(() => matrix.register(1, () => ok('d2'))).toThrowError(AiosMatrixError);
    // 未註冊調度
    await expect(matrix.dispatch({ dimension: 9, action: 'x' })).rejects.toThrowError(
      AiosMatrixError,
    );
  });

  it('coreOf 拓撲查詢與錯誤傳播', () => {
    expect(AiosFusionMatrix.coreOf(9).id).toBe('nexus');
    expect(AiosFusionMatrix.coreOf(4).zh).toBe('記憶核心');
    expect(() => AiosFusionMatrix.coreOf(99 as never)).toThrowError(AiosMatrixError);
  });

  it('處理器未留痕（trace 為空）拒絕結案', async () => {
    const matrix = new AiosFusionMatrix().register(2, () => ({ ok: true, trace: [] }));
    await expect(matrix.dispatch({ dimension: 2, action: 'x' })).rejects.toThrowError(
      AiosMatrixError,
    );
  });
});

describe('AIOS 融合矩陣: 世界觀與藍圖出處', () => {
  it('三大世界觀原則', () => {
    expect(AIOS_WORLDVIEW.map((w) => w.zh)).toEqual([
      '以終為始，始終如一',
      '萬能進化無限循環',
      '人機共生',
    ]);
  });

  it('source_origin 載明藍圖出處', () => {
    expect(AIOS_SOURCE_ORIGIN).toContain('AIOS 系統終極融合矩陣');
    expect(AIOS_SOURCE_ORIGIN).toContain('v5.0');
  });
});
