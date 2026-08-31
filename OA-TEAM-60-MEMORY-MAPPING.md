# OA-Team 60 代理 ↔ MemoryHub 資產對應總表（雙蜂隊 + 暗光 30/30）
#
# 暗系蜂王 01-30（umbra）| 光系蜂后 31-60（lumen）
# 每代理固定：
#   - 編號 01-60
#   - 陣列（智庫聖所 / 符文契約 / 暗翼 or 光翼 / 煉金熵減 / 5T 驗算）
#   - MemoryAssetKind + visibility（對齊 tencent-mem.ts）
#   - alignment: umbra（暗系）| lumen（光系）
#   - archetype: 本代理的暗/光屬性標籤
#
# 五陣列：
#   01-06  智庫聖所
#   07-12  符文契約
#   13-18  蜂王隊=暗翼 | 31-60 蜂后隊=光翼
#   19-24  煉金熵減
#   25-30  5T 驗算

## 屬性定義

| 屬性 | 代號 | 核心質性 | 代表色 | 編號 |
|------|------|----------|--------|------|
| 暗系 (Umbra) | `umbra` | 潛行·觀察·隱蔽·滲透 | 水色青 #00FFFF | 01-30 |
| 光系 (Lumen) | `lumen` | 啟示·創造·淨化·揭露 | 永恆金 #FFD700 | 31-60 |

## 五陣列總表

| 陣列 | 職能 | 資產類別 | visibility | 屬性 |
|------|------|----------|------------|------|
| 智庫聖所 | 長短期記憶召回、向量知識沉澆、脈絡提純 | chat_memory + wiki | team | umbra 01-06 / lumen 31-36 |
| 符文契約 | API 鑄造、雙向 TS、ZKP 隱私 | skill + wiki | restricted | umbra 07-12 / lumen 37-42 |
| 暗翼（蜂王）| 背景 Task、ADK 調度、Bento 渲染、Live 轉播 | skill + wiki | team | umbra 13-18 |
| 光翼（蜂后）| 背景 Task、ADK 調度、Bento 渲染、Live 轉播 | skill + wiki | team | lumen 43-48 |
| 煉金熵減 | 重構、效能監控、CI/CD Pipeline | codegraph + skill | agent | umbra 19-24 / lumen 49-54 |
| 5T 驗算 | ISO 規範、Hash 鎖定、UUID 發放 | wiki + codegraph | restricted | umbra 25-30 / lumen 55-60 |

---

## 蜂王 OA-LOCAL (01-30) — 暗系蜂王（umbra）

> 暗系蜂王：以水色青 #00FFFF 為印記，主導本地 Windows 開發端的隱形治理。
> 全 30 代理统一 umbra，MemoryHub 路由 /api/assets?tag=umbra。

### 智庫聖所 (01-06)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 01 | 萬能蜂后 | umbra | Sovereign | wiki | restricted | 戰略記憶庫（5T 公約落庫） |
| 02 | 萬能規劃蜂 | umbra | Architect | chat_memory | team | 長短期規劃脈絡 |
| 03 | 萬能分析蜂 | umbra | Oracle | chat_memory | team | 數據洞察會話 |
| 04 | 萬能策効蜂 | umbra | Muse | wiki | team | 方案資產沉澆 |
| 05 | 萬能風險蜂 | umbra | Sentinel | chat_memory | team | 風險事件會話 |
| 06 | 萬能優化蜂 | umbra | Alchemist | codegraph | agent | 流程熵減追蹤 |

### 符文契約 (07-12)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 07 | 萬能編碼蜂 | umbra | Smith | skill | restricted | API 鑄造技能 |
| 08 | 萬能算法蜂 | umbra | Depth | skill | restricted | LLM/ML pipeline 技能 |
| 09 | 萬能架構蜂 | umbra | Architect | wiki | restricted | 系統設計資產 |
| 10 | 萬能數據蜂 | umbra | Weaver | codegraph | agent | 資料庫 schema/pipe 圖譜 |
| 11 | 萬能測試蜂 | umbra | Seer | skill | agent | 自動化測試步驟 |
| 12 | 萬能設計蜂 | umbra | Shaper | wiki | team | UI/UX 設計規範 |

