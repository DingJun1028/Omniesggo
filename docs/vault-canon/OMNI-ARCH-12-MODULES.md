# OMNI-ARCH — 12大萬能架構 TypeScript 契約實作（正典）

> source_origin: docs/vault-canon/OMNI-ARCH-12-MODULES.md
> 對應套件: `@esggo/omni-arch`（packages/omni-arch）
> 藍圖依據: 12大萬能架構（OA/OAB/OAG 三位一體 × 九大奇效 × 12大萬能模組）

## 1. 定位與邊界

本套件將 12大萬能架構從設計藍圖落為可執行、可驗收的 TypeScript 契約實作。復用 `@esggo/omni-core` 已落地之 R1–R7 能力（deepFreeze、egressLock、EntropyLedger、PrefetchGate、LearningLoop、ChaosEngine），不重複實作，僅做編排與模組化封裝（MECE）。

## 2. 12大萬能模組（四大維度 × 各三模組）

| 維度 | 模組 | 檔案 | 核心能力 |
|---|---|---|---|
| 物理空間與記憶 | OmniBase | src/base.ts | 運行時容器：模組註冊表（MECE 禁重複）＋ start/stop 生命週期 |
| 物理空間與記憶 | OmniMemory | src/memory.ts | 群體知識聖所：每筆記憶 IComponentCore ＋ sealComponentCore 封存 |
| 物理空間與記憶 | OmniTime | src/time.ts | 時空裂縫：append-only 事件流、時間區間重放、深凍結快照 |
| 邊界實體語義 | OmniComponent | src/component.ts | UI 載體：UI 無關描述子（kind/props/theme/effect）＋ Hash Lock |
| 邊界實體語義 | OmniTag | src/tag.ts | 語義標籤：#高危操作 觸發唯讀防護色（MartialLock） |
| 邊界實體語義 | OmniEvidence | src/evidence.ts | 零幻覺驗算：輸入＋公式重算＋期望比對，存證可獨立複核 |
| 動態驅動通訊 | OmniAgent | src/agent.ts | UX 靈魂：意圖註冊／understand 分發，未知意圖 fail-fast |
| 動態驅動通訊 | OmniAPI | src/api.ts | 萬能符文：能力銘刻／invoke，回傳一律 deepFreeze |
| 動態驅動通訊 | OmniBus | src/bus.ts | 總線＋背壓監聽：高水位策略（drop-oldest／reject）＋ egressLock |
| 安全自癒治理 | OmniGateway | src/gateway.ts | 神聖契約：ingress 契約形狀驗證＋戒嚴寫入鎖；egress source_origin 100% 溯源 |
| 安全自癒治理 | OmniHealing | src/healing.ts | 戒嚴（sys.martial_law）＋混沌自癒（復用 R7 LearningLoop/ChaosEngine） |
| 安全自癒治理 | OmniEvolution | src/evolution.ts | 每週熵減（復用 R3 EntropyLedger）＋ AGPL-3.0 合規審查掛鉤 |

## 3. 橫向頂層與附加

- 萬能架構（OmniArch, src/arch.ts）：germinate() 一次組裝 12 模組＋頂層；topology 可驗收（4 維度 × 3 = 12，不重不漏）；ensureContract 契約執行。
- 萬能引擎（OmniEngine, src/engine.ts）：Healing＋Evolution 心臟；heartbeat() 產出 EnginePulse（混沌探針＋熵減指標＋主題同步）。
- 萬能主題（OmniTheme, src/theme.ts）：LiquidGlass／MartialLock／CelestialGlow；戒嚴期間全域 UI 強制防護色。
- 萬能種子（OmniSeed, src/seed.ts）：germinateAgent／germinateComponent 細胞分裂母體；世代計數＋血脈 parentUuid，子代各自新 uuid（天生快照隔離）。
- 萬能用戶RAG成長資料庫（OmniUserRegistry, src/user-registry.ts）：個體層成長軌跡，與 OmniMemory（群體層）互補。

## 4. 生命體頂層編排（OmniHeart × OmniBrain, src/heart.ts）

- OmniHeart（全通之心）：OmniEye（Memory＋Tag＋UserRegistry）、OmniCore（Agent＋Seed）、OmniPulse（Bus＋Time）、OmniBone（API＋Gateway＋Evidence）。
- OmniBrain（全息之腦）：OmniBase＋OmniHealing＋OmniEvolution＋OmniTheme；戒嚴時經 healing 狀態回呼廣播 sys.martial_law 上總線並留時空裂縫痕跡。

## 5. 預設接線（OmniArch.germinate）

1. OmniHealing 狀態變化 → OmniBus 發佈 `sys.martial_law` 事件 ＋ OmniTime 裂縫留痕。
2. OmniTheme 以 healing.isLocked() 為鎖源，戒嚴強制 MartialLock。
3. OmniEvolution 的 journal 來源 = Bus journal ＋ Time journal（重複 uuid 即技術債信號）。
4. OmniGateway 的寫入鎖由 healing 戒嚴狀態決定。

## 6. 首個落地場景（端到端測試見 test/arch.test.ts）

碳盤查 ISO-14064-1：意圖 `esg.carbon.check` → 符文 `carbon.compute`（1200 kWh × 0.509）→ OmniEvidence 驗算存證 → OmniMemory 記憶 → OmniBus `esg.verified` 出口封裝。

## 7. 如實揭露（未於本套件實作項）

- 九大奇效之「時空裂縫事件重放」完整版與「冪等重放 journal」在 @esggo/omni-agent-bus（R4）；本套件 OmniTime 為模組級事件流，不重複。
- 「全知蜂巢（Blackboard／動態競標）」與「先知矩陣（多重宇宙並行）」僅接入 PrefetchGate 成本閘門語義，蜂巢競標編排屬下階段。
- OmniComponent 為 UI 無關契約，液態玻璃渲染屬前端框架層（apps/）。
- OmniGateway 為模組級邊界；部署級信任邊界（API-key 閘）在 apps/gateway（:8642）。