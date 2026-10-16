'use client';

import { useState, useMemo } from 'react';

export interface ConcentricLayerInfo {
  layer: number;
  name: string;
  theme: string;
  responsibility: string;
  representative: string;
  inputSpec: string;
  outputSpec: string;
  color: string;
}

export const CONCENTRIC_LAYERS: ConcentricLayerInfo[] = [
  {
    layer: 0,
    name: '萬能意圖心核',
    theme: 'ESGGO 善向永續願景導航',
    responsibility: '感應用戶核心目標、業務意圖與永續痛點，作為唯一北極星',
    representative: 'IntentCoreFacility',
    inputSpec: '原始用戶指令、對話、業務期望',
    outputSpec: '結構化意圖規範 (IntentSpec)',
    color: '#3B82F6', // Blue
  },
  {
    layer: 1,
    name: '萬能感知雷達',
    theme: '多模態即時情境感知與碳排數據監測',
    responsibility: '全管道捕捉多模態文檔、代碼、日誌與環境事件輸入',
    representative: 'PerceptionRadarFacility',
    inputSpec: '多模態文件、IoT 遙測、Webhook',
    outputSpec: '標準化情境事件 (PerceptionEvent)',
    color: '#06B6D4', // Cyan
  },
  {
    layer: 2,
    name: '萬能記憶樞紐',
    theme: '5T 永續存證與歷史偏好沉澱',
    responsibility: '以 5T 治理架構存證真實數據、歷史案例與因果關係',
    representative: 'MemoryHubFacility',
    inputSpec: '情境事件、執行紀錄、回饋標籤',
    outputSpec: '5T 存證檢索上下文 (MemoryContext)',
    color: '#10B981', // Emerald
  },
  {
    layer: 3,
    name: '萬能推理大腦',
    theme: 'Groq Qwen 極速認知推演',
    responsibility: '驅動情境理解、策略推演與 ESG 減碳路徑生成',
    representative: 'InferenceBrainFacility',
    inputSpec: '意圖規範 + 記憶上下文',
    outputSpec: '策略行動方案 (InferencePlan)',
    color: '#8B5CF6', // Purple
  },
  {
    layer: 4,
    name: '萬能治理閘門',
    theme: '合規校驗與安全邊界防護',
    responsibility: '執行權限管控、合規校驗、隱私保護與邊界防護',
    representative: 'GovernanceGateFacility',
    inputSpec: '策略方案、操作清單',
    outputSpec: '經治理簽章之指令 (GovernedAction)',
    color: '#F59E0B', // Amber
  },
  {
    layer: 5,
    name: '萬能編排中樞',
    theme: 'DAG 工作流調度與依賴管理',
    responsibility: '將決策策略分解為具體 DAG 工作流與優先順序調度',
    representative: 'OrchestrationHubFacility',
    inputSpec: '經核准策略與資源狀態',
    outputSpec: 'DAG 任務工作流 (OrchestrationPlan)',
    color: '#EC4899', // Pink
  },
  {
    layer: 6,
    name: '萬能執行工坊',
    theme: '核心業務運算與程式碼自動修復',
    responsibility: '驅動業務運算、代碼修復與 ESG 評分計算流水線',
    representative: 'ExecutionWorkshopFacility',
    inputSpec: 'DAG 任務節點',
    outputSpec: '實質計算成效 (ExecutionResult)',
    color: '#EF4444', // Red
  },
  {
    layer: 7,
    name: '萬能整合網絡',
    theme: '開放生態與第三方 API 連接',
    responsibility: '對接 GitHub、Cloudflare、SaaS 工具與碳盤查外部生態',
    representative: 'IntegrationNetworkFacility',
    inputSpec: '外部呼叫請求、對接參數',
    outputSpec: '生態同步數據 (IntegrationSync)',
    color: '#6366F1', // Indigo
  },
  {
    layer: 8,
    name: '萬能體驗門戶',
    theme: 'SSE 即時串流與同心圓雷達可視化',
    responsibility: '透過 SSE 即時串流、演化儀表板與視覺化交互交付價值',
    representative: 'ExperiencePortalFacility',
    inputSpec: '執行狀態、ESG 評分指標',
    outputSpec: '即時渲染串流 (PortalViewStream)',
    color: '#14B8A6', // Teal
  },
  {
    layer: 9,
    name: '萬能演化生長環',
    theme: '自主迭代與雙向閉環反饋',
    responsibility: '收集反饋與成效，動態優化特徵模型與決策鏈',
    representative: 'EvolutionRingFacility',
    inputSpec: '客戶回饋、CI 成效、碳盤查驗證',
    outputSpec: '生長演化補丁 (EvolutionPatch)',
    color: '#84CC16', // Lime
  },
];

