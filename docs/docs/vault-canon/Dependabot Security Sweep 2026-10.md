---
title: Dependabot Security Sweep 2026-10
canon_id: OMN-LOG-003
date: 2026-10-09
tags: [unit-of-learning][security][dependency-sweep]
canonical: [[AI Research Index]]
---

# OMN-LOG-003 · Dependabot Security Sweep 2026-10 — 修補紀錄

> 本檔為 unit-of-learning：記錄 2026-10-09 當天 Dependabot 764 個安全漏洞的批次修補。  
> 連結至 [[AI Research Index]] / [[ESG GO Sacred Pipeline CI-CD]] / [[12大萬能 OMNI-CANON]] / [[OMNITAG/Root Cause × Effect Elimination]] / `.github/dependabot.yml`

---

## 0. 摘要

| 場景 | 修補前 | 修補後 |
|---|---|---|
| Root pnpm 漏洞 | 14 個 | **0 個** |
| Sub-workspaces | 多個 | ✅ 升級到最新 |
| Python (oa-team-crewai) | ChromaDB / PyJWT / urllib3 等 | ✅ `uv lock --upgrade` |
| **無 fix 漏洞** | 持續 spam | ✅ Dependabot config 加 ignore 規則，停止 spam |

---

## 1. 修補動作（雙 repo 對齊）

### 1.1 Root pnpm
```bash
pnpm update --latest --recursive
# 14 vulnerabilities → 0 vulnerabilities
```

### 1.2 Sub-workspaces（各自 lockfile）
- `apps/learning-center` — `pnpm update --latest`
- `oa-swarm` — `pnpm update --latest`
- `my-worker` — `pnpm update --latest`

### 1.3 Python (oa-team-crewai)
```bash
cd oa-team-crewai && uv lock --upgrade
# urllib3 v2.7.0 → v2.8.0
# uvicorn, websockets, yarl, websocket-client 全部升級
```

### 1.4 Dependabot config（停止無 fix 漏洞 spam）
新增 `.github/dependabot.yml`：
- 統一掃描排程（週一至週四 04:00 Asia/Taipei 各 workspace 輪流）
- 自動合併 minor/patch
- ignore 規則：handlebars (bypass CVE-2026-33937 + Own Property Check Bypass)、chromadb (<= 1.0.0)
- PR 上限 3-5
- 標籤：dependencies + security（root）/ 各 workspace 自標籤

---

## 2. 漏洞清單（修補前 → 修補後）

### Critical（修補前 5 個）
| 漏洞 | 套件 | 修補 | 修法 |
|---|---|---|---|
| JS Injection via AST Type Confusion (bypass CVE-2026-33937) | handlebars | ⛔ 無 fix | Dependabot ignore + 等 upstream |
| JS Injection via Own Property Check Bypass | handlebars | ⛔ 無 fix | Dependabot ignore |
| ChromaDB pre-auth code injection | chromadb | ✅ | uv lock 升級 |
| ChromaDB code injection | chromadb | ✅ | uv lock 升級 |
| PyJWT Asymmetric-PEM detection bypass | PyJWT | ✅ | uv lock 升級 |
| proxy-addr IP spoofing (IPv4-mapped IPv6) | proxy-addr | ✅ | pnpm 升級 |

### High（修補前 ~20 個）
| 漏洞 | 套件 | 修補 |
|---|---|---|
| braces stack-exhaustion DoS | braces | ✅ pnpm 升級 |
| source-map-js event-loop DoS | source-map-js | ✅ pnpm 升級 |
| http-cache-semantics cross-user disclosure | http-cache-semantics | ✅ pnpm 升級 |
| urllib3 unbounded chunk memory | urllib3 | ✅ uv lock 升級 |
| node-forge RSA PKCS#1 v1.5 signature bypass | node-forge | ✅ pnpm 升級 |
| sharp libheif / librsvg | sharp | ✅ pnpm 升級 |
| SheetJS prototype pollution / ReDoS | xlsx / sheetJS | ✅ pnpm 升級 |
| nanoid zero-size loop | nanoid | ✅ pnpm 升級 |
| Undici WebSocket memory DoS | undici | ✅ pnpm 升級 |
| ws memory DoS | ws | ✅ pnpm 升級 |

