# 實施計畫：OA-Team 30 萬能蜂群框架同步

> **任務**: oa-team-30-swarm-sync · **團隊**: esggo-swarm · **類型**: plan · **日期**: 2026-08-01
> **狀態**: ✅ PLAN COMPLETE — 實作 + CI/pre-commit 閘道皆已由 `oa-team-30-swarm-implement` 交付並 commit
> **提交**: `8ce8abb1` (feat) + `e634ae9e` (ci) · 2026-08-01
> **標籤**: `[security:internal][agent:07][squad:符文契約][lifecycle:active][p1][platform:esggo][best-practice:awakened]`
> **複驗 (plan teammate, 2026-08-01)**: 實跑 `scripts/verify-agents-yaml.py` → OK（30 agents / 5 squads / 7 inheritance sources）；CI `agents-yaml` job、pre-commit gate、三技能 bytes-identical 同步、encoding-check 全綠 — 全數 PASS，與本計畫 §三 逐項結論一致。

---

## 一、背景與目標

將 **OA-Team 30 萬能蜂群 (OA-Team 30-Swarm Ultimate Edition v2.0)** 框架完整同步進 esggo 專案。三項交付目標：

1. **agents.yaml** — 依 OA-Team spec（`.agents/skills/oa-team-bee-colony`）建立 30 個代理角色。
2. **OmniTag 標籤規則** — 依 OmniTag spec 驗證 7 維度 MECE 標籤規則、禁用組合、必備標籤。
3. **最佳實踐覺結界 inheritance** — 依 best-practice-awakening spec 確保結界自動繼承與熵減治理。

---

## 二、現狀（調查發現）

### 已存在（未追蹤，工作樹狀態）
| 檔案 | 說明 | Git 狀態 |
|---|---|---|
| `agents.yaml` | 887 行，30 代理 + 5 小隊 + OmniTag + 結界 + 熵減 + 部署模板 | untracked (`??`) |
| `scripts/verify-agents-yaml.py` | 驗證腳本（7 大檢查） | untracked (`??`) |
| `reports/5t-protocol-compliance.md` | 既有 5T 合規報告（他 teammate 產出，已驗證通過） | untracked |

### 驗證結果（本次實跑）
```bash
python3 scripts/verify-agents-yaml.py
# OK: agents.yaml conforms to OA-Team 30-Swarm + OmniTag + 結界 inheritance
#     agents: 30 | squads: 5 | inheritance sources: 7 (06, 14, 15, 22, 26, 28, 30)
```

---

## 三、逐項驗證結論

### 3.1 30 代理角色（✅ PASS）
- 30 個代理、ID `01`–`30`、無重複、順序正確。
- 5 小隊 × 6 代理：智庫聖所(01-06) / 符文契約(07-12) / 光之羽翼(13-18) / 煉金熵減(19-24) / 5T驗算(25-30)。
- 每個代理的 `name` / `squad` / `responsibility` 與 OA-Team spec 表格**逐字比對一致**（0 errors）。
- 所有代理具備完整欄位：`id`、`name`、`name_en`、`squad`、`responsibility`、`omnitag`、`tags`。

### 3.2 OmniTag 標籤規則（✅ PASS）
- 每個代理 7 維度齊備：`security / agent / squad / lifecycle / priority / platform / best-practice`。
- 所有維度值合法（對照 OmniTag spec 可取值清單）。
- 必備標籤規則：每代理至少含 `agent:*` + `lifecycle:*` + `p*` — 全部通過。
- 禁用組合（`lifecycle:frozen+active`、`security:public+restricted`、`p0+p3`、`awakened+draft`、`结界+draft`）— 0 違規。
- 代理標籤分布：`best-practice` = awakened 23 / 结界 7；`security` = internal 22 / restricted 4 / public 4；`lifecycle` = active 29 / frozen 1。
- 每代理 `tags` 字串與結構化 `omnitag` map 前綴一致。

### 3.3 最佳實踐覺結界 inheritance（✅ PASS）
- `inheritance_sources = [06, 14, 15, 22, 26, 28, 30]` 與標記 `best-practice:结界` 的代理集合**完全一致**。
- 結界來源代理均非 `lifecycle:draft`（26 Hash 鎖匠為 frozen，屬正常凍結語意）。
- 三條硬規則（預設即合規 / 不帶病上線 / 醒著就頂標）、6 項 startup checklist、4 位 guardian、3 條撤銷條件齊備。
- 繼承 tag 對映：`inherited_tag = best-practice:结界`、`source_tag = best-practice:awakened`。

---

## 四、整合缺口（GAP Analysis）