const CX = 160;
const CY = 160;
const MIN_RADIUS = 24;
const RADIUS_STEP = 13.5;

export function ConcentricRadar() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [diffusionActive, setDiffusionActive] = useState<boolean>(true);

  const activeInfo = useMemo(
    () => CONCENTRIC_LAYERS.find((l) => l.layer === activeLayer) || CONCENTRIC_LAYERS[0],
    [activeLayer]
  );

  return (
    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-slate-100 shadow-xl max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            OmniSystem 10 層 MECE 同心圓萬能設施雷達
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            主題：ESGGO 善向永續・正向外向擴散 (0→9) 與反向閉環反饋 (9→2&0)
          </p>
        </div>
        <button
          onClick={() => setDiffusionActive(!diffusionActive)}
          className={`text-xs px-3 py-1 rounded-md border transition-colors ${
            diffusionActive
              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {diffusionActive ? '動態波紋：開啟' : '動態波紋：暫停'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG 同心圓可視化雷達 */}
        <div className="md:col-span-6 flex justify-center items-center">
          <svg width={320} height={320} className="overflow-visible select-none">
            {/* 定義濾鏡與光暈 */}
            <defs>
              <filter id="concentric-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 10 層同心圓環 */}
            {CONCENTRIC_LAYERS.map((item) => {
              const radius = MIN_RADIUS + item.layer * RADIUS_STEP;
              const isSelected = activeLayer === item.layer;
              return (
                <g key={item.layer} className="cursor-pointer" onClick={() => setActiveLayer(item.layer)}>
                  <circle
                    cx={CX}
                    cy={CY}
                    r={radius}
                    fill={isSelected ? item.color : 'none'}
                    fillOpacity={isSelected ? 0.2 : 0}
                    stroke={item.color}
                    strokeWidth={isSelected ? 3 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.45}
                    filter={isSelected ? 'url(#concentric-glow)' : undefined}
                    className="transition-all duration-200 hover:stroke-opacity-100"
                  />
                  {/* 層級節點標示 */}
                  <circle
                    cx={CX + radius * Math.cos((item.layer * Math.PI) / 5)}
                    cy={CY + radius * Math.sin((item.layer * Math.PI) / 5)}
                    r={isSelected ? 4.5 : 2.5}
                    fill={item.color}
                  />
                </g>
              );
            })}

            {/* 中心核心圖標 (Layer 0) */}
            <circle cx={CX} cy={CY} r={10} fill="#3B82F6" className="animate-pulse" />
            <text
              x={CX}
              y={CY + 3}
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              L0
            </text>
          </svg>
        </div>

        {/* 右側詳細資料卡片 */}
        <div className="md:col-span-6 space-y-3">
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs px-2 py-0.5 rounded font-mono font-bold"
                style={{ backgroundColor: `${activeInfo.color}22`, color: activeInfo.color }}
              >
                第 {activeInfo.layer} 層 ｜ {activeInfo.representative}
              </span>
              <span className="text-[11px] text-slate-400">MECE 邊界隔離規範</span>
            </div>

            <div className="text-base font-bold text-slate-100">{activeInfo.name}</div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">{activeInfo.theme}</div>

            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeInfo.responsibility}
            </p>

            <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">輸入介面</span>
                <span className="text-slate-200">{activeInfo.inputSpec}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">輸出介面</span>
                <span className="text-slate-200">{activeInfo.outputSpec}</span>
              </div>
            </div>
          </div>

          {/* 層級快速選擇器 */}
          <div className="flex flex-wrap gap-1.5">
            {CONCENTRIC_LAYERS.map((item) => (
              <button
                key={item.layer}
                onClick={() => setActiveLayer(item.layer)}
                className={`text-[11px] px-2 py-1 rounded transition-all font-mono ${
                  activeLayer === item.layer
                    ? 'bg-slate-100 text-slate-900 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                L{item.layer} {item.name.slice(2, 4)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
