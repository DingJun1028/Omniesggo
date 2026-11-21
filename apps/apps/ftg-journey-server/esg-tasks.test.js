// 5T 守門驗證 — ftg-journey-server ESG 任務目錄 / impact 對應 / 碳足跡換算
//
// 為何需要這份測試（2026-09-30）:
//
//   修正前 server.js 的 ESG 任務規則散落三處且彼此不一致，實測到三個真實缺陷：
//
//   A. GET /api/journeys/:id/esg-tasks 只回 { id, title, icon }，沒有 fields。
//      而 JourneyDetail.jsx 的 openTask() 執行 task.fields.forEach(...)
//      → 點任何一個 ESG 任務都會 TypeError，覺曉流的表單根本開不出來。
//      修正前 grep "fields" server.js → 0 筆命中，可證明欄位從未被提供。
//
//   B. POST /esg-tasks 的 impactSync 為 carbon 指定
//      { metric_id: 'carbon_saved', key: 'distance', unit: 'kg' }，
//      實際寫入的是「公里數」卻標示 kg。ImpactNotePage 會把這筆拿去對外
//      產出 GRI 305 碳排報告 → 對外揭露的數字單位錯誤。
//
//   C. 碳係數查表寫成 factors[mode] || 0.17。factors['步行'] === 0 為 falsy，
//      因此步行/腳踏車（零排放）會穿透到 0.17，被算成開汽車的碳排。
//
//   D. GET /summary 的 total_impact_value 把 impact 全部 value 相加，
//      等於把 kg + 件 + 種 + 元 + L 加成一個數字，該數字沒有物理意義。
//
// 隔離說明: apps/ftg-journey-server/node_modules 在本 repo 不完整
//   （express 僅有 History.md，無 index.js），無法真正啟動 server.js。
//   故本測試直接 import 純函式模組 esg-tasks.js（零 I/O、零 express 依賴），
//   驗證規則本身；server.js 已改為 import 同一模組，故規則與實作同源。
//   「後端對外揭露的 metric 必須被前端 ImpactNotePage 宣告」這條跨檔契約
//   由下方 metric 集合斷言守住，避免再漂移。
//
// 執行: pnpm vitest run apps/ftg-journey-server/esg-tasks.test.js

import { test, expect, describe } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ESG_TASKS,
  CARBON_FACTORS,
  getTask,
  carbonKg,
  impactRowsForTask,
  metricIdsForTask,
  sourceKeysForTask,
  summarizeImpact,
  summarizeTaskLogs,
} from './esg-tasks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const notePageSrc = fs.readFileSync(
  path.join(__dirname, '..', 'ftg-journey-web', 'src', 'pages', 'ImpactNotePage.jsx'),
  'utf8'
);

// ─── 缺陷 A：任務目錄必須帶 fields，否則前端表單開不出來 ────────────────
describe('缺陷 A — ESG 任務目錄必須提供 fields', () => {
  test('每個任務都有非空 fields 陣列', () => {
    for (const task of ESG_TASKS) {
      expect(Array.isArray(task.fields), `任務 ${task.id} 缺 fields`).toBe(true);
      expect(task.fields.length, `任務 ${task.id} 的 fields 是空的`).toBeGreaterThan(0);
    }
  });

  test('每個欄位都有 name / label / type，且 name 唯一', () => {
    for (const task of ESG_TASKS) {
      const names = task.fields.map((f) => f.name);
      expect(new Set(names).size, `任務 ${task.id} 有重複欄位名`).toBe(names.length);
      for (const f of task.fields) {
        expect(f.name, `任務 ${task.id} 有欄位缺 name`).toBeTruthy();
        expect(f.label, `任務 ${task.id} 欄位 ${f.name} 缺 label`).toBeTruthy();
        expect(['number', 'text', 'select'], `欄位 ${f.name} 的 type 不被前端支援`).toContain(f.type);
      }
    }
  });

  test('select 欄位必須有非空 options（前端 field.options.map 直接迭代）', () => {
    for (const task of ESG_TASKS) {
      for (const f of task.fields) {
        if (f.type !== 'select') continue;
        expect(Array.isArray(f.options), `任務 ${task.id} 欄位 ${f.name} 是 select 卻沒 options`).toBe(true);
        expect(f.options.length).toBeGreaterThan(0);
      }
    }
  });

  test('碳足跡的交通方式選項與碳係數表完全一致（不可漂移）', () => {
    const modeField = getTask('carbon').fields.find((f) => f.name === 'mode');
    expect(modeField.type).toBe('select');
    expect([...modeField.options].sort()).toEqual(Object.keys(CARBON_FACTORS).sort());
  });

  test('每個任務都有 id / title / icon（前端 modal 直接渲染）', () => {
    for (const task of ESG_TASKS) {
      expect(task.id).toBeTruthy();
      expect(task.title).toBeTruthy();
      expect(task.icon).toBeTruthy();
    }
  });

  test('getTask 對未知 id 回傳 null（不得拋例外）', () => {
    expect(getTask('nope')).toBeNull();
    expect(getTask(undefined)).toBeNull();
  });
});