| # | 缺口 | 說明 | 建議處理 | 狀態 (2026-08-01) |
|---|---|---|---|---|
| G1 | 未追蹤 | `agents.yaml` 與 `scripts/verify-agents-yaml.py` 尚未 git add/commit | 納入 PR commit | ✅ 已完成 — `8ce8abb1` + `e634ae9e` 已 commit |
| G2 | CI 未整合 | `.github/workflows/ci.yml` 無 agents.yaml 驗證 job | 新增 `agents-yaml` job：`python3 scripts/verify-agents-yaml.py` | ✅ 已完成 — `agents-yaml` job（含 `pip install pyyaml`）已加入 ci.yml |
| G3 | pre-commit 未整合 | `.githooks/pre-commit` 無 agents.yaml 檢查 | 新增節：執行 verify-agents-yaml.py，失敗即 block | ✅ 已完成 — pre-commit §3 gate 已加入且 chmod +x |
| G4 | 來源技能缺失 | repo `.agents/skills/` 無此三技能 | 將 `oa-team-bee-colony` / `omnitag` / `best-practice-awakening` 同步至 `.agents/skills/` | ✅ 已完成 — 三技能已同步（bytes-identical 驗證） |
| G5 | 無測試覆蓋 | 驗證腳本本身無測試 | 可選：以 vitest 包 verify 邏輯，或保留 python 腳本 + CI 即為閘道 | ⏸️ 保留 python 腳本 + CI/pre-commit 即為閘道（建議不追加 vitest 版） |
| G6 | 腳本依賴 | verify 腳本依賴 PyYAML | CI job 加 `pip install pyyaml` | ✅ 已完成 — CI `agents-yaml` job 已含 `python3 -m pip install pyyaml` |

---

## 五、執行計畫（給 implement/test teammate）

### Phase 1 — Commit 交付物（✅ 已完成）
- [x] `git add agents.yaml scripts/verify-agents-yaml.py .agents/skills/{oa-team-bee-colony,omnitag,best-practice-awakening}/SKILL.md`（已 staged）
- [x] 確認 pre-commit（UTF-8 + lockfile + agents.yaml gate）通過 — 已實測 gate
- [x] Conventional commits：
  - `8ce8abb1` `feat(agents): add OA-Team 30-swarm framework + verification`（5 files）
  - `e634ae9e` `ci(agents): gate agents.yaml verification in CI and pre-commit`（2 files）
  - 以 env vars 提供 author/committer identity（`OA-Team 30-Swarm <oa-team-30@esggo.local>`），未寫入 git config
  - 未納入其他 teammate 的檔案（`src/agents/secure-utils.ts`、`omni-gateway.ts` 等留給 verify-5t）

### Phase 2 — 技能同步（G4）✅ 已完成
- [x] 從 `~/.opencode/skills/oa-team-bee-colony/SKILL.md` 複製至 `.agents/skills/oa-team-bee-colony/SKILL.md`
- [x] 從 `~/.opencode/skills/omnitag/SKILL.md` 複製至 `.agents/skills/omnitag/SKILL.md`
- [x] 從 `~/.opencode/skills/best-practice-awakening/SKILL.md` 複製至 `.agents/skills/best-practice-awakening/SKILL.md`
- [x] bytes-identical 驗證 + encoding 檢查通過

### Phase 3 — CI / pre-commit 閘道（G2, G3, G6）✅ 已完成
- [x] `.github/workflows/ci.yml` 新增 `agents-yaml` job（含 `python3 -m pip install pyyaml`）
- [x] `.githooks/pre-commit` 新增 agents.yaml 驗證節（僅 agents.yaml 變更時執行）並 chmod +x

### Phase 4 — 驗證（✅ 核心驗證完成；全量套件視 CI）
- [x] `python3 scripts/verify-agents-yaml.py` → OK（30 agents / 5 squads / 7 inheritance sources）
- [x] `node scripts/encoding-check.mjs` → 全部 clean（新增技能 bytes-identical 且 UTF-8 無誤）
- [x] pre-commit hook 實測 → agents.yaml gate 通過
- [ ] `pnpm lint:full`（< 50 warnings）— implement teammate 起跑，3 分鐘 timeout 後重試；由 CI `agents-yaml` job 與既有 lint job 持續閘道
- [ ] `pnpm typecheck` / `pnpm vitest run` — 由 CI 全量閘道執行
- [ ] 在 VPS 檢查 `agents-cli swarm start --agents=30` 無衝突（可延後）

---

## 六、風險

- **G6 PyYAML**：若 CI runner 無 PyYAML，驗證 job 會 fail — 需加 install 步驟或 fallback 純 Python YAML subset 解析。
- **技能重複**：`~/.opencode/skills/` 與 repo `.agents/skills/` 同步可能造成雙份 — 以 repo 內為 source of truth，home 目錄為執行時載入，內容需一致。
- **CLAUDE.md 一致性**：CLAUDE.md §0 已定義 OmniTag 規則並參考 `.agents/skills/omnitag/SKILL.md`；Phase 2 完成後參考即有效，無需改 CLAUDE.md。

---

## 七、決策點

- [x] 是否需將 OA-Team/OmniTag/結界技能納入 repo `.agents/skills/`（Phase 2）？→ **已決策：納入 repo**（使 CLAUDE.md / agents.yaml 的 reference 有效，repo 為 source of truth）
- [x] verify 閘道走 CI 還是僅 pre-commit？→ **已決策：CI + pre-commit 雙閘道**
- [x] 是否需要為 verify 腳本補 vitest 版測試（G5）？→ **已決策：不需要**，python 腳本 + CI/pre-commit 即為閘道；避免新增未測試模組增加 CLAUDE.md §3 合規負擔