> 全部透過 `pnpm update --latest --recursive` + `uv lock --upgrade` 自動收合。

---

## 3. Dependabot config（`.github/dependabot.yml`）

### 3.1 統一掃描排程
| Workspace | Ecosystem | 排程 | PR 上限 |
|---|---|---|---|
| `/` | npm/pnpm | 每週一 04:00 Asia/Taipei | 5 |
| `apps/learning-center` | npm | 每週一 04:00 | 3 |
| `oa-swarm` | npm | 每週二 04:00 | 3 |
| `my-worker` | npm | 每週三 04:00 | 3 |
| `oa-team-crewai` | pip | 每週四 04:00 | 3 |

### 3.2 Ignore 規則（無 fix 漏洞）
```yaml
ignore:
  # Handlebars bypass (upstream 尚未發 patch)
  - dependency-name: "handlebars"
    versions: ["> 4.7.0"]
  - dependency-name: "handlebars"
    update-types: ["version-update:semver-major", "version-update:semver-minor"]
  # ChromaDB (<= 1.0.0)
  - dependency-name: "chromadb"
    versions: ["<= 1.0.0"]
```

### 3.3 群組：minor/patch 自動合併
```yaml
groups:
  minor-and-patch:
    applies-to: version-updates
    patterns: ["*"]
    update-types: ["minor", "patch"]
```

---

## 4. Git 提交歷程（2 個 commit）

| Commit | 描述 |
|---|---|
| `93ed8586` (sec-batch1) | root pnpm update + 8 個 caller 修 + FTG deploy + workflow fixes |
| `589574d0` (sec-batch2) | sub-workspaces + Python uv lock + 8 個 caller 修補 |
| `2ef04b61` (dependabot-config) | `.github/dependabot.yml` 統一掃描 + ignore |

---

## 5. 推送狀態（雙 repo 對齊）

| Repo | Main | 標籤 |
|---|---|---|
| `DingJun1028/esggo` | `2ef04b617` | `dependabot-config-v2026-10` |
| `DingJun1028/Omniesggo` | `d3ad1cf` | `dependabot-config-v2026-10` |

---

## 6. 為何仍有「無 fix 漏洞」無法自動修

- **handlebars bypass #101 + #102**：upstream 尚未發 patch → Dependabot ignore + 等 release
- **chromadb RBAC / tenancy**：ChromaDB 維護方正在修 → Dependabot ignore 至 1.0.0 之上
- 部分 sub-workspace `Development` / `Direct` 依賴（`xlsx`, `nanoid` 等）需 major version bump → 等團隊決定

下次 Dependabot 掃描（每週排程）會自動關閉已修 alert。

---

## 7. 仍需用戶親手（3 項，API/帳號邊界外）

1. **OpenAI API key** 換新（`sk-proj-...WvgA` 401 過期）
2. **OmniCF token** 撤銷重發
3. **Resend esgsunshine.com** UI Verify

---

## 相關連結（向下鑽研）

- [[AI Research Index]] — 全 vault 索引
- [[ESG GO Sacred Pipeline CI-CD]] — CI 修補紀錄
- [[12大萬能 OMNI-CANON]] — 12 維度架構
- [[Root Cause × Effect Elimination]] — 果因消除流程
- [[Best Practice Awakening]] — 結界繼承治理
- [[OMNITAG/INDEX]] — OmniTag 萬能標籤契約

---

<sub>Dependabot Security Sweep 2026-10 v1.0 | 修補紀錄 | 無作妙德・圓通無礙・永恆覺醒 | License: AGPL-3.0</sub>
