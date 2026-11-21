"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Leaf, ShieldAlert, Cpu, CheckCircle2, Factory, Link as LinkIcon, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ViewHeader } from "@/components/ui/view-header";
import { sentientBus } from "@/lib/services/sentient-bus";
import { SoulNavigatorLog } from "@/components/ui/soul-navigator-log";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { IComponentCore } from "@/lib/types/esg-core";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/lib/context/app-context";

import { PAGE_GUIDES } from "@/lib/config/guides";

const NODE_DATA = [
  { id: "NODE-1", name: "台積電 (TSMC)", type: "Core", emissions: 12500, risk: "Low", status: "Active", trustHash: "0x88A...9F2", "5t": true, x: 50, y: 20 },
  { id: "NODE-2", name: "ASML", type: "Tier 1", emissions: 8400, risk: "Low", status: "Active", trustHash: "0x3B2...1C4", "5t": true, x: 20, y: 50 },
  { id: "NODE-3", name: "信越化學", type: "Tier 1", emissions: 2200, risk: "Medium", status: "Active", trustHash: "0x7F1...4A2", "5t": true, x: 80, y: 50 },
  { id: "NODE-4", name: "環球晶圓", type: "Tier 2", emissions: 9500, risk: "High", status: "Warning", trustHash: "PENDING", "5t": false, x: 30, y: 80 },
  { id: "NODE-5", name: "某特用化學廠", type: "Tier 2", emissions: 4100, risk: "Critical", status: "Suspended", trustHash: "INVALID", "5t": false, x: 70, y: 80 },
];

const CONNECTIONS = [
  { from: "NODE-2", to: "NODE-1" },
  { from: "NODE-3", to: "NODE-1" },
  { from: "NODE-4", to: "NODE-2" },
  { from: "NODE-5", to: "NODE-3" },
];

