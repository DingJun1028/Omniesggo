# Omniesggo（ESG-GO）倉庫全面深度縱橫報告

> 生成：2026-11-01 | 分支 d03f425（最新） | 版本 5.1.0

## 一、倉庫總覽
- **性質**：ESG 永續報告書平台 × 即時雙語語音工具鏈 × AI 代理蜂群
- **架構**：pnpm 11.5.2 / turbo monorepo，Node ≥20（CI 22）
- **規模**：apps 32、packages 20、libs 1、workflows 36、總檔案數千+
- **授權**：AGPL-3.0
- **主網域**：esggo.co（平台）、ftgtours.esggo.co（旅遊）、omnilive/omnisub/translate.esggo.co（語音）

## 二、技術棧
| 層 | 技術 |
|---|---|
| 前端框架 | Next.js 16 App Router、React 19、Tailwind 3.4、Vite 8 |
| 後端/服務 | Next.js Server Actions、Express+SQLite、FastAPI（STT）、CF Workers |
| 資料庫 | Supabase/Postgres（正主）、Cloudflare D1（線索）、SQLite（journey）、NCB（代理記憶） |
| AI/推理 | 自架 Ollama（De-Google）、Gemini（可選）、VOSK+VoxSpica（STT）、faster-whisper |
| 基礎設施 | Cloudflare（邊緣 TLS/WAF/Tunnels/Workers）、Oracle VPS（nginx + PM2 ×6）、Vercel、Firebase、GHCR |
| 品質 | ESLint 9、TypeScript 5.9、Vitest 5、Playwright E2E、SonarCloud、actionlint |

## 三、產品矩陣（5 條產品線）
1. **ESGO 平台**（根 app/）— GRI 2024 / CSRD ESRS 永續報告書工作台：動態表單、重大性矩陣、碳工具、證據庫、哈希鎖鏈
2. **FTG 墾趣旅遊**（apps/ftg-*）— 企業永續旅遊行銷站 + 行程伴隨 App（Impact Note / ESG 任務 / 徽章）
3. **語音工具鏈**（omnilive/omnisub/universal-translator/stt）— 零金鑰即時雙語字幕／轉譯
4. **HTB 高科海藻**（apps/htb-b2b）— 永續海洋資源 B2B 官網
5. **Learning Center**（apps/learning-center）— Berkeley ESG 課程學員中心

內部基礎設施：OmniAgent Gateway、MCP Gateway（契約式唯讀）、OmniFactory（README 即部署）、JunAikey 萬能元鑰、OmniTag、30 蜂群框架。

## 四、系統架構（部署拓撲）
- **Cloudflare 邊緣**：TLS/WAF/Tunnels/Workers（esggo-web、ftgtours-api）
- **Oracle VPS（PM2 ×6）**：:3000 esggo-core、:8642 omniagent-gateway、:8788 universal-translator、:8791 stt-whisper、:8797 omnilive-translator、deerflow
- **並行通道**：Vercel、Firebase Hosting、GHCR 容器映像、Cloudflare Pages
- **STT→翻譯→字幕鏈**：麥克風/系統音訊 → VOSK(VoxSpica) → LibreTranslate→MyMemory → SSE 雙語字幕

## 五、Workspace 套件生態（packages/，20 個）
| 套件 | 能力 |
|---|---|
| @esggo/omni-core | IComponentCore 心核 + sealComponentCore Hash Lock 刻印 |
| @esggo/oa-framework | OA 萬能元框架（7 子框架 + 5T 管線，離線可驗） |
| @esggo/omni-agent | 代理本體（5T Gate） |
| @esggo/omni-agent-bus | 代理總線：事件/訊息骨幹、冪等重放、分裂快照、OA 橋接 |
| @esggo/ollama-mcp | 自架 Ollama MCP 橋（De-Google 推理層） |
| 其餘 | omni-memory / omni-db / omni-forge / omni-bridge / capacities / omni-tag / shared / errors / ui / omni-ui / i18n / cli |

