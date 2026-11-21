"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ViewHeader } from "@/components/ui/view-header";
import { 
  ShieldCheck, 
  Database, 
  Search, 
  Activity, 
  Zap, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Network,
  Fingerprint,
  Table,
  Terminal,
  Cpu,
  History,
  FileSearch,
  Key
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { cn } from "@/lib/utils";

// Mock data for verification trail
const VERIFICATION_TRAIL = [
  {
    id: "TR-001",
    action: "FSC Indicator Sync",
    status: "Verified",
    timestamp: "2026-03-18 10:24:12",
    actor: "OmniAI Agent",
    hash: "0x7d2...aef9",
    confidence: 99.8
  },
  {
    id: "TR-002",
    action: "Scope 2 Emission Cross-Check",
    status: "Optimal",
    timestamp: "2026-03-18 09:15:45",
    actor: "Gnosis Core",
    hash: "0x12a...bc4e",
    confidence: 100
  },
  {
    id: "TR-003",
    action: "Supply Chain Voucher Probe",
    status: "Warning",
    timestamp: "2026-03-17 16:40:22",
    actor: "Rune Forge",
    hash: "0xef3...921d",
    confidence: 84.5
  }
];

export function OmniTruthView() {
  const { aiProxyMode, lang } = useAppContext();
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeProtocol, setActiveProtocol] = useState<number | null>(null);

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能數據核驗 (Omni QA)" : "Omni Data Verification",
    subtitle: "5T Trust & Integrity Protocol",
    description: lang === "zh" ? "全域代理校驗模式。系統正透過 ADK 代理執行 5T 信任核合，確保數據具備物理層級的真實性。" : "Global proxy verification mode. System is executing 5T trust reconciliation via ADK agents.",
    accent: "from-status-optimal/20 to-transparent",
    tag: "QA_PROXY",
    icon: ShieldCheck,
    guideSteps: PAGE_GUIDES["omni-truth"]
  } : {
    title: lang === "zh" ? "數據真信核實" : "Data Integrity Audit",
    subtitle: "Omni Manual Verification",
    description: lang === "zh" ? "手動數據審計模式。執行跨時序數據校準與 5T 核實，手動封裝核驗結果。" : "Manual data audit mode. Executing cross-chronology calibration and 5T verification.",
    accent: "from-primary/20 to-transparent",
    tag: "QA_MANUAL",
    icon: FileSearch,
    guideSteps: PAGE_GUIDES["omni-truth"]
  };

  const handleStartVerification = () => {
    setIsVerifying(true);
    setTimeout(() => setIsVerifying(false), 3000);
  };

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Kernel Integrity score</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-status-optimal italic">99.98%</span>
                <div className="w-2 h-2 rounded-full bg-status-optimal animate-pulse" />
              </div>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. 5T Integrity Protocol Matrix */}
        <GlassCard className="lg:col-span-2 p-8 flex flex-col border border-border bg-bg-surface/50 shadow-flat">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-text-main italic uppercase tracking-wider flex items-center gap-3">
                <Network className="w-5 h-5 text-primary" />
                5T Integrity Protocol Matrix
              </h2>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mt-1 opacity-60 italic">
                Cross-Verification Grid - Live Telemetry
              </p>
            </div>
            <Button 
              variant="solid" 
              onClick={handleStartVerification}
              disabled={isVerifying}
              className="h-10 px-6 text-[10px] font-black uppercase tracking-widest italic"
            >
              {isVerifying ? <Cpu className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              {isVerifying ? "Verifying..." : "init full sync"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {[
              { id: 1, name: "Truth (真)", status: "Optimal", desc: "Data matches origin source", icon: Fingerprint, color: "text-status-optimal" },
              { id: 2, name: "Goodness (善)", status: "Verified", desc: "Value creates ESG impact", icon: CheckCircle2, color: "text-primary" },
              { id: 3, name: "Beauty (美)", status: "Synced", desc: "Visual structure compliant", icon: Table, color: "text-accent" },
              { id: 4, name: "Trust (信)", status: "Locked", desc: "Cryptographically immutable", icon: ShieldCheck, color: "text-status-lethal" },
              { id: 5, name: "Flow (通)", status: "Active", desc: "ArvoAgent delivery active", icon: Activity, color: "text-status-optimal" }
            ].map((p, idx) => (
              <div 
                key={p.id}
                onMouseEnter={() => setActiveProtocol(idx)}
                onMouseLeave={() => setActiveProtocol(null)}
                className={cn(
                  "p-6 rounded-[2px] border transition-all duration-300 cursor-pointer group flex flex-col justify-between h-40",
                  activeProtocol === idx ? "bg-bg-base border-primary shadow-flat shadow-primary/10" : "bg-bg-surface/30 border-border/50 hover:border-primary/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-bold text-text-muted uppercase tracking-[0.2em] italic">{p.status}</p>
                  <p.icon className={cn("w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity", p.color)} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-text-main italic tracking-tight">{p.name}</h3>
                  <p className="text-[10px] text-text-muted mt-1 leading-relaxed italic">{p.desc}</p>
                </div>
              </div>
            ))}
            <div className="bg-text-main p-6 flex flex-col justify-center items-center text-center gap-4 group cursor-pointer hover:bg-text-main/90 transition-all border border-text-main overflow-hidden relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.1),_transparent)] opacity-50" />
              <Terminal className="w-8 h-8 text-bg-base relative z-10" />
              <div className="relative z-10">
                <h4 className="text-sm font-black text-bg-base uppercase tracking-widest italic">Open QA Console</h4>
                <p className="text-[9px] text-bg-base/60 mt-1 uppercase tracking-widest font-bold">Deep probe telemetry</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* 2. Verification Trail (Right Column) */}
        <GlassCard className="p-8 flex flex-col border border-border bg-bg-surface/50 shadow-flat max-h-[100%] overflow-hidden">
          <div className="mb-8">
            <h2 className="text-xl font-black text-text-main italic uppercase tracking-wider flex items-center gap-3">
              <History className="w-5 h-5 text-[#219EBC]" />
              Integrity Trail
            </h2>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mt-1 opacity-60 italic">
              Immutable Verification Log
            </p>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {VERIFICATION_TRAIL.map((trail) => (
              <div 
                key={trail.id}
                className="p-5 rounded-[2px] bg-bg-base/40 border border-border/40 hover:border-primary/20 transition-all cursor-crosshair group shadow-inner"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge 
                    variant={trail.status === "Warning" ? "lethal" : "optimal"} 
                    styleType="soft"
                    className="text-[8px] font-black px-2 py-0.5"
                  >
                    {trail.status}
                  </Badge>
                  <span className="text-[9px] font-mono text-text-muted/60">{trail.timestamp}</span>
                </div>
                <h4 className="text-xs font-black text-text-main uppercase tracking-tight italic mb-1">{trail.action}</h4>
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/10">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-text-muted uppercase font-bold tracking-widest italic">Actor</span>
                    <span className="text-[9px] font-black text-primary italic">{trail.actor}</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[8px] text-text-muted uppercase font-bold tracking-widest italic">Proof Hash</span>
                    <span className="text-[9px] font-mono text-text-muted truncate">{trail.hash}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[8px] text-text-muted uppercase font-bold tracking-widest italic">Conf</span>
                    <span className="text-[9px] font-black text-text-main">{trail.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-center">
            <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic hover:underline flex items-center gap-2">
              <Key className="w-3 h-3" />
              Sync Private Ledger
            </button>
          </div>
        </GlassCard>

      </div>

      {/* 3. Deep Verification Matrix Section */}
      <GlassCard className="mt-8 p-10 border border-border bg-bg-base/40 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          <div className="md:col-span-1 space-y-6">
             <div className="w-12 h-12 rounded-[2px] bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
             </div>
             <div>
                <h3 className="text-2xl font-black text-text-main italic uppercase tracking-tighter">NCBDB Probe</h3>
                <p className="text-xs text-text-muted mt-2 leading-relaxed italic font-medium">
                  Direct telemetry from Natural Capital Blockchain Database. All records are cryptographically sealed.
                </p>
             </div>
             <Button variant="wireframe" className="w-full h-11 text-[10px] font-black uppercase tracking-widest italic border-border">
                Re-initialize Node
             </Button>
          </div>

          <div className="md:col-span-3">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic border-b border-border">
                      <th className="pb-4 pr-4">Metric Origin</th>
                      <th className="pb-4 px-4 text-center">Protocol Level</th>
                      <th className="pb-4 px-4">Verification Score</th>
                      <th className="pb-4 px-4">Last Response</th>
                      <th className="pb-4 pl-4 text-right">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {[
                      { name: "Environmental (E) - Carbon", level: "L1_SEALED", score: 99.8, time: "4ms ago", status: "Optimal" },
                      { name: "Social (S) - Diversity", level: "L2_VERIFIED", score: 94.2, time: "12ms ago", status: "Optimal" },
                      { name: "Governance (G) - Audit", level: "L1_SEALED", score: 100, time: "2ms ago", status: "Optimal" },
                      { name: "Supply Chain (SC) - Labor", level: "L3_PENDING", score: 82.5, time: "450ms ago", status: "Warning" }
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-bg-surface/50 transition-colors">
                        <td className="py-6 pr-4 font-black italic text-xs text-text-main">{row.name}</td>
                        <td className="py-6 px-4 text-center">
                          <code className="text-[9px] font-mono bg-bg-surface px-2 py-1 border border-border rounded-[1px] text-text-muted">{row.level}</code>
                        </td>
                        <td className="py-6 px-4">
                           <div className="w-full bg-border/20 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", row.score > 90 ? "bg-status-optimal" : "bg-status-lethal")}
                                style={{ width: `${row.score}%` }}
                              />
                           </div>
                        </td>
                        <td className="py-6 px-4 font-mono text-[10px] text-text-muted/60 italic">{row.time}</td>
                        <td className="py-6 pl-4 text-right text-[10px] font-black uppercase italic text-primary">
                          {row.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      </GlassCard>

    </div>
  );
}


