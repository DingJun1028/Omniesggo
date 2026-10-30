#!/usr/bin/env node
// 產生 OMN-PRD-001 schema/contract ↔ 需求編號追溯表（Omniesggo issue #91 第 3 項）
// 對齊：soul.md §7.5（跨文檔對齊聲明）、§1.1 5T（Traceable/Trustworthy：禁止虛報）。
// 2026-10-30 擴充（issue #91 第 1 項 TypeBox 遷移落地後）：掃描 TypeBox schema 定義檔（Type.Object），
// 依檔內 FR-xx/NFR-xx 標註（慣例：檔頭 `// PRD: docs/OMN-PRD-001.md §4.1 FR-xx`）掛需求編號；
// 未標註者如實列出（不虛報）；標註未知編號即 FAIL。
// 用法：
//   node scripts/generate-schema-traceability.mjs          # 生成 docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md
//   node scripts/generate-schema-traceability.mjs --check  # CI 檢查：與磁碟比對，drift/孤兒/缺檔/未知編號即 exit 1
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";

const CANON = "shared/prd-matrix.json";
const OUT = "docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md";
const SCHEMA_PATTERN = /(schema|rune-contract|core-contract|protocol|contract|migrations?|\.sql$)/i;

function classify(f) { return SCHEMA_PATTERN.test(f) || f.startsWith("src/types/") || f.startsWith("shared/types"); }

// ── TypeBox schema 定義檔掃描 ──────────────────────────────────────────
const EXCLUDE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".next", ".turbo", "coverage", ".vercel"]);

function walkTs(dir, base = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + e.name : e.name;
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.has(e.name)) {
        out.push(...walkTs(dir + "/" + e.name, rel));
      }
    } else if (/\.(ts|mts)$/.test(e.name)) {
      out.push(rel);
    }
  }
  return out;
}

let failed = false;

function fail(m) { console.error("[schema-traceability] FAIL: " + m); failed = true; }
function ok(m) { console.log("[schema-traceability] OK: " + m); }

if (!existsSync(CANON)) { console.error("缺少 canonical " + CANON); process.exit(1); }

const matrix = JSON.parse(readFileSync(CANON, "utf8"));
const allReqs = [...(matrix.requirements || []), ...(matrix.nfr || [])];
const reqIndex = new Map(allReqs.map(r => [r.id, r]));
const rows = allReqs.map(r => ({ ...r, files: (r.evidence || []).filter(classify) }));

// 雙向檢查：列出之證據檔必須存在且掛的需求編號必須存在（無孤兒、無虛報）
const seen = new Map();
for (const r of rows) {
  for (const f of r.files) {
    const holders = seen.get(f) || [];
    holders.push(r.id);
    seen.set(f, holders);
  }
}
for (const [file, ids] of seen) {
  if (!existsSync(file)) { fail("證據檔不存在: " + file + " (" + ids.join(", ") + ")"); }
  for (const id of ids) {
    if (!reqIndex.has(id)) { fail("檔案 " + file + " 掛了未知需求編號 " + id); }
  }
}
const uncovered = rows.filter(r => r.files.length === 0).map(r => r.id);
ok("需求 " + rows.length + " 項；schema/contract 證據檔 " + seen.size + " 個；無 schema 證據之需求（如實標示，非虛報）: " + (uncovered.join(", ") || "無"));

// ── TypeBox schema 掃描：檔案 ↔ 需求編號（FR-xx/NFR-xx 檔內標註） ─────────
const typeboxRows = [];
for (const f of walkTs(".")) {
  const c = readFileSync(f, "utf8");
  const objs = (c.match(/Type\.Object\(/g) || []).length;
  if (objs === 0) { continue; }
  const ids = [...new Set([...c.matchAll(/\b(FR-\d+|NFR-\d+)\b/g)].map(m => m[1]))];
  for (const id of ids) {
    if (!reqIndex.has(id)) { fail("TypeBox 檔案 " + f + " 標註了未知需求編號 " + id + "（虛報防護）"); }
  }
  typeboxRows.push({ file: f, objs, ids });
}
typeboxRows.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));
const tbLinked = typeboxRows.filter(r => r.ids.length > 0);
const tbUnlinked = typeboxRows.filter(r => r.ids.length === 0);
ok("TypeBox schema 定義檔 " + typeboxRows.length + " 個（Type.Object 共 " + typeboxRows.reduce((s, r) => s + r.objs, 0) + " 處）；已掛需求編號: " + tbLinked.length + "；未掛需求編號（如實標示，非虛報）: " + tbUnlinked.length);

