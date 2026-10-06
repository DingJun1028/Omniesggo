#!/usr/bin/env node
// ============================================================
// PRD 終始矩陣驗證閘 — OMN-PRD-001 Traceability Gate
// Convention: 英標繁博 (English Standard, Traditional Chinese Broad)
//
// Canonical source: shared/prd-matrix.json
// Human document : docs/OMN-PRD-001-TRACEABILITY.md
// PRD            : docs/OMN-PRD-001.md
//
// Closure rules (OMN-PRD-001 §4.4) — 任一項不過即 exit 1:
//   1. 每一項需求至少對應一項功能
//   2. 每一項功能至少支撐一項需求
//   3. 每一項成果至少由一項需求支撐
//   4. 每一項需求皆有對應驗證方法
//   5. 無孤兒項（引用 ID 必須存在）
//   6. 證據路徑必須真實存在（implemented/partial 不得虛報，planned 不得掛證據）
//   7. JSON ↔ Markdown ↔ PRD 三方位 ID 同步
//
// 用法: node scripts/verify-prd-matrix.mjs
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const failures = [];
const passes = [];

function check(ok, label, detail) {
  if (ok) {
    passes.push(label);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
  }
  return ok;
}

const MATRIX_PATH = path.join(root, 'shared', 'prd-matrix.json');
const STATUS = new Set(['implemented', 'partial', 'planned', 'manual']);
const ID_PATTERNS = {
  feature: /^F-\d{2}$/,
  requirement: /^(FR|NFR)-\d{2}$/,
  outcome: /^OR-\d{2}$/,
};

console.log(`${CYAN}── PRD 終始矩陣驗證閘 (OMN-PRD-001 §4.4) ──${RESET}`);

if (!fs.existsSync(MATRIX_PATH)) {
  console.error(`${RED}  ✗ canonical matrix missing: shared/prd-matrix.json${RESET}`);
  process.exit(1);
}

let matrix;
try {
  matrix = JSON.parse(fs.readFileSync(MATRIX_PATH, 'utf8'));
} catch (error) {
  console.error(`${RED}  ✗ shared/prd-matrix.json is not valid JSON: ${error.message}${RESET}`);
  process.exit(1);
}

const features = Array.isArray(matrix.features) ? matrix.features : [];
const requirements = Array.isArray(matrix.requirements) ? matrix.requirements : [];
const nfrs = Array.isArray(matrix.nfr) ? matrix.nfr : [];
const outcomes = Array.isArray(matrix.outcomes) ? matrix.outcomes : [];
const skills = Array.isArray(matrix.skillCoverage) ? matrix.skillCoverage : [];

const featureIds = new Set(features.map((f) => f.id));
const requirementIds = new Set(requirements.map((r) => r.id));
const nfrIds = new Set(nfrs.map((n) => n.id));
const outcomeIds = new Set(outcomes.map((o) => o.id));
const allIds = new Set([...featureIds, ...requirementIds, ...nfrIds, ...outcomeIds]);

// ── 1. ID shapes and uniqueness ─────────────────────────────
check(features.length > 0, 'features present');
check(features.every((f) => ID_PATTERNS.feature.test(f.id)), 'all feature ids match F-nn');
check(
  features.length === featureIds.size,
  'feature ids are unique',
  `duplicate feature ids detected`
);
check(
  [...featureIds].every((id) => ID_PATTERNS.feature.test(id)),
  'feature id format F-nn'
);
for (const [list, name, pattern] of [
  [requirements, 'requirement', ID_PATTERNS.requirement],
  [nfrs, 'NFR', ID_PATTERNS.requirement],
  [outcomes, 'outcome', ID_PATTERNS.outcome],
]) {
  check(
    list.every((item) => pattern.test(item.id)),
    `${name} id format`,
    `invalid id in ${name} list`
  );
  check(list.length === new Set(list.map((i) => i.id)).size, `${name} ids are unique`);
}

// ── 2. Closure rules 1-5 (§4.4) ────────────────────────────
for (const req of requirements) {
  const refs = Array.isArray(req.features) ? req.features : [];
  check(refs.length >= 1, `§4.1 ${req.id} → feature`, 'requirement has no feature');
  check(
    refs.every((id) => featureIds.has(id)),
    `§4.1 ${req.id} feature refs resolve`,
    `unknown feature ref: ${refs.filter((id) => !featureIds.has(id)).join(',')}`
  );
  check(
    typeof req.verification === 'string' && req.verification.trim().length > 0,
    `§4.4 ${req.id} has verification method`,
    'verification method missing'
  );
}

for (const feature of features) {
  const refs = Array.isArray(feature.supports) ? feature.supports : [];
  check(refs.length >= 1, `§4.1 feature ${feature.id} → requirement`, 'feature supports nothing');
  check(
    refs.every((id) => requirementIds.has(id)),
    `§4.4 feature ${feature.id} requirement refs resolve`,
    `unknown requirement ref: ${refs.filter((id) => !requirementIds.has(id)).join(',')}`
  );
}

for (const outcome of outcomes) {
  const reqRefs = Array.isArray(outcome.requirements) ? outcome.requirements : [];
  const featRefs = Array.isArray(outcome.features) ? outcome.features : [];
  check(reqRefs.length >= 1, `§4.3 ${outcome.id} → requirement`, 'outcome has no requirement');
  check(featRefs.length >= 1, `§4.3 ${outcome.id} → feature`, 'outcome has no feature');
  check(
    reqRefs.every((id) => requirementIds.has(id) || nfrIds.has(id)),
    `§4.3 ${outcome.id} requirement refs resolve`,
    `unknown requirement ref: ${reqRefs.filter((id) => !requirementIds.has(id) && !nfrIds.has(id)).join(',')}`
  );
  check(
    featRefs.every((id) => featureIds.has(id)),
    `§4.3 ${outcome.id} feature refs resolve`,
    `unknown feature ref: ${featRefs.filter((id) => !featureIds.has(id)).join(',')}`
  );
  for (const field of ['metric', 'target', 'measurement']) {
    check(
      typeof outcome[field] === 'string' && outcome[field].trim().length > 0,
      `§3.3 ${outcome.id} has ${field}`,
      `${field} missing`
    );
  }
}

