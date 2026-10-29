#!/usr/bin/env node
// 產生 OMN-PRD-001 schema/contract ↔ 需求編號追溯表（Omniesggo issue #91 第 3 項）
// 對齊：soul.md §7.5（跨文檔對齊聲明）、§1.1 5T（Traceable/Trustworthy：禁止虛報）。
// 用法：
//   node scripts/generate-schema-traceability.mjs          # 生成 docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md
//   node scripts/generate-schema-traceability.mjs --check  # CI 檢查：與磁碟比對，drift/孤兒/缺檔即 exit 1
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const CANON = "shared/prd-matrix.json";
const OUT = "docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md";
const SCHEMA_PATTERN = /(schema|rune-contract|core-contract|protocol|contract|migrations?|\.sql$)/i;
function classify(f) { return SCHEMA_PATTERN.test(f) || f.startsWith("src/types/") || f.startsWith("shared/types"); }

let failed = false;
function fail(m) { console.error("[schema-traceability] FAIL: " + m); failed = true; }
function ok(m) { console.log("[schema-traceability] OK: " + m); }

if (!existsSync(CANON)) { console.error("[schema-traceability] 缺少 canonical " + CANON); process.exit(1); }
const matrix = JSON.parse(readFileSync(CANON, "utf8"));
const allReqs = [...(matrix.requirements || []), ...(matrix.nfr || [])];
const reqIndex = new Map(allReqs.map(r => [r.id, r]));
const rows = allReqs.map(r => ({ ...r, files: (r.evidence || []).filter(classify) }));

// 雙向檢查：列出之證據檔必須存在且掛的需求編號必須存在（無孤兒、無虛報）
const seen = new Map();
for (const r of rows) {
  for (const f of r.files) {
    if (!seen.has(f)) seen.set(f, []);
    seen.get(f).push(r.id);
  }
}
for (const [file, ids] of seen) {
  if (!existsSync(file)) fail("證據檔不存在: " + file + " (" + ids.join(", ") + ")");
  for (const id of ids) if (!reqIndex.has(id)) fail("檔案 " + file + " 掛了未知需求編號 " + id);
}
const uncovered = rows.filter(r => r.files.length === 0).map(r => r.id);
ok("需求 " + rows.length + " 項；schema/contract 證據檔 " + seen.size + " 個；無 schema 證據之需求（如實標示，非虛報）: " + (uncovered.join(", ") || "無"));

// 生成 Markdown（與 docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md 逐字一致）
const L = [];
L.push("# OMN-PRD-001 Schema ↔ Requirement Traceability（schema 掛需求編號追溯表）");
L.push("");
L.push("> AUTO-GENERATED — 本檔由 scripts/generate-schema-traceability.mjs 依 shared/prd-matrix.json 自動生成，請勿手改；重新生成：node scripts/generate-schema-traceability.mjs");
L.push("> Gate：node scripts/generate-schema-traceability.mjs --check（CI：Schema Traceability workflow）— drift 即 exit 1");
L.push("> 對齊：soul.md §7.5 跨文檔對齊聲明（OA 領域型別 ↔ 終始矩陣 canonical）");
L.push("");
L.push("## §7.5 落差聲明（2026-10-29 核實）");
L.push("");
L.push("- soul.md §7.5 所指 esggo/shared/types.ts 與 scripts/check-oa-types-sync.mjs 於 main 不存在（已於 issue #91 第 3 項 PR 如實列明）。");
L.push("- 現行真相源：shared/prd-matrix.json（verify:prd-matrix 閘）與 src/types/*、shared/types（PR #96 TS Matrix 收斂後之型別 canonical）。");
L.push("");
L.push("## 需求 ↔ Schema/Contract 檔矩陣");
L.push("");
L.push("| 需求 | 類型 | 優先級 | 狀態 | Schema/Contract 證據檔 |");
L.push("| --- | --- | --- | --- | --- |");
for (const r of rows) {
  L.push("| " + r.id + " | " + r.type + " | " + r.priority + " | " + r.status + " | " + (r.files.length ? r.files.map(f => "`" + f + "`").join(", ") : "—") + " |");
}
L.push("");
L.push("雙向閉合規則：每一需求必列於本表（無 schema 證據者如實標 —，不得虛報）；每一列出之證據檔必須存在於磁碟且其需求編號必須存在於 shared/prd-matrix.json（無孤兒）。");
L.push("");
L.push("## JunAiKey 唯讀共享大腦（skillCoverage，唯讀納入）");
L.push("");
L.push("| 技能 | 任務型別 | 角色 | 覆蓋需求 | 覆蓋 NFR | 證據 |");
L.push("| --- | --- | --- | --- | --- | --- |");
for (const s of matrix.skillCoverage || []) {
  L.push("| " + s.skillId + " | " + s.taskType + " | " + s.role + " | " + (s.requirements || []).join(", ") + " | " + (s.nfr || []).join(", ") + " | " + (s.evidence || []).map(f => "`" + f + "`").join(", ") + " |");
}
L.push("");
L.push("JunAiKey 可讀內容以唯讀方式納入共享大腦（docs/vault-canon）；不觸 VPS 與 junaikey 之 VPS 腳本。");
L.push("");
L.push("## 後續（第 1 項 TypeBox 遷移落地後）");
L.push("");
L.push("- TypeBox schema 將掛需求編號（FR-xx），本表生成邏輯將擴充掃描 TypeBox schema 定義檔並納入矩陣，達成 schema → 需求 → 功能 → 驗證之全鏈自動追溯。");
const content = L.join("\n") + "\n";

if (process.argv.includes("--check")) {
  if (!existsSync(OUT)) { fail(OUT + " 未生成，請先執行 node scripts/generate-schema-traceability.mjs 並提交"); }
  else {
    const disk = readFileSync(OUT, "utf8");
    if (disk !== content) fail(OUT + " 與 canonical 生成內容不一致（drift），請重新執行 scripts/generate-schema-traceability.mjs 並提交");
    else ok(OUT + " 與 canonical 一致");
  }
  if (failed) process.exit(1);
  console.log("[schema-traceability] PASS: schema ↔ 需求追溯雙向檢查通過");
} else {
  writeFileSync(OUT, content);
  console.log("已生成 " + OUT);
}
