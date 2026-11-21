"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TEN_WINGS_APOSTLES, ARCANE_ARTS, 
  type ArcaneArt, type ApostleMetadata 
} from "@/lib/adk/ten-wings";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Zap, Shield, Globe, Terminal, CheckCircle2, 
  Clock, Activity, ArrowRight, RotateCcw,
  ChevronDown, Users, Target, Lock, AlertTriangle
} from "lucide-react";
import { dispatchTaskAction } from "@/lib/actions/adk-actions";
import { useEffect } from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type DispatchMode = "arcane" | "solo" | "matrix";

interface MissionReport {
  id: string;
  mode: DispatchMode;
  apostles: string[];
  project: string;
  task: string;
  arcane?: ArcaneArt;
  status: "dispatching" | "computing" | "complete" | "error";
  entropyReduced: number;
  resonance: number;
  pillarScores: Record<string, number>;
  log: { time: string; apostle: string; msg: string; type: "info" | "success" | "warn" }[];
  vaultId: string;
}

const PROJECTS = ["ESG GO", "Impact Nexus", "OmniAntigravity", "LingoStep", "WillOS"];
const ARCANE_OPTIONS: ArcaneArt[] = ["本質提純", "聖典共鳴", "代理織網", "神蹟顯現", "熵減煉金", "永恆刻印"];