// 生成 Markdown（與 docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md 逐字一致）
const L = [
  "# OMN-PRD-001 Schema ↔ Requirement Traceability（schema 掛需求編號追溯表）",
  "",
  "> AUTO-GENERATED — 本檔由 scripts/generate-schema-traceability.mjs 依 shared/prd-matrix.json 自動生成，請勿手改；重新生成：node scripts/generate-schema-traceability.mjs",
  "> Gate：node scripts/generate-schema-traceability.mjs --check（CI：Schema Traceability workflow）— drift 即 exit 1",
  "> 對齊：soul.md §7.5 跨文檔對齊聲明（OA 領域型別 ↔ 終始矩陣 canonical）",
  "",
  "## §7.5 落差聲明（2026-10-29 核實）",
  "",
  "- soul.md §7.5 所指 esggo/shared/types.ts 與 scripts/check-oa-types-sync.mjs 於 main 不存在（已於 issue #91 第 3 項 PR 如實列明）。",
  "- 現行真相源：shared/prd-matrix.json（verify:prd-matrix 閘）與 src/types/*、shared/types（PR #96 TS Matrix 收斂後之型別 canonical）。",
  "",
  "## 需求 ↔ Schema/Contract 檔矩陣",
  "",
  "| 需求 | 類型 | 優先級 | 狀態 | Schema/Contract 證據檔 |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map(r => "| " + r.id + " | " + r.type + " | " + r.priority + " | " + r.status + " | " + (r.files.length ? r.files.map(f => "`" + f + "`").join(", ") : "—") + " |"),
  "",
  "雙向閉合規則：每一需求必列於本表（無 schema 證據者如實標 —，不得虛報）；每一列出之證據檔必須存在於磁碟且其需求編號必須存在於 shared/prd-matrix.json（無孤兒）。",
  "",
  "## TypeBox Schema 定義檔 ↔ 需求編號矩陣（2026-10-30 擴充掃描）",
  "",
  "> 掃描規則：含 `Type.Object(` 之 .ts/.mts 檔為 TypeBox schema 定義檔；依檔內 FR-xx/NFR-xx 標註掛需求編號",
  "> （標註慣例：檔頭 `// PRD: docs/OMN-PRD-001.md §2.3 F-xx · §5.1 Mx · §4.1 FR-xx`）；未標註者如實列 —（不得虛報）；",
  "> 標註未知需求編號即 gate FAIL。達成 schema → 需求 → 功能 → 驗證之全鏈自動追溯。",
  "",
  "| TypeBox 定義檔 | Type.Object 定義數 | 掛需求編號 |",
  "| --- | --- | --- |",
  ...typeboxRows.map(r => "| `" + r.file + "` | " + r.objs + " | " + (r.ids.length ? r.ids.join(", ") : "—") + " |"),
  "",
  "小計：定義檔 " + typeboxRows.length + " 個；已掛需求編號 " + tbLinked.length + " 個；未掛需求編號 " + tbUnlinked.length + " 個（如實標示，後續以 PR 逐檔補標註）。",
  "",
  "## JunAiKey 唯讀共享大腦（skillCoverage，唯讀納入）",
  "",
  "| 技能 | 任務型別 | 角色 | 覆蓋需求 | 覆蓋 NFR | 證據 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...(matrix.skillCoverage || []).map(s => "| " + s.skillId + " | " + s.taskType + " | " + s.role + " | " + (s.requirements || []).join(", ") + " | " + (s.nfr || []).join(", ") + " | " + (s.evidence || []).map(f => "`" + f + "`").join(", ") + " |"),
  "",
  "JunAiKey 可讀內容以唯讀方式納入共享大腦（docs/vault-canon）；不觸 VPS 與 junaikey 之 VPS 腳本。",
  "",
  "## 後續",
  "",
  "- TypeBox schema 掃描已落地（2026-10-30，本表上方矩陣）；未掛需求編號之定義檔由後續 PR 依檔頭標註慣例逐檔補上，gate 將自動納入追溯。",
];
const content = L.join("\n") + "\n";

if (process.argv.includes("--check")) {
  if (!existsSync(OUT)) {
    fail(OUT + " 未生成，請先執行 node scripts/generate-schema-traceability.mjs 並提交");
  } else {
    const disk = readFileSync(OUT, "utf8");
    if (disk !== content) {
      fail(OUT + " 與 canonical 生成內容不一致（drift），請重新執行 scripts/generate-schema-traceability.mjs 並提交");
    } else {
      ok(OUT + " 與 canonical 一致");
    }
  }
  if (failed) { process.exit(1); }
  console.log("[schema-traceability] PASS: schema ↔ 需求追溯雙向檢查通過");
} else {
  writeFileSync(OUT, content);
  console.log("已生成 " + OUT);
  if (failed) { process.exit(1); }
}