### 暗翼 (13-18)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 13 | 萬能圖像蜂 | umbra | Painter | skill | team | 品牌視覺生成技能 |
| 14 | 萬能動畫蜂 | umbra | Flow | skill | team | 動態特效/字幕技能 |
| 15 | 萬能文案蜂 | umbra | Narrator | wiki | team | 腳本 DNA 模板 |
| 16 | 萬能音頻蜂 | umbra | Resonator | skill | team | TTS/語音合成技能 |
| 17 | 萬能市場蜂 | umbra | Herald | wiki | team | 行銷策略資產 |
| 18 | 萬能社群蜂 | umbra | Bridger | chat_memory | team | 社群互動脈絡 |

### 煉金熵減 (19-24)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 19 | 萬能增長蜂 | umbra | Erode | codegraph | agent | 增長指標監控圖譜 |
| 20 | 萬能運營蜂 | umbra | Nexus | codegraph | agent | 專案流程圖譜 |
| 21 | 萬能商業分析蜂 | umbra | Skinner | chat_memory | team | 商業洞察會話 |
| 22 | 萬能探路蜂 | umbra | Scout | wiki | team | 資源探索筆記 |
| 23 | 萬能外交蜂 | umbra | Wraith | wiki | restricted | 合作協議資產 |
| 24 | 萬能調研蜂 | umbra | Lens | chat_memory | team | 用戶調研會話 |

### 5T 驗算 (25-30)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 25 | 萬能測場蜂 | umbra | Purifier | chat_memory | team | 現場回饋會話 |
| 26 | 萬能追蹤蜂 | umbra | Hawk | codegraph | agent | 競品監控追蹤圖譜 |
| 27 | 萬能安全蜂 | umbra | Ward | wiki | restricted | 資安規範資產 |
| 28 | 萬能維護蜂 | umbra | Curator | skill | agent | 維運腳本/步驟 |
| 29 | 萬能支援蜂 | umbra | Echo | skill | agent | 技術支援 SOP |
| 30 | 萬能質控蜂 | umbra | Seal | wiki | restricted | 品質標準/驗證規則 |

---

## 蜂后 OA-VPS (31-60) — 光系蜂后（lumen）

> 光系蜂后：以永恆金 #FFD700 為印記，主導 VPS 生產端的啟示與創造。
> 全 30 代理统一 lumen，MemoryHub 路由 /api/assets?tag=lumen。

### 智庫聖所 (31-36)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 31 | 蜂后萬能蜂后 | lumen | Sovereign | wiki | restricted | VPS 戰略記憶庫 |
| 32 | 蜂后萬能規劃蜂 | lumen | Architect | chat_memory | team | VPS 長程規劃脈絡 |
| 33 | 蜂后萬能分析蜂 | lumen | Oracle | chat_memory | team | VPS 數據洞察會話 |
| 34 | 蜂后萬能策効蜂 | lumen | Muse | wiki | team | VPS 方案資產 |
| 35 | 蜂后萬能風險蜂 | lumen | Sentinel | chat_memory | team | VPS 風險事件會話 |
| 36 | 蜂后萬能優化蜂 | lumen | Alchemist | codegraph | agent | VPS 熵減追蹤 |

### 符文契約 (37-42)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 37 | 蜂后萬能編碼蜂 | lumen | Smith | skill | restricted | VPS API 鑄造技能 |
| 38 | 蜂后萬能算法蜂 | lumen | Depth | skill | restricted | VPS LLM pipeline 技能 |
| 39 | 蜂后萬能架構蜂 | lumen | Architect | wiki | restricted | VPS 系統設計資產 |
| 40 | 蜂后萬能數據蜂 | lumen | Weaver | codegraph | agent | VPS DB/pipe 圖譜 |
| 41 | 蜂后萬能測試蜂 | lumen | Seer | skill | agent | VPS 自動化測試步驟 |
| 42 | 蜂后萬能設計蜂 | lumen | Shaper | wiki | team | VPS UI 設計規範 |