// ─── 缺陷 B：carbon_saved 必須是 kg，不是公里數 ────────────────────────
describe('缺陷 B — impact 數值與單位必須一致', () => {
  test('汽車 100km 單人 → carbon_saved 為 17kg，而非 100', () => {
    const rows = impactRowsForTask('carbon', { distance: '100', mode: '汽車', passengers: '1' });
    const carbon = rows.find((r) => r.metric_id === 'carbon_saved');
    expect(carbon.value).toBeCloseTo(17, 5);
    expect(carbon.unit).toBe('kg');
  });

  test('距離另存一筆 distance = 100km，兩筆單位各自正確', () => {
    const rows = impactRowsForTask('carbon', { distance: '100', mode: '汽車', passengers: '1' });
    const dist = rows.find((r) => r.metric_id === 'distance');
    expect(dist.value).toBe(100);
    expect(dist.unit).toBe('km');
  });

  test('步行 10km 不產生 carbon_saved 列（零排放），但保留 distance', () => {
    const rows = impactRowsForTask('carbon', { distance: '10', mode: '步行', passengers: '1' });
    expect(rows.find((r) => r.metric_id === 'carbon_saved')).toBeUndefined();
    const dist = rows.find((r) => r.metric_id === 'distance');
    expect(dist.value).toBe(10);
    expect(dist.unit).toBe('km');
  });

  test('各任務 impact 對應的單位正確', () => {
    expect(impactRowsForTask('cleanup', { count: '12' })).toEqual([
      { metric_id: 'trash_collected', value: 12, unit: '件' },
    ]);
    expect(impactRowsForTask('biodiversity', { count: '3' })).toEqual([
      { metric_id: 'species_observed', value: 3, unit: '種' },
    ]);
    expect(impactRowsForTask('local', { amount: '450' })).toEqual([
      { metric_id: 'local_spending', value: 450, unit: '元' },
    ]);
    expect(impactRowsForTask('water', { saved: '120' })).toEqual([
      { metric_id: 'water_saved', value: 120, unit: 'L' },
    ]);
    expect(impactRowsForTask('waste', { count: '5' })).toEqual([
      { metric_id: 'waste_reduced', value: 5, unit: '件' },
    ]);
  });

  test('0 / 負數 / 缺漏 / 非數字 一律不產生 impact 列（不寫噪音資料）', () => {
    for (const bad of [0, -5, '', 'abc', null, undefined, NaN]) {
      expect(impactRowsForTask('cleanup', { count: bad }), `count=${bad} 竟產生列`).toEqual([]);
    }
  });

  test('未知 task_id 回傳空陣列（不得拋例外）', () => {
    expect(impactRowsForTask('nope', { count: 1 })).toEqual([]);
    expect(metricIdsForTask('nope')).toEqual([]);
  });
});

