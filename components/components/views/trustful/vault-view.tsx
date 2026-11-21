"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lock,
  FileCheck,
  Clock,
  Shield,
  Database,
  Search,
  AlertCircle,
  Loader2,
  ExternalLink,
  X,
  FileText,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { evidenceVaultApi, EvidenceRecord } from "@/lib/ncb-service";
import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";
import { cn } from "@/lib/utils";

export function VaultView() {
  const { aiProxyMode, lang } = useAppContext();
  const [records, setRecords] = useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<EvidenceRecord | null>(
    null,
  );

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能安全存證" : "Omni Vault",
      subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
      description: lang === "zh"
        ? "萬能代理：AI 自動執行數據存證與安全核對，確保萬能數據真實並完成封裝。"
        : "AI agent auto-executing data archiving and security verification.",
      tag: "[自動]",
      icon: Zap
  } : {
      title: lang === "zh" ? "萬能證據庫" : "Omni Evidence Vault",
      subtitle: lang === "zh" ? "萬能手動控制 (Omni Manual Control)" : "Omni Manual Control",
      description: lang === "zh" 
        ? "萬能核實：手動上傳與管理永續資產證據，對接真實資料庫確保不可篡改。"
        : "Manually uploading and managing sustainability evidence.",
      tag: "[手動]",
      icon: Lock
  };

  const MOCK_RECORDS: EvidenceRecord[] = [
    {
      id: "1",
      record_id: "REC-2026-001",
      type: "Carbon Emission Report (Scope 1 & 2)",
      timestamp: new Date().toISOString(),
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      status: "Verified",
      variant: "optimal",
    },
    {
      id: "2",
      record_id: "REC-2026-002",
      type: "Supply Chain Labor Audit",
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      hash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92",
      status: "Pending Audit",
      variant: "critical",
    },
    {
      id: "3",
      record_id: "REC-2026-003",
      type: "Board Diversity Metrics",
      timestamp: new Date(Date.now() - 172800000).toISOString(),
      hash: "36a9e7f1c95b82ffb99743e0c5c4ce95d83c9a430aac59f84ef3cbfab6145068",
      status: "Sealed",
      variant: "optimal",
    },
  ];

  const loadMockData = () => {
    setRecords(MOCK_RECORDS);
    setError(null);
    setUsingMockData(true);
  };

  useEffect(() => {
    async function fetchRecords() {
      try {
        const { data, error: fetchError } = await evidenceVaultApi.list();

        if (fetchError) {
          throw fetchError;
        }
        
        const sortedData = [...(data || [])].sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setRecords(sortedData);
        setIsConfigured(true);
        setUsingMockData(false);
      } catch (err: any) {
        setRecords(MOCK_RECORDS);
        setUsingMockData(true);
        if (err.message && err.message.includes("Failed to fetch")) {
          setError("NODE_CONNECTION_FAILED");
        } else {
          setError(err.message || "UNKNOWN_VAULT_ERROR");
        }
        setIsConfigured(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, []);

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-6">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="SEARCH HASH OR ID..."
                className="bg-bg-base border border-border rounded-[2px] pl-12 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-main focus:outline-none focus:border-primary w-full shadow-inner italic"
              />
            </div>
            <Button variant="wireframe" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-border hover:bg-bg-surface transition-all">
              <Database className="w-4 h-4 mr-2" />
              Verify Chain
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          {
            label: "Total Records",
            value: records.length.toString(),
            icon: Lock,
            color: "text-primary",
          },
          {
            label: "NCBDB Sync",
            value: error ? "Offline" : "Synced",
            icon: Database,
            color: error ? "text-status-lethal" : "text-status-optimal",
          },
          {
            label: "Verify Requests",
            value: "342",
            icon: FileCheck,
            color: "text-accent",
          },
          {
            label: "Kernel Status",
            value: "Secure",
            icon: Shield,
            color: "text-primary",
          },
        ].map((stat, i) => (
          <GlassCard
            key={i}
            className="p-6 flex flex-col justify-between border-l-2 border-primary shadow-flat transition-all group hover:bg-primary/[0.02]"
            style={{ borderLeftColor: stat.color.includes('primary') ? 'var(--color-primary)' : stat.color.includes('status-optimal') ? 'var(--color-status-optimal)' : stat.color.includes('accent') ? 'var(--color-accent)' : 'var(--color-status-lethal)' }}
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">
                {stat.label}
              </span>
              <stat.icon className={cn("w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity", stat.color)} />
            </div>
            <h3 className="text-3xl font-black text-text-main italic tracking-tighter">
              {stat.value}
            </h3>
          </GlassCard>
        ))}
      </div>

      {error && (
        <div className="bg-status-lethal/5 border border-status-lethal/10 rounded-xl p-4 flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-status-lethal flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-black text-status-lethal uppercase tracking-widest italic">NODE_SYNC_INTERRUPTED</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed italic">
              Unable to reach NCBDB network. Displaying cryptographically sealed mock data.
            </p>
          </div>
        </div>
      )}

      <GlassCard
        className="overflow-hidden min-h-[500px] flex flex-col border border-border shadow-flat"
      >
        <div className="p-6 border-b border-border bg-bg-surface/50 flex items-center justify-between">
          <div>
            <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Advanced Telemetry Matrix - NCBDB Vault</h3>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Real-time cryptographic audit trail</p>
          </div>
          <div className="flex items-center gap-4">
            {usingMockData && (
              <Badge variant="lethal" styleType="solid" className="px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-[1px]">DEMO_LAYER</Badge>
            )}
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest flex items-center gap-2 opacity-60 italic">
              <div className={cn("w-1.5 h-1.5 rounded-full", usingMockData ? "bg-status-lethal animate-pulse" : "bg-status-optimal animate-pulse")} />
              {usingMockData ? "PERSISTENT_CACHE" : "LIVE_ORCHESTRATION"}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-6" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Sequencing NCBDB records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center px-4">
              <FileCheck className="w-12 h-12 text-text-muted mb-6 opacity-20" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Zero records detected in current vector</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-surface/30 text-[10px] uppercase font-black tracking-[0.2em] text-text-muted border-b border-border italic">
                  <th className="p-6 pl-8">Record ID</th>
                  <th className="p-6">Evidence Vector</th>
                  <th className="p-6">Timestamp</th>
                  <th className="p-6">SHA-256 Hash</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 pr-8 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-primary/[0.02] transition-colors group"
                  >
                    <td className="p-6 pl-8">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-[11px] font-black italic text-primary hover:underline flex items-center gap-2 tracking-tight uppercase"
                      >
                        {record.record_id}
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-text-main uppercase tracking-tight">{record.type}</span>
                    </td>
                    <td className="p-6">
                       <div className="flex items-center gap-2 text-text-muted opacity-60">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono tracking-tighter">{new Date(record.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-mono text-[9px] text-text-muted/60 group-hover:text-text-main transition-colors tracking-tighter block max-w-[180px] truncate">
                        {record.hash}
                      </span>
                    </td>
                    <td className="p-6">
                      <Badge 
                        variant={record.variant === 'optimal' ? 'optimal' : 'critical'} 
                        styleType="soft"
                        className="text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5 rounded-[1px]"
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="p-6 pr-8 text-right">
                      <Button
                        variant="wireframe"
                        className="h-8 px-4 border-primary/20 text-primary hover:bg-primary/10 transition-all font-black text-[9px] uppercase tracking-[0.2em] rounded-[1px]"
                      >
                        Verify
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>

      {/* Document Snapshot Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-base/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <GlassCard className="w-full max-w-2xl bg-bg-surface/90 backdrop-blur-2xl rounded-[2px] border border-border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              
              <div className="p-8 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-text-main flex items-center gap-3 uppercase italic tracking-widest">
                    <FileText className="w-5 h-5 text-primary" />
                    Document Snapshot Ledger
                  </h3>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mt-1 italic opacity-60">ID: {selectedRecord.record_id}</p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-text-muted hover:text-text-main transition-colors p-2 rounded-[1px] hover:bg-bg-base"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-10 overflow-y-auto flex-1 space-y-12 custom-scrollbar">
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Storage Vector</h4>
                  <div className="bg-bg-base p-4 rounded-[1px] border border-border shadow-inner group transition-all hover:border-primary/30">
                    <a
                      href={`https://ncb.wuzuo.io/vault/${selectedRecord.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-3 text-xs break-all font-mono font-bold tracking-tighter"
                    >
                      https://ncb.wuzuo.io/vault/{selectedRecord.hash}
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                    </a>
                  </div>
                </section>

                <section className="space-y-4">
                   <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Historical Trace (Sealed)</h4>
                    <span className="text-[9px] font-black text-text-muted italic opacity-40 uppercase">{new Date(selectedRecord.timestamp).toISOString()}</span>
                   </div>
                  
                  <div className="border border-border rounded-[1px] p-10 bg-bg-base/50 shadow-inner relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 opacity-[0.05] pointer-events-none group-hover:opacity-10 transition-opacity">
                      <Shield className="w-48 h-48 text-primary" />
                    </div>
                    
                    <div className="space-y-8 relative z-10">
                      <div className="space-y-4">
                        <div className="h-6 bg-border/20 rounded-[1px] w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-border/10 rounded-[1px] w-1/2"></div>
                      </div>
                      
                      <div className="space-y-3 pt-6 border-t border-border/50">
                        <div className="h-3 bg-border/5 rounded-[1px] w-full"></div>
                        <div className="h-3 bg-border/5 rounded-[1px] w-full opacity-80"></div>
                        <div className="h-3 bg-border/5 rounded-[1px] w-5/6 opacity-60"></div>
                        <div className="h-3 bg-border/5 rounded-[1px] w-full opacity-40"></div>
                      </div>

                      <div className="mt-10 pt-6 border-t border-border flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic w-24">Hash Vector:</span>
                           <span className="text-[9px] font-mono text-text-main truncate max-w-[300px]">{selectedRecord.hash}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic w-24">Asset Class:</span>
                           <span className="text-[9px] font-black text-text-main uppercase italic">{selectedRecord.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic w-24">Sync State:</span>
                           <Badge variant="optimal" styleType="solid" className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest h-auto">SEALED_HASH_LOCK</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-border bg-bg-surface flex justify-end gap-4">
                 <Button variant="wireframe" onClick={() => setSelectedRecord(null)} className="rounded-[1px] h-10 px-6 text-[10px] font-black uppercase tracking-widest italic">
                  Close Preview
                </Button>
                <Button variant="solid" onClick={() => setSelectedRecord(null)} className="rounded-[1px] h-10 px-8 text-[10px] font-black uppercase tracking-widest italic">
                  Acknowledge Trace
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
