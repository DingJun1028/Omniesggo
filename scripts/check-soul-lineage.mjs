#!/usr/bin/env node
// soul.md 版本堆疊 CI 檢查 — Omniesggo issue #91 第 2 項
// 對齊章節：soul.md §十四（簽印與版本血脈）、§八（Key-Ω 三鎖：Ω-2 產物鎖鎖版本血脈）、§1.2（不可篡改區）。
// 用法：於倉庫根目錄執行 node scripts/check-soul-lineage.mjs（workflow 需 fetch-depth: 0）。
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

let failed = false;
function fail(msg) { console.error("[soul-lineage] FAIL: " + msg); failed = true; }
function ok(msg) { console.log("[soul-lineage] OK: " + msg); }

const lineagePath = "docs/soul-lineage.json";
if (!existsSync(lineagePath)) { fail(lineagePath + " 不存在"); process.exit(1); }
const lineage = JSON.parse(readFileSync(lineagePath, "utf8"));
const entries = lineage.entries || [];
if (entries.length === 0) fail("版本堆疊登記為空");

// 1. 版本鏈連續性：每版 +0.0.1，previous 接續前一版（§十四）
for (let i = 0; i < entries.length; i++) {
  const e = entries[i];
  if (!/^\d+\.\d+\.\d+$/.test(e.version)) fail("版本格式錯誤: " + e.version);
  if (i === 0) {
    if (e.previous !== null) fail("第一版 previous 應為 null，實際: " + e.previous);
  } else {
    const p = entries[i - 1];
    if (e.previous !== p.version) fail("版本 " + e.version + " previous(" + e.previous + ") 未接續前一版 " + p.version);
    const prev = p.version.split(".").map(Number);
    const cur = e.version.split(".").map(Number);
    if (cur[0] !== prev[0] || cur[1] !== prev[1] || cur[2] !== prev[2] + 1)
      fail("版本 " + e.version + " 未依 §十四 規則 +0.0.1 接續 " + p.version);
  }
}

// 2. 最新版與根目錄 soul.md 一致（版本行 + git blob SHA）
const soulPath = "soul.md";
if (!existsSync(soulPath)) { fail("根目錄 soul.md 不存在"); process.exit(1); }
const soul = readFileSync(soulPath, "utf8");
const m = soul.match(/系統版本：ESG GO v(\d+\.\d+\.\d+)/);
if (!m) { fail("soul.md 找不到版本行（系統版本：ESG GO vX.Y.Z）"); process.exit(1); }
const curVer = m[1];
const latest = entries[entries.length - 1];
if (curVer !== latest.version)
  fail("soul.md 現版 " + curVer + " 與 lineage 最新登記 " + latest.version + " 不一致，請新增堆疊條目");
const buf = Buffer.from(soul, "utf8");
const header = Buffer.from("blob " + buf.length + "\n", "utf8");
const blobSha = createHash("sha1").update(Buffer.concat([header, buf])).digest("hex");
if (blobSha !== latest.soulBlobSha)
  fail("soul.md blob SHA " + blobSha + " 與登記 " + latest.soulBlobSha + " 不一致");

// 3. §1.2 不可篡改區逐字比對（MD5 canary；正式安全雜湊由 Hash Lock 程序負責）
const lines = soul.split("\n");
const start = lines.findIndex((l) => l.startsWith("1.2") && l.includes("狀態機控制法則"));
if (start < 0) { fail("找不到 §1.2 不可篡改區"); process.exit(1); }
const block = [];
for (let i = start; i < lines.length; i++) {
  if (lines[i].startsWith("═")) break;
  block.push(lines[i]);
}
const md5 = createHash("md5").update(block.join("\n"), "utf8").digest("hex");
if (md5 !== latest.frozenZoneMd5)
  fail("§1.2 不可篡改區已變更（md5 " + md5 + " ≠ 登記 " + latest.frozenZoneMd5 + "）；§1.2 任何版本皆不得放寬（§十四）");
ok("版本鏈連續且最新版 " + curVer + " 與 soul.md 內容一致");

// 4. 舊版可回溯：歷史條目 commitSha 必須存在於 git 歷史（最新版由 blob SHA 錨定，commit 於合併後回填亦可）
for (const e of entries.slice(0, -1)) {
  try {
    execSync("git cat-file -e " + e.commitSha + "^{commit}", { stdio: "pipe" });
    ok("版本 " + e.version + " commit " + e.commitSha.slice(0, 7) + " 可回溯");
  } catch (err) {
    fail("版本 " + e.version + " commit " + e.commitSha + " 不在 git 歷史中（workflow 需 fetch-depth: 0）");
  }
}

// 5. 三份 soul.md 副本存在；根目錄為主軸，差異僅於 PR 說明（不刪除、不修改）
for (const p of lineage.copies || []) {
  if (!existsSync(p)) fail("soul.md 副本不存在: " + p);
  else ok("副本存在: " + p);
}

if (failed) process.exit(1);
console.log("[soul-lineage] PASS: soul.md 版本堆疊檢查全數通過");