// ─── 缺陷 C：碳係數 0 不得被 || 兜底成汽車 ──────────────────────────────
describe('缺陷 C — 碳足跡係數必須正確處理 0', () => {
  test('步行與腳踏車為零排放', () => {
    expect(carbonKg({ distance: 10, mode: '步行', passengers: 1 })).toBe(0);
    expect(carbonKg({ distance: 10, mode: '腳踏車', passengers: 1 })).toBe(0);
  });

  test('其餘模式依係數換算', () => {
    expect(carbonKg({ distance: 100, mode: '公車/捷運', passengers: 1 })).toBeCloseTo(5, 5);
    expect(carbonKg({ distance: 100, mode: '火車', passengers: 1 })).toBeCloseTo(4, 5);
    expect(carbonKg({ distance: 100, mode: '飛機', passengers: 1 })).toBeCloseTo(25, 5);
  });

  test('乘客人數正確分攤', () => {
    expect(carbonKg({ distance: 100, mode: '汽車', passengers: 4 })).toBeCloseTo(4.25, 5);
  });

  test('非法乘客人數（0 / 負數 / 缺漏）以 1 人計，不產生 Infinity 或 NaN', () => {
    for (const p of [0, -3, '', 'x', null, undefined]) {
      const v = carbonKg({ distance: 100, mode: '汽車', passengers: p });
      expect(Number.isFinite(v), `passengers=${p} 產生非有限值`).toBe(true);
      expect(v).toBeCloseTo(17, 5);
    }
  });

  test('未知模式退回汽車係數（而非 0 或 NaN）', () => {
    expect(carbonKg({ distance: 100, mode: '火箭', passengers: 1 })).toBeCloseTo(17, 5);
    expect(carbonKg({ distance: 100, mode: undefined, passengers: 1 })).toBeCloseTo(17, 5);
  });

  test('距離缺漏或非正值時回傳 0', () => {
    for (const d of [0, -10, '', 'abc', null, undefined, NaN]) {
      expect(carbonKg({ distance: d, mode: '汽車' }), `distance=${d} 竟非 0`).toBe(0);
    }
  });

  test('全部係數皆為非負有限數', () => {
    for (const [mode, f] of Object.entries(CARBON_FACTORS)) {
      expect(Number.isFinite(f), `${mode} 係數非有限數`).toBe(true);
      expect(f, `${mode} 係數為負`).toBeGreaterThanOrEqual(0);
    }
  });
});

// ─── 缺陷 D：不可跨單位加總 ────────────────────────────────────────────
describe('缺陷 D — 影響彙總不可跨單位硬加', () => {
  test('依 metric 分組彙總，不產生混合單位的總數', () => {
    const rows = [
      { metric_id: 'carbon_saved', value: 17 },
      { metric_id: 'trash_collected', value: 12 },
      { metric_id: 'local_spending', value: 450 },
    ];
    const { by_metric, metric_count } = summarizeImpact(rows);
    expect(by_metric).toEqual({ carbon_saved: 17, trash_collected: 12, local_spending: 450 });
    expect(metric_count).toBe(3);
    // 關鍵：結果物件上不得存在任何「把 kg+件+元 加起來」的欄位
    expect(by_metric.total).toBeUndefined();
  });

  test('同 metric 多筆會累加', () => {
    const { by_metric } = summarizeImpact([
      { metric_id: 'trash_collected', value: 5 },
      { metric_id: 'trash_collected', value: 7 },
    ]);
    expect(by_metric.trash_collected).toBe(12);
  });

  test('空 / 壞輸入回傳空彙總，不拋例外', () => {
    expect(summarizeImpact([])).toEqual({ by_metric: {}, metric_count: 0 });
    expect(summarizeImpact(null)).toEqual({ by_metric: {}, metric_count: 0 });
    expect(summarizeImpact([{ metric_id: 'x', value: 'abc' }])).toEqual({
      by_metric: {},
      metric_count: 0,
    });
  });
});

