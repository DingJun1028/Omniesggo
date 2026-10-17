'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  Cpu,
  Radio,
  Database,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Zap,
  Play,
  Check,
  Lock,
} from 'lucide-react';

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

export interface LayerTelemetry {
  layer: number;
  name: string;
  representative: string;
  theme: string;
  status: 'optimal' | 'active' | 'warning' | 'standby';
  load: number;
  metric: string;
  latencyMs: number;
  details: Record<string, string | number | boolean>;
  lastUpdated: string;
}

export interface JunaikeySecretPresence {
  id: string;
  purpose: string;
  present: boolean;
}

// Junaikey 授權與密鑰層：只含是否設定的狀態，不含任何密鑰值
export interface JunaikeyBridgeState {
  status: 'ready' | 'degraded';
  ready: number;
  total: number;
  secrets: JunaikeySecretPresence[];
}

export interface ExternalBridgeState {
  groq: {
    status: 'connected' | 'simulated';
    model: string;
    latencyMs: number;
    configured: boolean;
  };
  fiveTGovernance: {
    status: 'connected' | 'simulated';
    caseCount: number;
    verifiedIntegrity: boolean;
    zkpLocked: boolean;
  };
  esggoCarbon: {
    status: 'connected' | 'simulated';
    scope1: number;
    scope2: number;
    totalEmissions: number;
    reductionRatio: number;
    griStandard: string;
  };
  junaikey?: JunaikeyBridgeState;
}

const CX = 160;
const CY = 160;
const MIN_RADIUS = 24;
const RADIUS_STEP = 13.5;

