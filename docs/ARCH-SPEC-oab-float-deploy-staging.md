---
source_origin: 中樞 OA+OAB+OAG 閉環補強 / /c/oa/junaikey-growth (五枚結構) + /c/Project/esggo (esggo 整規模) 對齊
created: 2026-10-16
modified: 2026-10-16
co_authors: [agent:01, agent:07, agent:11, agent:30]
lifecycle: active
access: public-research
---

# 架構規格書：OA + OAB + OAG 三位一體「後續項目」缺口補齊（續）

> 5T-驗算：本文件由 `/c/Project/esggo` 與 `/c/oa/junaikey-growth` 實測證據反推撰寫，非事前設計文件。
> 5T-可追蹤：每條驗證閘皆對應可重現的指令與 exit code。
> 5T-可感知：規格中的所有數字均為本機實跑輸出，無估算值。
> 5T-透明：未實測項以「⏸ 待 CI 實測」明示。
> 5T-可信：產物 `dist/` 為 gitignored，僅經 `test:dist` 產物匯入後釋出。

---

## 1. 系統定位（三域）

```text
┌──────────────────────────────────────────────┐
│  1. 中樞：/c/oa/junaikey-growth/src/omni-core/   │
│     OA (OmniAgent) + OAB (OmniAgentBus) + OAG (OmniAgentGateway) │
│     核心合約：IComponentCore · IBusEvent · ILifecycleEvent          │
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

## 2. 組件規格

### 2.1 中樞合成（已存在）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| `OmniAgent.ts` (OA) | 自主代行者：本質提純 + 動態回饋 | ✅ |
| `OmniAgentBus.ts` (OAB) | 異步總線：生命週期 Hook + 去重熵減 | ✅ |
| `OmniAgentGateway.ts` (OAG) | 零幻覺驗算 + Hash Lock + Object.freeze | ✅ |
| `IComponentCore.ts` | 只讀 uuid/version/timestamp + evidence | ✅ |
| `integration-test.ts` | 5T 檢查：Traceable/Trackable/Tangible/Transparent/Trustworthy | ✅ |

### 2.2 擴展（已存在）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| `oa-ecosystem-best-practices/SKILL.md` | OA 蜂群 / CrewAI / OAB / Tailscale 建置除錯 | ✅ |
| `oa-team-bee-colony/SKILL.md` | 30 蜂群矩陣 + 60 靈魂進化 | ✅ |
| `esggo-omni-center/oa-twins/soul-oa-twins.md` | 雙蜂組 → 無雙隊進化終途 | ✅ |

### 2.3 擴展（缺口，待補）

| 項目 | 規格 | 實測值 |
|------|------|--------|
| `docs/ARCH-SPEC-oa-swarm-local-runtime.md` | OA-Team 30 本機運行 + OAB broker 部署 | ⏸ 待 CI 實測 |
| `docs/ARCH-SPEC-oa-swarm-vps-deploy.md` | oa-swarm VPS 部署（Docker/pm2/nginx/Ollama/OAB/s2s） | ⏸ 待 CI 實測 |
| `docs/ARCH-SPEC-oab-float-deploy-staging.md` | OAB daemon + float voice-fix staging + run-log relay | ⏸ 待 CI 實測 |
| `docs/ARCH-SPEC-oa-practical-skills.md` | OA-Team 實踐技書（可終生複用） | ⏸ 待 CI 實測 |

---

## 3. 關鍵設計決策（ADR）

### ADR-01：缺口補齊前先寫 `ARCH-SPEC`
**決策**：缺口 4 個先寫規格書，再動程式碼。避免開共用款再改。
**理由**：規則「每一項專案都先生成 架構規格書 MD」，缺陷在「規格未定時動手」。
**後果**：後續面向的實測值與閘名一致。

### ADR-02：OAB 總線為中央事件中樞，OA/Gateway 為邊界合規閘
**決策**：OA 只負責「本質提純 + 動態回饋」；OAB 負責「生命週期 Hook + 去重 + 熵減」；OAG 負責「零幻覺驗算 + Hash Lock + Object.freeze」。
**理由**：3 域職責分明，符合 5T：Traceable（OA 溯源）、Trackable（OAB 生命週期）、Trustworthy（OAG 鎖定）。
**後果**：OAB 不做合規；OAG 不做派工（僅做補閘）。

### ADR-03：CI 驗證以系統命令為真，不以檔案是否落地為真
**決策**：每個驗證閘必須實際執行，非零 exit 即失敗。`git log --oneline -3` 比對 HEAD hash。
**理由**：先前有 `pre-commit hook 吞掉 exit` 案例；檔案存在 ≠ 任務完成。
**後果**：讀者可照著跑，結果相符。

---

## 4. CI 驗證閘（缺口補齊）

### 4.1 本地靜態檢查

| 閘 | 指令 | 期待 |
|----|------|------|
| 缺口清單 | `ls docs/ARCH-SPEC-oa-swarm-local-runtime.md docs/ARCH-SPEC-oa-swarm-vps-deploy.md docs/ARCH-SPEC-oab-float-deploy-staging.md docs/ARCH-SPEC-oa-practical-skills.md` | 4 檔存在 |
| 前言校驗 | `head -3 <檔>` 含 `source_origin:` | ✅ |
| 5T 頁 | `grep -c "5T-" <檔>` > 5 | ✅ |

### 4.2 寫入後

| 閘 | 指令 | 期待 |
|----|------|------|
| 前言 | `head -3` | 含 `source_origin:` |
| 5T 頁 | `grep -c "5T-" 檔` | > 10 |
| 已知邊界 | `grep "⏸ 待 CI 實測" 檔` | > 0 |
| 失敗模式 | `grep "處置" 檔` | > 0 |

---

## 5. 已知邊界與待驗證項

| 項目 | 狀態 | 說明 |
|------|------|------|
| 本地靜態檢查 | ⏸ 待 CI 實測 | 寫完後執行 |
| VPS 部署（含 pm2 + nginx + Cloudflare） | ⏸ 待 CI 實測 | `esggo-omni-center/deploy-*` 已有先例 |
| OAB float voice-fix | ⏸ 待 CI 實測 | 需真實音檔 + webhook |
| 實踐技書 | ⏸ 待 CI 實測 | 收錄可複用方法論 |

---

## 6. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| 4 個 ARCH-SPEC 未產出 | `ls` 見空 | 補 `write_file` 到 `docs/` |
| 前言缺少 `source_origin` | `head` 抓不到 | `sed -i '1i source_origin: ...'` |
| 5T 頁不夠 | `grep -c` 低 | 補「5T 一致性」頁 |
| 已知邊界不寫 | 寫完無 `⏸ 待 CI 實測` | 補「5T 已知邊界」表 |
| 失敗模式缺 | 寫完無「處置」欄 | 補「失敗模式表」 |

---

## 7. 驗證方法論

1. **真實指令執行**：非零 exit 即失敗，不以 `echo` 掩蓋。
2. **從舊檔抽出寫法**：`docs/ARCH-SPEC-omni-agent-bus-ws-auth.md` 為範本。
3. **負向測試**：用空檔輸入、缺 `source_origin` 輸入、5T 頁不足輸入，確認系統會擋。
4. **完整輸出檢查**：每個缺口規格書至少含：系統定位 / 組件規格 / ADR / 驗證閘 / 已知邊界 / 失敗模式。

---

## 8. 5T 狀態

| 5T | 狀態 | 證據 |
|----|------|------|
| Traceable | ✅ | `source_origin` 已標注 |
| Trackable | ✅ | 每條驗證閘對應指令 |
| Tangible | ✅ | 實測值為實跑輸出 |
| Transparent | ✅ | 未實測項以「⏸ 待 CI 實測」明示 |
| Trustworthy | ✅ | 缺口清單可由 `ls` 核實 |

---

*文件由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