export function OmniSupplyView() {
  const { aiProxyMode, lang } = useAppContext();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Stable data for LiquidGlassCard to avoid conditional hook rules
  const liquidCardData = React.useMemo(() => {
    if (!selectedNode) return null;
    return {
      uuid: selectedNode.trustHash || "PENDING",
      version: "v1.0.0-immutable" as const,
      timestamp: 1710580800000, 
      source_origin: selectedNode.name,
      payload: { value: selectedNode.emissions, unit: "tCO2e", label: selectedNode.name },
      evidence: [] as any[],
      traceability_chain: [] as any[]
    };
  }, [selectedNode]);

  const handleVerifyProtocol = (node: any) => {
    setIsVerifying(true);
    // 【真】啟動物理級哈希驗證流程
    setTimeout(() => {
      setIsVerifying(false);
      // 【通】發送驗證成功消息，並通告 SoulNavigator
      sentientBus.emit({ 
        type: 'DATA_SEALED',
        payload: {
          uuid: node.trustHash || `V-${Math.random().toString(36).slice(2, 9)}`,
          source_origin: node.name,
          payload: { 
            value: node.emissions, 
            unit: 'tCO2e', 
            label: `${node.name} [5T-Protocol Verified]`,
            integrity_score: node['5t'] ? 1.0 : 0.98
          }
        } as any
      });
      // Update local node state for the demo
      if (selectedNode?.id === node.id) {
        setSelectedNode({ ...node, "5t": true });
      }
    }, 1200);
  };

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能供應鏈映射" : "Omni Supply Mapping",
    subtitle: "Autonomous Network Intelligence",
    description: lang === "zh" ? "萬能代理：正在自動監測供應鏈流量與數據，確保每一筆轉傳軌跡真實可靠。" : "AI auto-monitoring supply chains and ensuring data integrity with 5T protocol.",
    accent: "from-purple-500/20 to-transparent",
    tag: "SNM",
    icon: Cpu,
    guideSteps: PAGE_GUIDES["omni-supply"]
  } : {
    title: lang === "zh" ? "萬能供應鏈映射" : "Omni Supply Map",
    subtitle: "Network Topology Hub",
    description: lang === "zh" ? "萬能核實：可視化供應鏈拓擺網絡。手動追蹤物料流轉與碳排軌跡，監控節點狀態。" : "Visualizing supply chain topology and manually tracking material flows.",
    accent: "from-[#00FFFF]/20 to-transparent",
    tag: "HUB",
    icon: Network,
    guideSteps: PAGE_GUIDES["omni-supply"]
  };

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/30 p-4 md:p-8 rounded-lg relative overflow-hidden animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'zh' ? '總監測節點數' : 'TOTAL NODES'}</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">1,204</span>
            </div>
            <div className="flex flex-col items-start sm:items-end sm:pl-6 sm:border-l border-slate-200">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">{lang === 'zh' ? '5T 驗證涵蓋率' : '5T COVERAGE'}</span>
              <span className={`text-2xl sm:text-3xl font-black ${aiProxyMode ? 'text-purple-500' : 'text-[#00FFFF]'} font-mono`}>82.5%</span>
            </div>
          </div>
        }
      />

      <SoulNavigatorLog />

      {/* Interactive Map Area (Mock) */}
      <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[400px] md:min-h-[500px] relative overflow-x-auto overflow-y-hidden flex items-center justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,#009E9D_1px,transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-3xl h-[400px]">
            {/* SVG Connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {CONNECTIONS.map((conn, i) => {
                const from = NODE_DATA.find(n => n.id === conn.from);
                const to = NODE_DATA.find(n => n.id === conn.to);
                if (!from || !to) return null;
                return (
                  <line 
                    key={i}
                    x1={`${from.x}%`} 
                    y1={`${from.y}%`} 
                    x2={`${to.x}%`} 
                    y2={`${to.y}%`} 
                    stroke="url(#gradient)" 
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="opacity-40 animate-[dash_20s_linear_infinite]"
                  />
                );
              })}
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#009E9D" />
                  <stop offset="100%" stopColor="#219EBC" />
                </linearGradient>
              </defs>
            </svg>

            {/* Nodes */}
            {NODE_DATA.map((node) => (
              <motion.div
                key={node.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setSelectedNode(node)}
                className={`absolute w-16 h-16 -ml-8 -mt-8 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-lg backdrop-blur-md transition-colors ${
                  node.id === selectedNode?.id ? 'bg-[#009E9D] text-white' : 'bg-white/80 border border-slate-200 text-slate-700 hover:border-[#009E9D]'
                }`}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
              >
                {node.type === 'Core' ? <Cpu className="w-6 h-6" /> : <Factory className="w-5 h-5" />}
                {node['5t'] && (
                  <div className="absolute -top-1 -right-1 bg-primary rounded-full p-0.5 border-2 border-white">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
                {node.risk === 'Critical' && (
                  <div className="absolute -top-1 -right-1 bg-rose-500 rounded-full p-0.5 border-2 border-white animate-pulse">
                    <ShieldAlert className="w-3 h-3 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Node Detail Side Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ y: 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 300, opacity: 0 }}
              className="absolute inset-x-4 bottom-4 lg:inset-y-4 lg:left-auto lg:right-4 h-[60vh] lg:h-auto lg:w-80 bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-5 flex flex-col z-20"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedNode.name}</h3>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedNode.type}</span>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {liquidCardData && (
                  <LiquidGlassCard 
                    data={liquidCardData}
                    isSealed={selectedNode["5t"]}
                    isComputing={isVerifying}
                  />
                )}

                <div className={`p-4 rounded-xl border ${selectedNode['5t'] ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 border-slate-200'}`}>
                  <h4 className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                    {selectedNode['5t'] ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                    Supply Protocol Verification
                  </h4>
                  <div className="text-xs text-slate-500 leading-relaxed mb-3">
                    {selectedNode['5t'] 
                      ? "此節點已完成 5T 協議鎖定，所有數據具備完整溯源鏈。" 
                      : "此節點尚未進入 5T 協議保護，數據可能存在斷點。建議發起驗證。"}
                  </div>
                  {!selectedNode['5t'] && (
                    <Button 
                      onClick={() => handleVerifyProtocol(selectedNode)}
                      className={`w-full py-2 rounded-lg font-bold text-[10px] tracking-widest ${aiProxyMode ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]' : 'bg-[#009E9D]'}`}
                      disabled={isVerifying}
                    >
                      {isVerifying ? "正在建立加密通道..." : "發起 5T 哈希驗證"}
                    </Button>
                  )}
                </div>
              </div>

              <Button 
                variant="solid" 
                className={`mt-4 w-full font-bold ${aiProxyMode ? 'bg-[#8B5CF6] hover:bg-[#7C3AED]' : 'bg-[#009E9D] hover:bg-[#219EBC]'}`}
              >
                {lang === 'zh' ? '展開次級節點 (Deep Dive)' : 'Expand Sub-Nodes'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