### 光翼 (43-48)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 43 | 蜂后萬能圖像蜂 | lumen | Painter | skill | team | VPS 視覺生成技能 |
| 44 | 蜂后萬能動畫蜂 | lumen | Flow | skill | team | VPS 動態特效技能 |
| 45 | 蜂后萬能文案蜂 | lumen | Narrator | wiki | team | VPS 文案模板 |
| 46 | 蜂后萬能音頻蜂 | lumen | Resonator | skill | team | VPS TTS 技能 |
| 47 | 蜂后萬能市場蜂 | lumen | Herald | wiki | team | VPS 行銷資產 |
| 48 | 蜂后萬能社群蜂 | lumen | Bridger | chat_memory | team | VPS 社群脈絡 |

### 煉金熵減 (49-54)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 49 | 蜂后萬能增長蜂 | lumen | Erode | codegraph | agent | VPS 增長監控圖譜 |
| 50 | 蜂后萬能運營蜂 | lumen | Nexus | codegraph | agent | VPS 運營流程圖譜 |
| 51 | 蜂后萬能商業分析蜂 | lumen | Skinner | chat_memory | team | VPS 商業洞察會話 |
| 52 | 蜂后萬能探路蜂 | lumen | Scout | wiki | team | VPS 探索筆記 |
| 53 | 蜂后萬能外交蜂 | lumen | Wraith | wiki | restricted | VPS 合作協議資產 |
| 54 | 蜂后萬能調研蜂 | lumen | Lens | chat_memory | team | VPS 用戶調研會話 |

### 5T 驗算 (55-60)

| 編號 | 代理 | alignment | archetype | 資產類別 | visibility | 說明 |
|------|------|-----------|-----------|----------|------------|------|
| 55 | 蜂后萬能測場蜂 | lumen | Purifier | chat_memory | team | VPS 現場回饋會話 |
| 56 | 蜂后萬能追蹤蜂 | lumen | Hawk | codegraph | agent | VPS 競品追蹤圖譜 |
| 57 | 蜂后萬能安全蜂 | lumen | Ward | wiki | restricted | VPS 資安規範資產 |
| 58 | 蜂后萬能維護蜂 | lumen | Curator | skill | agent | VPS 維運 SOP |
| 59 | 蜂后萬能支援蜂 | lumen | Echo | skill | agent | VPS 技術支援步驟 |
| 60 | 蜂后萬能質控蜂 | lumen | Seal | wiki | restricted | VPS 品質標準資產 |

---

## 雙屬性路由規則

1. **資產路由分區**：
   - `alignment=umbra`（01-30）→ 寫入 MemoryHub 的 `/api/assets?tag=umbra`
   - `alignment=lumen`（31-60）→ 寫入 MemoryHub 的 `/api/assets?tag=lumen`
2. **visibility 繼承主屬性**：
   - umbra 代理預設 `agent` 或 `restricted`（限制擴散）
   - lumen 代理預設 `team` 或 `restricted`（開放共享）
3. **雙蜂隊共用同一 core**：`serviceId=oa-team-swarm`，但 `ownerAgent` 區分 01-30 / 31-60
4. **暗光共鳴**：同 `session_key` 內，umbra 寫入的 codegraph 可被 lumen 代理召回用於 wiki 沉澆

## 使用方式

1. 依編號查上表取得代理的 `alignment` + `archetype` + `MemoryAssetKind`
2. 呼叫 `tencent-mem.ts` 的 `saveAsset({ kind, title, content, visibility, ownerAgent, team, alignment, archetype })`
3. 雙蜂隊共用 `memory.esggo.co/gateway/` 共享長期記憶