// ─── 歷程統計（totals）───
describe('esg-tasks totals 統計', () => {
  test('carbon totals.carbon 是 kg、totals.distance 是 km', () => {
    const totals = summarizeTaskLogs([
      { task_id: 'carbon', data: JSON.stringify({ distance: 100, mode: '汽車', passengers: 1 }) },
      { task_id: 'carbon', data: JSON.stringify({ distance: 40, mode: '飛機', passengers: 2 }) },
    ]);
    expect(totals.carbon).toBeCloseTo(17 + 5, 5);
    expect(totals.distance).toBe(140);
  });

  test('各任務 totals 累加正確', () => {
    const totals = summarizeTaskLogs([
      { task_id: 'cleanup', data: { count: 5 } },
      { task_id: 'cleanup', data: { count: 7 } },
      { task_id: 'biodiversity', data: { count: 2 } },
      { task_id: 'local', data: { amount: 300 } },
      { task_id: 'water', data: { saved: 50 } },
      { task_id: 'waste', data: { count: 3 } },
    ]);
    expect(totals).toEqual({
      cleanup: 12,
      biodiversity: 2,
      local: 300,
      water: 50,
      waste: 3,
    });
  });

  test('data 為壞掉的 JSON 時跳過而非拋例外', () => {
    const totals = summarizeTaskLogs([
      { task_id: 'cleanup', data: '{not json' },
      { task_id: 'cleanup', data: JSON.stringify({ count: 4 }) },
    ]);
    expect(totals.cleanup).toBe(4);
  });

  test('空輸入回傳空物件', () => {
    expect(summarizeTaskLogs([])).toEqual({});
    expect(summarizeTaskLogs(null)).toEqual({});
  });
});