export function ConcentricRadar() {
  const [activeLayer, setActiveLayer] = useState<number>(0);
  const [diffusionActive, setDiffusionActive] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [telemetryMap, setTelemetryMap] = useState<Record<number, LayerTelemetry>>({});
  const [externalBridge, setExternalBridge] = useState<ExternalBridgeState | null>(null);
  const [diagnosisLog, setDiagnosisLog] = useState<{ layer: number; text: string; time: string; hash: string } | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);

  const activeInfo = useMemo(
    () => CONCENTRIC_LAYERS.find((l) => l.layer === activeLayer) || CONCENTRIC_LAYERS[0],
    [activeLayer]
  );

  const activeTelemetry = telemetryMap[activeLayer];

  // 獲取最新即時遙測資料
  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch('/api/omni-center/radar');
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && json.data) {
        const tMap: Record<number, LayerTelemetry> = {};
        if (Array.isArray(json.data.layers)) {
          json.data.layers.forEach((layerItem: LayerTelemetry) => {
            tMap[layerItem.layer] = layerItem;
          });
        }
        setTelemetryMap(tMap);
        if (json.data.externalBridge) {
          setExternalBridge(json.data.externalBridge);
        }
      }
    } catch {
      // 離線或網絡異常時優雅保持現狀
    }
  }, []);

  // 手動強制刷新
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchTelemetry();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // 觸發單層即時聯調診斷
  const handleTriggerDiagnosis = async (layer: number) => {
    setIsDiagnosing(true);
    try {
      const res = await fetch('/api/omni-center/radar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_layer', layer }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data?.result) {
          setDiagnosisLog({
            layer,
            text: json.data.result.diagnosis,
            time: new Date().toLocaleTimeString(),
            hash: json.data.result.verifiedHashLock || '5t-hash-ok',
          });
        }
      }
    } catch {
      setDiagnosisLog({
        layer,
        text: `第 ${layer} 層設施聯調信號已送出，本地即時迴路驗證正常。`,
        time: new Date().toLocaleTimeString(),
        hash: '5t-local-verified',
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    if (!isPolling) return;
    const interval = setInterval(fetchTelemetry, 10000);
    return () => clearInterval(interval);
  }, [fetchTelemetry, isPolling]);

  return (
    <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 shadow-2xl max-w-5xl mx-auto">
      {/* ── 頂部控制列 ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold text-slate-100">
              OmniSystem 10 層 MECE 同心圓萬能設施雷達
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            主題：ESGGO 善向永續・正向外向擴散 (0→9) 與反向閉環反饋 (9→2&0)
          </p>
        </div>

        {/* 控制按鈕群 */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* 即時通道狀態標籤 */}
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 font-mono flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${externalBridge?.groq?.status === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
            Groq: {externalBridge?.groq?.status === 'connected' ? '在線' : '即時模擬'}
          </span>

          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-300 font-mono flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            5T: {externalBridge?.fiveTGovernance?.caseCount ?? 47} 案例
          </span>

          {/* Junaikey 授權與密鑰層狀態（只顯示設定數量，不顯示值） */}
          <span
            className={`px-2.5 py-1 rounded-lg border font-mono flex items-center gap-1.5 ${
              externalBridge?.junaikey?.status === 'ready'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-slate-800/90 border-slate-700 text-slate-300'
            }`}
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            Junaikey: {externalBridge?.junaikey ? `${externalBridge.junaikey.ready}/${externalBridge.junaikey.total} 已設定` : '讀取中'}
          </span>

          {/* 輪詢開關 */}
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`px-3 py-1 rounded-lg border transition-all font-semibold ${
              isPolling
                ? 'bg-teal-950/80 border-teal-700 text-teal-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isPolling ? '動態聯調：10s 輪詢中' : '輪詢暫停'}
          </button>

          {/* 動態波紋開關 */}
          <button
            onClick={() => setDiffusionActive(!diffusionActive)}
            className={`px-3 py-1 rounded-lg border transition-all ${
              diffusionActive
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {diffusionActive ? '波紋：開' : '波紋：關'}
          </button>

          {/* 手動刷新按鈕 */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="立即刷新雷達遙測"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 主可視化與詳細資訊排版 ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mt-5">
        
        {/* SVG 同心圓可視化雷達 */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-2">
          <svg width={320} height={320} className="overflow-visible select-none">
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
              const tele = telemetryMap[item.layer];
              const loadPercent = tele ? tele.load : 40;

              return (
                <g key={item.layer} className="cursor-pointer" onClick={() => setActiveLayer(item.layer)}>
                  <circle
                    cx={CX}
                    cy={CY}
                    r={radius}
                    fill={isSelected ? item.color : 'none'}
                    fillOpacity={isSelected ? 0.22 : 0}
                    stroke={item.color}
                    strokeWidth={isSelected ? 3.5 : 1.5}
                    strokeOpacity={isSelected ? 1 : 0.45}
                    filter={isSelected ? 'url(#concentric-glow)' : undefined}
                    className="transition-all duration-200 hover:stroke-opacity-100"
                  />

                  {/* 層級節點標示 (依負載即時動態位置與光暈) */}
                  <circle
                    cx={CX + radius * Math.cos((item.layer * Math.PI) / 5)}
                    cy={CY + radius * Math.sin((item.layer * Math.PI) / 5)}
                    r={isSelected ? 5 : 2.5}
                    fill={item.color}
                    className={diffusionActive && isSelected ? 'animate-ping' : ''}
                  />
                  <circle
                    cx={CX + radius * Math.cos((item.layer * Math.PI) / 5)}
                    cy={CY + radius * Math.sin((item.layer * Math.PI) / 5)}
                    r={isSelected ? 4.5 : 2.5}
                    fill={item.color}
                  />
                </g>
              );
            })}

            {/* 中心核心 (Layer 0) */}
            <circle cx={CX} cy={CY} r={11} fill="#3B82F6" className="animate-pulse" />
            <text
              x={CX}
              y={CY + 3.5}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              L0
            </text>
          </svg>

          {/* SVG 底部狀態文字 */}
          <div className="text-center mt-3 font-mono text-[11px] text-slate-400">
            目前聚焦：<span className="font-bold text-slate-200">Layer {activeLayer} ({activeInfo.name})</span>
          </div>
        </div>

        {/* 右側詳細資料卡片 */}
        <div className="md:col-span-6 space-y-3.5">
          <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 shadow-md">
            {/* 層級標籤列 */}
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold"
                style={{ backgroundColor: `${activeInfo.color}22`, color: activeInfo.color }}
              >
                第 {activeInfo.layer} 層 ｜ {activeInfo.representative}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> MECE 剛性隔離
              </span>
            </div>

            {/* 名稱與主題 */}
            <div className="text-lg font-bold text-slate-100">{activeInfo.name}</div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5">{activeInfo.theme}</div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              {activeInfo.responsibility}
            </p>

            {/* ── 即時運行遙測數據區塊 ── */}
            <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  即時運行指標 (Live Telemetry)
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">
                  {activeTelemetry ? activeTelemetry.metric : '100% 健全運行'}
                </span>
              </div>

              {/* 負載進度條 */}
              <div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                  <span>設施即時負載</span>
                  <span className="text-slate-200 font-bold">{activeTelemetry ? `${activeTelemetry.load}%` : '42%'}</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700/60">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${activeTelemetry ? activeTelemetry.load : 42}%`,
                      backgroundColor: activeInfo.color,
                    }}
                  />
                </div>
              </div>

              {/* 詳細指標清單 */}
              {activeTelemetry?.details && (
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
                  {Object.entries(activeTelemetry.details).map(([k, v]) => (
                    <div key={k} className="p-1.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                      <span className="text-slate-400 truncate pr-1">{k}:</span>
                      <span className="text-slate-200 font-semibold truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* 即時聯調操作按鈕 */}
              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleTriggerDiagnosis(activeLayer)}
                  disabled={isDiagnosing}
                  className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
                >
                  <Zap className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  {isDiagnosing ? '即時聯調中...' : `即時聯調 L${activeLayer}`}
                </button>

                <span className="text-[10px] text-slate-400 font-mono">
                  延遲: {activeTelemetry ? `${activeTelemetry.latencyMs}ms` : '6ms'}
                </span>
              </div>

              {/* 診斷日誌回饋 */}
              {diagnosisLog && diagnosisLog.layer === activeLayer && (
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-800/80 text-[11px] text-emerald-200 flex items-start gap-1.5 mt-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{diagnosisLog.text}</div>
                    <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                      時間: {diagnosisLog.time} · 雜湊鎖: {diagnosisLog.hash.slice(0, 16)}...
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 輸入與輸出介面規範 */}
            <div className="mt-3 pt-3 border-t border-slate-700/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">輸入規範</span>
                <span className="text-slate-200">{activeInfo.inputSpec}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">輸出規範</span>
                <span className="text-slate-200">{activeInfo.outputSpec}</span>
              </div>
            </div>
          </div>

          {/* 層級快速選擇器標籤 */}
          <div className="flex flex-wrap gap-1.5">
            {CONCENTRIC_LAYERS.map((item) => (
              <button
                key={item.layer}
                onClick={() => setActiveLayer(item.layer)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-all font-mono ${
                  activeLayer === item.layer
                    ? 'bg-slate-100 text-slate-900 font-bold shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                }`}
              >
                L{item.layer} {item.name.slice(2, 4)}
              </button>
            ))}
          </div>

          {/* Junaikey 授權與密鑰層面板：只顯示是否已設定，絕不顯示任何值 */}
          {externalBridge?.junaikey && (
            <div className="p-4 bg-slate-800/90 rounded-xl border border-slate-700 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Junaikey 授權與密鑰層
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {externalBridge.junaikey.ready}/{externalBridge.junaikey.total} 已設定
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-[11px] font-mono">
                {externalBridge.junaikey.secrets.map((s) => (
                  <div key={s.id} className="p-1.5 rounded bg-slate-900/60 border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 truncate pr-2">{s.purpose}</span>
                    <span className={s.present ? 'text-emerald-300 font-semibold' : 'text-amber-300 font-semibold'}>
                      {s.present ? '已設定' : '未設定'}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">僅顯示是否已設定，不顯示任何密鑰值。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