function generateVaultId() {
  return `celestial.dev/logs/${Math.random().toString(36).slice(2, 10).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
}

function getApostlesForArcane(art: ArcaneArt): ApostleMetadata[] {
  return TEN_WINGS_APOSTLES.filter(a => a.arcane === art);
}

// ─────────────────────────────────────────────
// Dispatch Modes Config
// ─────────────────────────────────────────────
const MODE_CONFIG: Record<DispatchMode, {
  label: string; sublabel: string; icon: React.ElementType; color: string; desc: string;
}> = {
  arcane: {
    label: "⚡ 奧義律令式",
    sublabel: "全自動工作流",
    icon: Zap,
    color: "#F59E0B",
    desc: "啟動奧義六式，全隊自動介入。適合有明確目標的大型執行任務。"
  },
  solo: {
    label: "🛡️ 單兵使徒召喚",
    sublabel: "精準打擊",
    icon: Shield,
    color: "#3B82F6",
    desc: "召喚指定使徒，針對特定技術難題或 UI 調整進行精準解決。"
  },
  matrix: {
    label: "🌐 矩陣協作協議",
    sublabel: "複雜專案部署",
    icon: Globe,
    color: "#10B981",
    desc: "多使徒協同作戰，適用於大型計畫發布或跨系統整合任務。"
  }
};

// ─────────────────────────────────────────────
// Simulation Engine
// ─────────────────────────────────────────────
async function simulateMission(
  reportId: string,
  mode: DispatchMode,
  apostleIds: string[],
  project: string,
  task: string,
  arcaneArt: ArcaneArt | undefined,
  onUpdate: (report: Partial<MissionReport>) => void
): Promise<MissionReport> {
  onUpdate({ status: "dispatching" });

  const apostleNames = apostleIds.map(id => {
    const a = TEN_WINGS_APOSTLES.find(x => x.id === id);
    return a ? `[${a.id}] ${a.name}` : `[${id}]`;
  });

  const log: MissionReport["log"] = [];

  const addLog = (apostle: string, msg: string, type: "info" | "success" | "warn" = "info") => {
    log.push({ 
      time: new Date().toLocaleTimeString("zh-TW", { hour12: false }), 
      apostle, msg, type 
    });
  };

  // Phase 1: Dispatch
  addLog("[07] 任務分派代理", `接收任務指令 → 目標: ${project}`, "info");
  await delay(600);
  addLog("[07] 任務分派代理", `識別標籤 #${mode === "arcane" ? "全自動" : mode === "solo" ? "精準打擊" : "矩陣協作"} · 路由至執行使徒`, "info");
  
  onUpdate({ status: "computing", log: [...log] });
  await delay(500);

  // Phase 2: Execution per apostle
  for (const id of apostleIds.slice(0, 3)) {
    const a = TEN_WINGS_APOSTLES.find(x => x.id === id);
    if (!a) continue;
    addLog(`[${a.id}] ${a.name}`, `執行 ${a.arcane} → ${task.slice(0, 40)}...`, "info");
    onUpdate({ log: [...log] });
    await delay(700);
  }

  // Phase 3: Validation
  addLog("[05] 零幻覺驗算師", `交叉驗算執行結果... ISO-14064-1 合規檢查`, "info");
  await delay(600);
  addLog("[05] 零幻覺驗算師", `✓ 幻覺率: 0.04% — 通過驗算`, "success");
  await delay(400);

  // Phase 4: Seal
  addLog("[01] 契約鑄造者", `執行 Object.freeze() + UUID 鎖定`, "success");
  await delay(400);
  addLog("[10] 靈魂刻印者", `知識刻印完成 → 寫入萬能智庫`, "success");

  const finalReport: MissionReport = {
    id: reportId,
    mode,
    apostles: apostleIds,
    project,
    task,
    arcane: arcaneArt,
    status: "complete",
    entropyReduced: Math.round((3 + Math.random() * 7) * 10) / 10,
    resonance: Math.round(92 + Math.random() * 7),
    pillarScores: {
      "真": Math.round(90 + Math.random() * 9),
      "善": Math.round(88 + Math.random() * 10),
      "美": mode === "solo" && apostleIds.includes("03") ? Math.round(95 + Math.random() * 4) : Math.round(82 + Math.random() * 12),
      "信": Math.round(96 + Math.random() * 3),
      "通": Math.round(89 + Math.random() * 9),
    },
    log,
    vaultId: generateVaultId(),
  };

  onUpdate(finalReport);
  return finalReport;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
export function AdkTaskDispatcher() {
  const [mode, setMode] = useState<DispatchMode>("arcane");
  const [project, setProject] = useState("ESG GO");
  const [task, setTask] = useState("");
  const [selectedArcane, setSelectedArcane] = useState<ArcaneArt>("本質提純");
  const [selectedSolo, setSelectedSolo] = useState<string>("01");
  const [leadApostle, setLeadApostle] = useState<string>("07");
  const [matrixPillars, setMatrixPillars] = useState<string[]>(["真", "信"]);
  const [report, setReport] = useState<MissionReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const togglePillar = (p: string) => {
    setMatrixPillars(prev => 
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const getDispatchApostles = (): string[] => {
    if (mode === "arcane") {
      return getApostlesForArcane(selectedArcane).map(a => a.id);
    }
    if (mode === "solo") return [selectedSolo];
    // Matrix: lead + pillar-relevant apostles
    const pillarMap: Record<string, string[]> = {
      "真": ["01", "04"], "善": ["05", "09"], "美": ["03"],
      "信": ["10", "02"], "通": ["06", "07", "08"]
    };
    const ids = new Set<string>([leadApostle]);
    matrixPillars.forEach(p => (pillarMap[p] || []).forEach(id => ids.add(id)));
    return Array.from(ids).slice(0, 5);
  };

  const handleDispatch = async () => {
    if (!task.trim() || isRunning) return;
    setIsRunning(true);
    const id = `MISSION-${Date.now().toString(36).toUpperCase()}`;
    const apostleIds = getDispatchApostles();

    const initial: MissionReport = {
      id, mode, apostles: apostleIds, project, task,
      arcane: mode === "arcane" ? selectedArcane : undefined,
      status: "dispatching", entropyReduced: 0, resonance: 0,
      pillarScores: {}, log: [], vaultId: ""
    };
    setReport(initial);

    // Call the server action for the lead apostle or all apostles
    // For now, we dispatch to the main apostle in the group
    const leadId = apostleIds[0];
    const response = await dispatchTaskAction(leadId, task);

    if (response.success) {
      const data = response.data;
      setReport(prev => ({
        ...(prev || initial),
        status: "complete",
        log: [
          ...(prev?.log || []),
          { 
            time: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
            apostle: leadId,
            msg: "Task executed successfully via ADK Runner.",
            type: "success"
          }
        ],
        vaultId: data?.metadata?.vaultId || report?.vaultId || generateVaultId(),
        entropyReduced: data?.metadata?.entropyReduced || 4.2,
        resonance: data?.metadata?.resonance || 98
      }));
    } else {
      setReport(prev => ({
        ...(prev || initial),
        status: "error",
        log: [
          ...(prev?.log || []),
          { 
            time: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
            apostle: "SYSTEM",
            msg: `Execution failed: ${response.error}`,
            type: "warn"
          }
        ]
      }));
    }
    
    setIsRunning(false);
  };

  const modeInfo = MODE_CONFIG[mode];

  return (
    <div className="space-y-6">
      {/* ── Mode Selector ── */}
      <div className="grid grid-cols-3 gap-3">
        {(Object.keys(MODE_CONFIG) as DispatchMode[]).map(m => {
          const cfg = MODE_CONFIG[m];
          const Icon = cfg.icon;
          return (
            <motion.button
              key={m}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode(m)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                mode === m
                  ? "border-primary/40 bg-primary/5 shadow-crystal-optimal"
                  : "border-border bg-bg-surface hover:border-primary/20"
              }`}
            >
              <Icon className="w-5 h-5 mb-2" style={{ color: cfg.color }} />
              <p className="text-xs font-black text-text-main leading-tight">{cfg.label}</p>
              <p className="text-[9px] text-text-muted mt-0.5">{cfg.sublabel}</p>
            </motion.button>
          );
        })}
      </div>

      {/* ── Mode Description ── */}
      <div className="p-3 rounded-xl bg-bg-base/50 border border-border text-[10px] text-text-muted leading-relaxed">
        {modeInfo.desc}
      </div>

      {/* ── Configuration ── */}
      <div className="space-y-3">
        {/* Project */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">目標</label>
          <div className="flex gap-2 flex-1 flex-wrap">
            {PROJECTS.map(p => (
              <button
                key={p}
                onClick={() => setProject(p)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  project === p 
                    ? "bg-primary/10 border-primary/40 text-primary" 
                    : "border-border text-text-muted hover:border-primary/20"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Mode-specific config */}
        {mode === "arcane" && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">奧義</label>
            <div className="flex gap-2 flex-1 flex-wrap">
              {ARCANE_OPTIONS.map((art, i) => {
                const cfg = ARCANE_ARTS[art];
                return (
                  <button
                    key={art}
                    onClick={() => setSelectedArcane(art)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedArcane === art ? "text-white" : "border-border text-text-muted"
                    }`}
                    style={selectedArcane === art ? { 
                      borderColor: cfg.color + "60", backgroundColor: cfg.color + "25", color: cfg.color 
                    } : undefined}
                  >
                    第{["一","二","三","四","五","六"][i]}式 · {art}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {mode === "solo" && (
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">使徒</label>
            <div className="flex gap-2 flex-1 flex-wrap">
              {TEN_WINGS_APOSTLES.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedSolo(a.id)}
                  className={`px-2 py-1 rounded-lg text-[9px] font-bold border font-mono transition-all ${
                    selectedSolo === a.id
                      ? "bg-primary/10 border-primary/40 text-primary"
                      : "border-border text-text-muted hover:border-primary/20"
                  }`}
                  title={a.name}
                >
                  [{a.id}]
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "matrix" && (
          <>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">主帥</label>
              <div className="flex gap-2 flex-wrap">
                {["06", "07", "08"].map(id => {
                  const a = TEN_WINGS_APOSTLES.find(x => x.id === id)!;
                  return (
                    <button key={id} onClick={() => setLeadApostle(id)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                        leadApostle === id ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-text-muted"
                      }`}
                    >
                      [{a.id}] {a.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0">支柱</label>
              <div className="flex gap-2">
                {["真", "善", "美", "信", "通"].map(p => (
                  <button
                    key={p}
                    onClick={() => togglePillar(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-black border transition-all ${
                      matrixPillars.includes(p)
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-text-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Task Input */}
        <div className="flex items-start gap-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-16 flex-shrink-0 mt-2.5">任務</label>
          <textarea
            value={task}
            onChange={e => setTask(e.target.value)}
            placeholder={
              mode === "arcane" ? "例：實作所有數據組件的 Hash Lock 與 Object.freeze()..." :
              mode === "solo" ? "例：將 Impact Nexus 的卡牌介面升級為液態玻璃質感..." :
              "例：建立 OmniAntigravity 安全遠端通訊隧道..."
            }
            rows={2}
            className="flex-1 bg-bg-base/60 border border-border rounded-xl px-3 py-2 text-xs text-text-main resize-none focus:outline-none focus:border-primary/40 placeholder:text-text-muted/40 transition-colors"
          />
        </div>
      </div>

      {/* ── Dispatch Preview ── */}
      {task.trim() && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl bg-primary/5 border border-primary/20"
        >
          <p className="text-[9px] font-bold text-primary uppercase tracking-widest mb-2">即將指派：</p>
          <div className="flex flex-wrap gap-1.5">
            {getDispatchApostles().map(id => {
              const a = TEN_WINGS_APOSTLES.find(x => x.id === id);
              return a ? (
                <span key={id} className="text-[9px] font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20">
                  [{a.id}] {a.name}
                </span>
              ) : null;
            })}
          </div>
        </motion.div>
      )}

      {/* ── Dispatch Button ── */}
      <Button
        onClick={handleDispatch}
        disabled={!task.trim() || isRunning}
        className={`w-full h-12 font-black text-sm tracking-widest transition-all ${
          isRunning 
            ? "bg-bg-surface border-border text-text-muted cursor-not-allowed"
            : "bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%] hover:bg-right text-white shadow-crystal-optimal"
        }`}
      >
        {isRunning ? (
          <><Activity className="w-4 h-4 mr-2 animate-pulse" /> 使徒執行中...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> 下達天使號令</>
        )}
      </Button>

      {/* ── Mission Report ── */}
      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-3"
          >
            {/* Report Header */}
            <div className={`p-4 rounded-xl border ${
              report.status === "complete" 
                ? "bg-green-500/5 border-green-500/20"
                : report.status === "error"
                ? "bg-red-500/5 border-red-500/20"
                : "bg-primary/5 border-primary/20"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {report.status === "complete" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {report.status === "error" && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  {(report.status === "dispatching" || report.status === "computing") && (
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                  )}
                  <span className="text-xs font-black text-text-main">
                    {report.status === "complete" ? "任務狀態報表 · 已完成" :
                     report.status === "computing" ? "使徒執行中..." : "指派傳達中..."}
                  </span>
                </div>
                <Badge
                  variant={report.status === "complete" ? "optimal" : "lethal"}
                  styleType="soft"
                  className="font-mono text-[9px]"
                >
                  {report.id}
                </Badge>
              </div>

              {report.status === "complete" && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-bg-base/50 border border-border">
                    <p className="text-[8px] text-text-muted uppercase mb-1">熵減成果</p>
                    <p className="text-lg font-black font-mono text-green-500">-{report.entropyReduced}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-bg-base/50 border border-border">
                    <p className="text-[8px] text-text-muted uppercase mb-1">聖典共鳴度</p>
                    <p className="text-lg font-black font-mono text-primary">{report.resonance}%</p>
                  </div>
                  <div className="p-2 rounded-lg bg-bg-base/50 border border-border">
                    <p className="text-[8px] text-text-muted uppercase mb-1">執行使徒</p>
                    <p className="text-lg font-black font-mono text-text-main">{report.apostles.length}名</p>
                  </div>
                </div>
              )}
            </div>

            {/* Pillar Scores */}
            {report.status === "complete" && Object.keys(report.pillarScores).length > 0 && (
              <div className="p-3 rounded-xl bg-bg-surface border border-border">
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mb-2">五T支柱評分</p>
                <div className="space-y-1.5">
                  {Object.entries(report.pillarScores).map(([pillar, score]) => (
                    <div key={pillar} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded w-8 text-center">【{pillar}】</span>
                      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-text-muted w-8 text-right">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execution Log */}
            <div className="p-3 rounded-xl bg-bg-base border border-border font-mono text-[9px] max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
              <p className="text-[8px] font-bold text-text-muted uppercase tracking-widest mb-2">執行日誌</p>
              {report.log.map((entry, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex gap-2 ${
                    entry.type === "success" ? "text-green-500" :
                    entry.type === "warn" ? "text-amber-500" : "text-text-muted"
                  }`}
                >
                  <span className="text-text-muted/40 flex-shrink-0">{entry.time}</span>
                  <span className="text-primary/70 flex-shrink-0">{entry.apostle}</span>
                  <span className="flex-1">{entry.msg}</span>
                </motion.div>
              ))}
              {(report.status === "dispatching" || report.status === "computing") && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-primary"
                >▊ 執行中...</motion.div>
              )}
            </div>

            {/* Vault ID */}
            {report.status === "complete" && report.vaultId && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/5 border border-green-500/15">
                <Lock className="w-3 h-3 text-green-500 flex-shrink-0" />
                <span className="text-[8px] text-text-muted">永恆刻印位置：</span>
                <code className="text-[8px] text-green-500 font-mono truncate flex-1">{report.vaultId}</code>
              </div>
            )}

            {/* Reset */}
            {report.status === "complete" && (
              <Button
                variant="wireframe"
                className="w-full text-xs"
                onClick={() => { setReport(null); setTask(""); }}
              >
                <RotateCcw className="w-3 h-3 mr-2" /> 重置並下達新律令
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