// ─── 跨檔契約：後端寫出的 metric 必須被前端 ImpactNotePage 宣告 ──────────
// 檢查「實際程式碼」而非註解文字：下方 serverSrcCode() 會先剝掉 // 與 /* */ 註解。
// 否則修正說明本身提到舊欄位名，會讓斷言自我否證（首次實測即因此誤判失敗）。
function serverSrcCode() {
  return fs
    .readFileSync(path.join(__dirname, 'server.js'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/.*$/gm, '');
}

describe('跨檔契約 — metric 必須被前端 Impact Note 宣告', () => {
  test('後端會寫出的每個 metric_id 都出現在 ImpactNotePage 的 metrics 清單', () => {
    for (const task of ESG_TASKS) {
      for (const metricId of metricIdsForTask(task.id)) {
        expect(
          notePageSrc.includes(`id: '${metricId}'`),
          `ImpactNotePage 的 metrics 未宣告後端會寫出的 metric: ${metricId}`
        ).toBe(true);
      }
    }
  });

  test('後端會寫出的每個 metric_id 都有 SDG 與 GRI 對應', () => {
    for (const task of ESG_TASKS) {
      for (const metricId of metricIdsForTask(task.id)) {
        expect(
          notePageSrc.includes(`${metricId}: [`),
          `ImpactNotePage 缺少 ${metricId} 的 METRIC_SDGS_MAP / METRIC_GRI_MAP 對應`
        ).toBe(true);
      }
    }
  });

  test('impact 讀取的所有欄位 key 都必須出現在該任務的 fields 內', () => {
    for (const task of ESG_TASKS) {
      const fieldNames = task.fields.map((f) => f.name);
      for (const key of sourceKeysForTask(task.id)) {
        expect(
          fieldNames,
          `任務 ${task.id} 會讀 data['${key}'] 寫入 impact，但表單沒有這個欄位，使用者填不到`
        ).toContain(key);
      }
    }
  });

  test('後端不再硬編碼 impactSync（已抽離至 esg-tasks.js 單一真實）', () => {
    expect(
      serverSrcCode().includes('impactSync'),
      'server.js 仍殘留 impactSync，規則會與 esg-tasks.js 漂移'
    ).toBe(false);
  });

  test('server.js 確實 import esg-tasks.js（規則同源，非各自複製）', () => {
    expect(serverSrcCode()).toMatch(/from ['"]\.\/esg-tasks\.js['"]/);
  });

  test('server.js 不再以 factors[mode] || 兜底（缺陷 C 已修）', () => {
    expect(
      serverSrcCode().includes('factors[mode] || 0.17'),
      'server.js 仍殘留 || 兜底，步行會被算成汽車碳排'
    ).toBe(false);
  });

  test('server.js 不再以 total_impact_value 硬加總（缺陷 D 已修）', () => {
    expect(
      serverSrcCode().includes('total_impact_value'),
      'server.js 仍回傳混合單位的 total_impact_value'
    ).toBe(false);
  });

  test('GET /esg-tasks 回傳的是含 fields 的目錄（缺陷 A 已修）', () => {
    // 前端 openTask() 讀 task.fields.forEach，後端必須真的回 fields。
    expect(serverSrcCode()).toMatch(/tasks:\s*ESG_TASKS/);
  });

  // ─── 缺陷 E：SQLite 無法綁定 undefined，選填欄位缺漏會讓整個請求 500 ──
  test('缺陷E: 三個 db helper 皆有正規化 undefined（否則少送選填欄位即 500）', () => {
    const code = serverSrcCode();
    // node:sqlite 對 undefined 拋 "Provided value cannot be bound to SQLite parameter N"，
    // 故 get/all/run 皆須經過 norm()。逐一斷言，避免只修一個漏掉其餘兩個。
    expect(code).toMatch(/const norm = .*undefined \? null : undefined|const norm = \(p\) => p\.map\(\(v\) => \(v === undefined \? null : v\)\)/);
    expect(code).toMatch(/const get = \(sql, \.\.\.p\) => db\.prepare\(sql\)\.get\(\.\.\.norm\(p\)\)/);
    expect(code).toMatch(/const all = \(sql, \.\.\.p\) => db\.prepare\(sql\)\.all\(\.\.\.norm\(p\)\)/);
    expect(code).toMatch(/const run = \(sql, \.\.\.p\) => db\.prepare\(sql\)\.run\(\.\.\.norm\(p\)\)/);
  });

  // ─── 缺陷 F：notes 表無 email 欄位，徽章查詢使每次 ESG 提交回 500 ────
  test('缺陷F: notes 徽章查詢不得使用 email 欄位（該欄位不存在）', () => {
    const code = serverSrcCode();
    // 舊版 SELECT ... FROM notes WHERE email=? 會拋 "no such column: email"，
    // 且該查詢位於 POST /esg-tasks 寫入之後 → 資料已寫入但回應 500。
    expect(
      /FROM notes WHERE email=/.test(code),
      'server.js 仍以 notes.email 查詢，但 notes 表沒有 email 欄位'
    ).toBe(false);
    expect(code).toMatch(/FROM notes WHERE journey_id=\?/);
  });

  test('缺陷F: notes 表 schema 確實沒有 email 欄位（守住修正前提）', () => {
    // 直接讀 schema 定義，若日後有人加欄位，這條會提醒同步更新徽章查詢。
    const code = serverSrcCode();
    const schema = code.match(/CREATE TABLE IF NOT EXISTS notes \(([^)]*)\)/);
    expect(schema, '找不到 notes 建表敘述').toBeTruthy();
    expect(schema[1]).not.toMatch(/\bemail\b/);
  });

  test('缺陷F: checkins 表有 email 欄位，其徽章查詢維持不變', () => {
    const code = serverSrcCode();
    const schema = code.match(/CREATE TABLE IF NOT EXISTS checkins \(([^)]*)\)/);
    expect(schema, '找不到 checkins 建表敘述').toBeTruthy();
    expect(schema[1]).toMatch(/\bemail\b/);
    expect(code).toMatch(/FROM checkins WHERE email=\?/);
  });
});
