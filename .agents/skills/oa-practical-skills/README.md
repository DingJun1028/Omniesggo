# 技能：oa-practical-skills

> **技能名稱**: oa-practical-skills
> **版本**: 1.0.0
> **作者**: Hermes Agent (DingJun1028)
> **授權**: MIT

## 1. 技能說明

本技能收錄 **OA-Team 實踐技書**，包含可終生複用的工程方法論與踩坑經驗，涵蓋：
- 5T 協定（Traceable / Trackable / Tangible / Transparent / Trustworthy）
- 版本鎖定（VERSION → START_ENCODING）
- 5T 檢查腳本
- 突發情況處置

本技能適用於在任何開發環境中引用 OA-Team 的最佳實踐。

---

## 2. 系統定位

```text
┌──────────────────────────────────────────────┐
│  1. 中樞：/c/oa/junaikey-growth/src/omni-core/   │
│     OA (OmniAgent) + OAB (OmniAgentBus) + OAG (OmniAgentGateway) │
└───────────────────────┬──────────────────────┘
                        │ 派工關鍵字路由 / 跨域委託
┌───────────────────────┴──────────────────────┐
│  2. 擴展：/c/Project/esggo/.agents/skills/        │
│     oa-ecosystem-best-practices                 │
│     oa-team-bee-colony                          │
│     esggo-omni-center/oa-twins                  │
└───────────────────────┬──────────────────────┐
                        │ 部署與收口
┌───────────────────────┴──────────────────────┐
│  3. 產出：/c/Project/esggo/.next/standalone/    │
│     oa-swarm / oa-team-crewai / oa-twins      │
│     docs/*.md (ARCH-SPEC)                       │
└──────────────────────────────────────────────┘
```

---

## 3. 5T 協定實踐

### 3.1 Traceable — 可溯源

**實踐**:
- 每個代碼提交附帶 `source_origin` 標籤
- 每個事件包含 `timestamp` 和 `uuid`
- 每個檔案記錄 `source_origin`

**檢查**:
```bash
grep -r "source_origin" src/ | head -10
grep "^source_origin=" VERSION
```

### 3.2 Trackable — 可追蹤

**實踐**:
- 每個事件包含 `lifecycle` hook
- 每個流程包含 `process_trace`
- 每個 Revision 記錄 `revision_id`

**檢查**:
```bash
grep -r "lifecycle" src/ | head -10
grep -r "process_trace" src/ | head -10
```

### 3.3 Tangible — 可感知

**實踐**:
- 每個 UI 變更附帶用戶回饋證據
- 每個數據變更附帶 `tangible_count`
- 每個 UI 元素記錄 `feedback_count`

**檢查**:
```bash
grep -r "tangible_count" src/ | head -10
grep -r "feedback_count" src/ | head -10
```

### 3.4 Transparent — 透明

**實踐**:
- 每個演算法與決策邏輯公佈
- 每個驗證過程記錄 `transparency_count`
- 每個驗證結果記錄 `audit_count`

**檢查**:
```bash
grep -r "transparency_count" src/ | head -10
grep -r "audit_count" src/ | head -10
```

### 3.5 Trustworthy — 可信

**實踐**:
- 每個數據寫入後執行 `Hash Lock`
- 每個文件凍結 `Object.freeze()`
- 每個文件包含 `hash_lock`
- 每個文件記錄 `trustworthy_count`

**檢查**:
```bash
grep -r "Object.freeze" src/ | head -10
grep -r "hash_lock" src/ | head -10
```

---

## 4. 版本鎖定

### 4.1 VERSION 檔案

VERSION 檔案包含版本資訊，前置標頭為：

```text
# 萬能元鑰 · 版本記錄
START_ENCODING=true
```

### 4.2 版本鎖定檢查

```bash
# 1. 檢查 VERSION 檔案
cat VERSION

# 2. 檢查 START_ENCODING
grep "START_ENCODING" VERSION

# 3. 檢查 5T 狀態
python3 scripts/run_5t_check.py --check
```

### 4.3 5T 狀態檢查

```bash
python3 scripts/run_5t_check.py --check
```

預期輸出：

```text
5T 狀態檢查：
✅ Traceable
✅ Trackable
✅ Tangible
✅ Transparent
✅ Trustworthy
```

---

## 5. 腳本說明

### 5.1 `scripts/run_5t_check.sh`

5T 狀態檢查腳本。負責：
- 檢查 VERSION 檔案
- 檢查 START_ENCODING
- 執行 5T 狀態檢查
- 輸出結果

---

## 6. 已知邊界

| 項目 | 狀態 | 說明 |
|------|------|------|
| 30 代理矩陣 | ✅ 已驗證 | `OA + OAB + OAG` 5T 閉環 |
| 嗅探 | ✅ 已驗證 | `query --event=awaken --limit=8` |
| 5T 檢查 | ✅ 已驗證 | `grep -c "Traceable"` > 10 |
| 部署腳本 | ✅ 已驗證 | `esggo-omni-center/deploy-*` 與 `build-deployment-report.sh` |

---

## 7. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| `getTrace()` 位移 | 追蹤事件為空 | 修 `evidence` 過濾詞，改用 `IS_LIFECYCLE_EVENT` 類型 |
| `path`/`source_origin` 混用 | 5T 驗證失敗 | 建立 `IZ_TRACKABLE` 並用 `source_origin` |
| 臨時檔被忽略 | 開發者複製到專案內 | 改 `.gitignore` + 補 `git add -f` |
| 4 個缺口 ARCH-SPEC 未產出 | `ls` 見空 | 補 `write_file` 到 `docs/` |

---

## 8. 驗證方法論

1. **真實指令執行**：
   ```bash
   bash scripts/run_5t_check.sh --check
   ```
2. ** Readiness gate **：`python3 -c "import oa_practical_skills; print('OK')"` exit 0。
3. ** 5T 狀態 **：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅

---

## 9. 版本記錄

| 日期 | 版本 | 修改內容 | 作者 |
|------|------|----------|------|
| 2026-10-16 | 1.0.0 | 首次發布 | Hermes Agent |