for (const nfr of nfrs) {
  check(
    typeof nfr.verification === 'string' && nfr.verification.trim().length > 0,
    `§4.2 ${nfr.id} has verification method`,
    'verification missing'
  );
  check(
    typeof nfr.target === 'string' && nfr.target.trim().length > 0,
    `§4.2 ${nfr.id} has target value`,
    'target missing'
  );
}

// ── 3. Status ↔ evidence contract (anti-fabrication) ────────
function checkEvidence(owner, item) {
  const status = item.status;
  const evidence = Array.isArray(item.evidence) ? item.evidence : [];
  check(STATUS.has(status), `${owner} has a legal status`, `bad status: ${String(status)}`);

  if (status === 'implemented' || status === 'partial') {
    check(evidence.length >= 1, `${owner} (${status}) has evidence`, 'evidence list is empty');
  }
  if (status === 'planned') {
    check(
      evidence.length === 0,
      `${owner} (planned) claims no evidence`,
      `planned item must not cite evidence: ${evidence.join(', ')}`
    );
  }
  for (const rel of evidence) {
    check(
      fs.existsSync(path.join(root, rel)),
      `${owner} evidence exists: ${rel}`,
      `path does not exist: ${rel}`
    );
  }
}

for (const feature of features) checkEvidence(`feature ${feature.id}`, feature);
for (const req of requirements) checkEvidence(`requirement ${req.id}`, req);
for (const nfr of nfrs) checkEvidence(`nfr ${nfr.id}`, nfr);
for (const outcome of outcomes) {
  for (const rel of Array.isArray(outcome.instrument) ? outcome.instrument : []) {
    check(
      fs.existsSync(path.join(root, rel)),
      `outcome ${outcome.id} instrument exists: ${rel}`,
      `path does not exist: ${rel}`
    );
  }
}

// ── 4. Skill coverage (junaikey-sovereign vs PRD) ───────────
check(skills.length >= 1, 'skill coverage declared');
for (const skill of skills) {
  const owner = `skill ${skill.skillId}`;
  check(typeof skill.skillId === 'string' && skill.skillId.length > 0, `${owner} has id`);
  check(
    (Array.isArray(skill.evidence) ? skill.evidence : []).length >= 1,
    `${owner} has evidence`,
    'evidence list is empty'
  );
  for (const rel of skill.evidence ?? []) {
    check(fs.existsSync(path.join(root, rel)), `${owner} evidence exists: ${rel}`, `path missing: ${rel}`);
  }
  for (const id of skill.requirements ?? []) {
    check(requirementIds.has(id), `${owner} requirement ${id} exists`, `unknown requirement: ${id}`);
  }
  for (const id of skill.nfr ?? []) {
    check(nfrIds.has(id), `${owner} nfr ${id} exists`, `unknown nfr: ${id}`);
  }
}

// ── 5. PRD ↔ matrix ↔ Markdown three-way sync ──────────────
function readIfExists(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

const prdText = readIfExists(matrix.prd ?? '');
check(prdText !== null, 'PRD document exists', `missing: ${matrix.prd}`);
const mdText = readIfExists(matrix.matrixDoc ?? '');
check(mdText !== null, 'traceability document exists', `missing: ${matrix.matrixDoc}`);

if (prdText !== null) {
  for (const id of allIds) {
    check(prdText.includes(id), `PRD declares ${id}`, `PRD does not mention ${id}`);
  }
}

if (mdText !== null) {
  for (const id of allIds) {
    check(mdText.includes(id), `traceability doc declares ${id}`, `doc does not mention ${id}`);
  }
  const declared = new Set((mdText.match(/\b(?:F|FR|NFR|OR)-\d{2}\b/g) ?? []));
  const orphans = [...declared].filter((id) => !allIds.has(id));
  check(
    orphans.length === 0,
    'traceability doc has no orphan ids',
    `ids in doc but not in matrix: ${orphans.join(', ')}`
  );
}

// ── Report ──────────────────────────────────────────────────
const counts = { implemented: 0, partial: 0, planned: 0, manual: 0 };
for (const item of [...features, ...requirements, ...nfrs]) {
  if (counts[item.status] !== undefined) counts[item.status] += 1;
}
const graded = features.length + requirements.length + nfrs.length;
const done = counts.implemented + counts.partial;
const coverage = graded > 0 ? Math.round((done / graded) * 100) : 0;

console.log(
  `${DIM}  features=${features.length} requirements=${requirements.length} nfr=${nfrs.length} outcomes=${outcomes.length} skills=${skills.length}${RESET}`
);
console.log(
  `${DIM}  implemented=${counts.implemented} partial=${counts.partial} planned=${counts.planned} manual=${counts.manual} → 覆蓋率 ${coverage}%${RESET}`
);

if (failures.length === 0) {
  console.log(
    `${GREEN}  ✓ PRD 終始矩陣 §4.4 閉合檢查通過 (${passes.length} 項) — 需求/功能/成果/驗證 無斷鏈、無虛報證據${RESET}`
  );
  process.exit(0);
}

console.log(`${RED}  ✗ PRD 終始矩陣未通過 (${failures.length} 項失敗 / ${passes.length} 項通過):${RESET}`);
for (const failure of failures) console.log(`${RED}    - ${failure}${RESET}`);
process.exit(1);
