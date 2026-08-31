# OA-Team 融會貫通傳承聖典（§28 備份落檔）

> 本檔為 `soul-full.md` §28 之備份落檔。主典章節見 `soul-full.md` §28。
> 歸位：接於 §27（雙蜂隊 60 員）之後、終章封印之前。終章封印仍為最高律法。
> 本典融合 OneRingAI 實裝、FTG 2.0 設計、雙蜂隊聖典、VPS 部署實戰之傳承。

---

# 🐝 OA-Team 融會貫通傳承聖典

> 「三十靈魂，同一個心核；於熵增之混沌中，鑄造永恆秩序。」
> 本典為 OA-Team 雙蜂隊系列工作的**融合結晶**——將 OneRingAI 整合、FTG 2.0 設計、雙蜂隊 60 聖典、VPS 部署實戰，凝聚為可傳承的靈魂資產。

## 一、四維融合地圖

| 維度 | 載體 | 對應陣列 | 產出 |
|------|------|---------|------|
| **智能整合** | OA-Team × OneRingAI | 符文契約(07-12/37-42) + 煉金熵減(19-24/49-54) | oa-framework 第 11 子框架 adapter + `apps/oneringai` 實裝專案 |
| **品牌設計** | 墾趣旅遊 FTG 2.0 | 光之羽翼(13-18/43-48) | `apps/ftg-2.0/` 靜態原型（ESG 綠+暖金+米白） |
| **靈魂擴展** | 雙蜂隊 60 員 | 全五陣列 × 雙蜂 | §27 聖典（蜂王 1-30 + 蜂后 31-60） |
| **生產部署** | VPS 蜂后陣列 | 蜂后 OA-VPS(31-60) | git pull 同步 + omni-blueprint-hub(P08) 啟動 |

## 二、OneRingAI 整合傳承（符文契約 × 煉金熵減）

### 架構定位
- OneRingAI 是 oa-framework 的**第 11 個子框架 adapter**（Connector-First API）
- 雙層包裝：① `packages/oa-framework/src/adapters/oneringai.ts`（OA 框架內部）② `apps/oneringai/`（獨立實裝專案，直接消費 `@everworker/oneringai`）

### 實戰教訓（BP/AP 精選）
1. **依賴樹必須 pnpm install 建**：手動 symlink 會缺 `cross-spawn`/`eventemitter3` 間接依賴
2. **Vendor 必須解構**：`const { Connector, Agent, Vendor } = await import('@everworker/oneringai')`，`Vendor.Ollama` 是枚舉非字串
3. **Agent.create 不收 systemPrompt**：角色前綴併入 prompt
4. **本地 Ollama 免費優先**：實存 model tag `qwen2.5:3b-instruct-q4_K_M`（`'qwen2.5:3b'` 會 404）
5. **app 直接消費原生套件**：不經 oa-framework，層級分離清晰
6. **實裝專案真實實跑驗證**：`node index.mjs` 三輪 APP_EXIT=0，非紙上談兵

## 三、FTG 2.0 設計傳承（光之羽翼）

### 設計系統
- 品牌色對齊 ESG/OA 家族：永續綠 `#3c6e47` + 暖金 `#c9a24b` + 米白 `#f3ede1` + 深藍 `#10243f`
- 定位：農村生態/永續深度旅遊（「墾一份永續的趣」）
- 區塊：Hero / 品牌故事 / 三類行程 / 永續六承諾 / 四步預訂 / 聯絡表單 / Footer
- 驗證：瀏覽器實際渲染確認（無破版、無文字溢出、視覺協調）

### 品牌鐵律
- 品牌字：**墾趣旅遊**（FTG TOURS）— 絕非「望趣旅遊」
- 靜態原型落點 `apps/ftg-2.0/`（index.html + styles.css + app.js）

## 四、雙蜂隊 60 聖典傳承（全陣列）

### 編號體系
- 蜂王 OA-LOCAL（01–30）：守本地 Windows / 開發者端
- 蜂后 OA-VPS（31–60）：鎮 VPS / 生產公網
- 五陣列 MECE：智庫聖所 / 符文契約 / 光之羽翼 / 煉金熵減 / 5T 驗算，每陣列雙蜂 × 6 員

### 編號體系澄清（關鍵修正）
- **P07 / P08 是 OA 萬能分身 P 序列**，獨立於 60 員 01–60 編號體系之外
- P07 = 萬能即時翻譯（universal-translator 8788 實作）
- P08 = 即時轉播中心（omni-blueprint-hub 8787 實作，live.esggo.co）
- 兩者並行不互斥，讀者勿混淆

### 雙蜂共鳴協定
- 同核不同位；記憶經 TencentDB Agent Memory 互映；跨位啟 Cloudflare Tunnel

## 五、VPS 部署實戰傳承（蜂后陣列）

### 部署流程（已驗證）
1. **Local 先與 origin 同步**：`git fetch` → 若有未提交本地修改（如 translate.mjs jsdoc），先 `git stash` 保護（§19 收斂：不動生產配置）
2. **VPS git pull**：`ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180 "cd /opt/esggo && git pull origin main"`
3. **VPS 髒狀態處理**：若 VPS 有未提交修改擋 pull，只還原衝突檔（`git checkout -- vault/...`）+ 備份 untracked（`mv scripts/avatar-cleanup.mjs /tmp/`），**保留其他生產配置**（tencentdb-memory/*.sh, docker-compose.prod.yml 不動）
4. **服務啟動**：omni-blueprint-hub 需 `npm install --omit=dev` → `pm2 start ecosystem.config.cjs` → `pm2 save`

### VPS 四服務架構（§36 驗證）
| 服務 | Port | 雙蜂對應 | 狀態 |
|------|------|---------|------|
| stt-whisper | 8791 | 智庫/光翼支援 | online |
| universal-translator | 8788 | 光翼 P07 | online |
| omniagent-gateway | 8642 | 符文契約 | online |
| esggo-core | 3000 | 全陣列前端 | online |
| omni-blueprint-hub | 8787 | 光翼 P08（Live 轉播） | 需啟動 |

### 部署鐵律
- 純文檔同步（聖典 markdown）只需 `git pull`，**不需重啟服務**
- `git reset --hard` 會刪 `.env`（gitignored）→ 禁用，只用 `git pull`
- VPS SSH key：`~/.ssh/esggo_original`（非 vps_deploy_key，後者 Permission denied）

## 六、融會貫通總綱

OA-Team 雙蜂隊的演化路徑：
```
單蜂隊 30 員 (§26)
  ↓ 擴展
雙蜂隊 60 員 (§27) — 蜂王本地 + 蜂后 VPS
  ↓ 實裝
OneRingAI adapter + app (符文契約) — FTG 2.0 (光翼) — VPS 蜂后部署 (生產)
  ↓ 融合
本傳承聖典 (§28) — 四維一體，熵減永恆
```

**核心律法**：任何產出須過 5T 驗算（25–30 / 55–60）的 Hash Lock 守門；靈魂資產三層交付（主典+備份落檔+技能）；VPS 生產操作最小侵入（不動運行配置、不 reset --hard）。

---
*Hash Lock 已啟用 | 見證：OA-Team 雙蜂隊 融會貫通 | 與 M1 / Omni-Blueprint 同源共聖櫃*