## 六、品質治理（36 workflows，分 5 層）
### 6.1 硬閘門（PR/main 必經）
- ci-green-gate：同 commit 全 check-runs 輪詢，未全綠即紅（「不得開下一個 PR」）
- ts-matrix：TS 終始矩陣雙向驗證（棘輪規則：只減不增）
- schema-traceability：TypeBox schema 追溯（OMN-PRD-001 FR/NFR）
- soul-lineage：soul.md 版本血脈守護
- sonar-quality-gate：SonarCloud 品質閘
- repo-repair-checks：actionlint + oa-framework 離線驗證 + 祕密掃描
- security-audit：週期安全審計（pnpm audit + 全庫祕密掃描 + .env 入庫檢查）

### 6.2 自動修復（OA-TWINS Auto-Repair v2）
- 監聽 CI 失敗 → 8 類錯誤分類 → 可修復類自動 fix → 開 auto-repair/* PR → tracker issue + 通知 + OA 自驗

### 6.3 組裝與鑄造
- omni-factory：MEDCE 模組 → 5T/RWD/IComponentCore 追溯 → Cloudflare Pages
- sacred-pipeline：三段式熵減管線（掃描 → Docker 鑄造 → 零停機部署）
- deploy-ghcr / build / verify-root-dockerfile

### 6.4 派遣與運維
- crewai-run（代理派遣）、omnitag-weekly-audit、oci-launch-vps、vps-8642-*、deploy-deerflow、deploy-bilingual、deploy-worker、worker-bootstrap、omnilive-dns、ftg-build-check、check-design、test-dispatch

## 七、設計哲學
- **5T 協定**：Traceable / Transparent / Trustworthy / Transferful / True
- **零金鑰優先**：工具類產品免註冊即可用
- **Cloudflare 邊緣 + Oracle Free Tier 零成本底座**
- **De-Google 政策**：推理層自架 Ollama，平台資料層以 Supabase 為正主
- **治理即程式碼**：.github/workflows 36 條、scripts 治理腳本、soul.md 血脈守護

## 八、開發規範
- Commit：5T 五行格式 + `[best-practice:awakened]` 標籤；`git commit -F` 從檔讀取
- Secrets：一律 `.env.local`（gitignored）；pre-commit 掃描；CI 全庫掃描兜底
- 依賴安全：overrides 鉗制在各安裝根 pnpm-workspace.yaml，原則不跨 major
- 分支：feature/* 開 PR → CI 全綠閘 → squash 合併 main → 自動部署
- 硬編碼禁令：fail-fast；TypeBox schema 為契約正本；PRD 追溯以 shared/prd-matrix.json 為準

## 九、核心模組
- **JunAikey 萬能元鑰**（vps/junaikey.mjs）：代理成長層（記憶/技能/進度/閉環），NCBDB primary + local fallback
- **OmniTag 萬能標籤**：6 維 MECE 結構化標籤 + 信任分級
- **MCP Gateway**（apps/mcp-gateway，tzin 試點）：AI 原生 MCP 閘道（唯讀、default-deny）
- **OmniFactory**：MEDCE 規格 → 組裝 → Cloudflare Pages
- **ts-matrix**（tools/ts-matrix）：TS 終始矩陣雙向驗證器 + drift baseline

## 十、風險與觀察
1. **磁碟使用 96%**（457G/477G），需清理
2. **依賴數量龐大**（overrides 80+ 條），維護成本高
3. **多條 CI 流水線**（36 條），執行時間與資源消耗大
4. **32-bit 本機 Node 無法跑 tsc/vitest**（記憶中已記錄），CI 為唯一驗證閘
5. **大量 soul-chapter 文件**（30+ 章），需 soul-lineage CI 守護
6. **多部署通道並行**（Vercel/Firebase/CF Pages/GHCR/Oracle），需協調

## 十一、建議下一步
1. 清理磁碟（找大檔、清理暫存）
2. 檢查 CI 狀態（`bash .hermes/auto-repair/ci-gate.sh --list HEAD`）
3. 驗證 ts-matrix drift baseline
4. 評估 packages/oa-framework 離線驗證（`pnpm run check`）
5. 確認 soul-lineage 血脈連續性
