"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ViewHeader } from "@/components/ui/view-header";
import { esgMetricsApi } from "@/lib/ncb-service";
import { IEsgMetric } from "@/shared/types";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import {
  Activity,
  Leaf,
  Users,
  Shield,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { DataOrchestrator } from "@/lib/services/esg/DataOrchestrator";
import { SpiritOrbGo } from "@/components/ui/spirit-orb-go";
import { FiveTCertificate } from "@/components/ui/digital-certificate";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  "E": "var(--color-primary)",
  "S": "var(--color-accent)",
  "G": "var(--color-status-optimal)",
};

const CATEGORY_ICONS: Record<string, any> = {
  "E": Leaf,
  "S": Users,
  "G": Shield,
};

const CATEGORY_NAMES: Record<string, string> = {
  "E": "Environment",
  "S": "Social",
  "G": "Governance",
};

export function EsgMetricsView() {
  const [metrics, setMetrics] = useState<IEsgMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingGo, setIsProcessingGo] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能智能監測" : "Omni Monitoring",
    subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
    description: lang === "zh" ? "萬能代理：AI 自動監測數據異常，即時彙整各項 ESG 指標。" : "AI agent auto-monitoring data anomalies and aggregating ESG metrics.",
    tag: "[自動]",
    icon: Zap
  } : {
    title: lang === "zh" ? "萬能數據掌控" : "Omni Metrics",
    subtitle: lang === "zh" ? "萬能核實 (Omni Manual Control)" : "Omni Manual Control",
    description: lang === "zh" ? "萬能核實：全面掌控企業永續績效，手動管理核心數據指引。" : "Manually managing core corporate sustainability performance metrics.",
    tag: "[手動]",
    icon: Activity
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await esgMetricsApi.list();
      if (error) throw new Error(error.message || "Failed to fetch metrics");
      setMetrics(data || []);
    } catch (err: any) {
      setError(err.message || "無法載入 ESG 指標數據");
      setMetrics([
        { id: "1", metric_id: "E-01", category: "E", name: "溫室氣體總排放量", unit: "tCO2e", value: 12500, target_value: 12000, year: 2024, status: "AT_RISK" } as IEsgMetric,
        { id: "2", metric_id: "E-02", category: "E", name: "再生能源使用比例", unit: "%", value: 35, target_value: 40, year: 2024, status: "ON_TRACK" } as IEsgMetric,
        { id: "3", metric_id: "S-01", category: "S", name: "員工離職率", unit: "%", value: 12, target_value: 10, year: 2024, status: "AT_RISK" } as IEsgMetric,
        { id: "4", metric_id: "S-02", category: "S", name: "女性主管比例", unit: "%", value: 28, target_value: 30, year: 2024, status: "ON_TRACK" } as IEsgMetric,
        { id: "5", metric_id: "G-01", category: "G", name: "董事會獨立董事比例", unit: "%", value: 33, target_value: 33, year: 2024, status: "ACHIEVED" } as IEsgMetric,
        { id: "6", metric_id: "G-02", category: "G", name: "資安事件發生次數", unit: "次", value: 0, target_value: 0, year: 2024, status: "ACHIEVED" } as IEsgMetric,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoSequence = async () => {
    if (metrics.length === 0) return;
    setIsProcessingGo(true);
    try {
      const result = await DataOrchestrator.executeGoSequence(metrics);
      if (result.certificate) {
        setVerificationResult({
          ...result.certificate,
          _omniHeart: result._omniHeart
        });
        toast.success(lang === "zh" ? "ESG GO 全量驗證成功！" : "ESG GO sequences verified!");
      } else {
        toast.success(lang === "zh" ? "ESG GO 全量驗證完成！" : "ESG GO sequences completed!");
      }
    } catch (err) {
      console.error(err);
      toast.error(lang === "zh" ? "GO 序列執行失敗" : "GO sequence execution failed");
    } finally {
      setIsProcessingGo(false);
    }
  };

  const handleSingleVerify = async (metric: IEsgMetric) => {
    setIsLoading(true);
    try {
      const result = await DataOrchestrator.verifyMetricSingle(metric);
      console.log("Verification Result:", result);
      toast.success(lang === "zh" 
        ? `指標 [${metric.name}] 驗證通過：5T 協議核實成功` 
        : `Metric [${metric.name}] verified: 5T protocol match`);
    } catch (err) {
      console.error(err);
      toast.error(lang === "zh" ? "驗證失敗" : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (metrics.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const report = await DataOrchestrator.generateReport(metrics);
      setGeneratedReport(report);
      toast.success(lang === "zh" ? "ESG 策略報告生成成功" : "ESG strategic report generated");
    } catch (err) {
      console.error(err);
      toast.error(lang === "zh" ? "報告生成失敗，請稍後再試。" : "Report generation failed. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // ⚡ Bolt Optimization: Memoize the filtering operation to prevent O(N) recalculations on every render (e.g. animation frames, hover states)
  // Impact: Reduces main thread blocking during frequent UI interactions
  const filteredMetrics = useMemo(() => {
    return selectedCategory
      ? metrics.filter(m => m.category === selectedCategory)
      : metrics;
  }, [selectedCategory, metrics]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACHIEVED': return <Badge variant="optimal" styleType="soft" className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] uppercase tracking-widest">Achieved</Badge>;
      case 'ON_TRACK': return <Badge variant="optimal" styleType="soft" className="bg-blue-500/10 text-blue-500 border-none font-black text-[9px] uppercase tracking-widest">On Track</Badge>;
      case 'AT_RISK': return <Badge variant="critical" styleType="soft" className="bg-amber-500/10 text-amber-500 border-none font-black text-[9px] uppercase tracking-widest">At Risk</Badge>;
      case 'OFF_TRACK': return <Badge variant="lethal" styleType="soft" className="bg-rose-500/10 text-rose-500 border-none font-black text-[9px] uppercase tracking-widest">Off Track</Badge>;
      default: return <Badge variant="optimal" styleType="soft" className="font-black text-[9px] uppercase tracking-widest">Unknown</Badge>;
    }
  };

  // ⚡ Bolt Optimization: Memoize charting data calculation to avoid array mapping and deep filtering on every render
  // Impact: Caches the resulting complex objects so the BarChart doesn't unnecessarly receive new object references, preventing deeper re-renders.
  const chartData = useMemo(() => {
    return ["E", "S", "G"].map(cat => {
      const catMetrics = metrics.filter(m => m.category === cat);
      const achieved = catMetrics.filter(m => m.status === 'ACHIEVED' || m.status === 'ON_TRACK').length;
      const total = catMetrics.length;
      return {
        name: cat,
        fullName: CATEGORY_NAMES[cat],
        achieved,
        total,
        completionRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
        color: CATEGORY_COLORS[cat]
      };
    });
  }, [metrics]);

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 scale-90 md:scale-100 origin-right">
              <SpiritOrbGo 
                onGo={handleGoSequence} 
                isLoading={isProcessingGo} 
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={fetchMetrics}
                disabled={isLoading || isProcessingGo || isGeneratingReport}
                variant="wireframe"
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-border hover:bg-bg-surface transition-all"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Activity className="w-3.5 h-3.5 mr-2" />}
                Refresh
              </Button>
              <Button 
                onClick={handleGenerateReport}
                disabled={isLoading || isProcessingGo || isGeneratingReport}
                variant="wireframe"
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest border-border hover:bg-bg-surface transition-all"
              >
                {isGeneratingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Shield className="w-3.5 h-3.5 mr-2" />}
                Report
              </Button>
            </div>
          </div>
        }
      />

      {error && !isLoading && (
        <div className="bg-status-lethal/5 border border-status-lethal/10 rounded-xl p-4 flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-status-lethal flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-black text-status-lethal uppercase tracking-widest italic">Node Connection Interrupted</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed italic">
              Unable to sync with NCBDB core. Displaying cached demonstration data. {error}
            </p>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <GlassCard className="p-6 flex flex-col justify-between border-l-2 border-primary shadow-flat">
          <div className="flex items-center justify-between mb-8">
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Total Metrics</span>
            <div className="p-2.5 bg-primary/10 rounded-[2px] shadow-sm">
              <Activity className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-4xl font-black text-text-main italic tracking-tighter">{metrics.length}</h3>
            <p className="text-[10px] font-black text-text-muted mt-1 uppercase tracking-widest italic">KPIs Linked</p>
          </div>
        </GlassCard>

        {chartData.map((data, idx) => {
          const Icon = CATEGORY_ICONS[data.name];
          return (
            <GlassCard 
              key={data.name} 
              className={cn(
                "p-6 flex flex-col justify-between cursor-pointer transition-all border-l-2 shadow-flat group relative overflow-hidden",
                selectedCategory === data.name ? "ring-2 ring-primary bg-primary/[0.02]" : "hover:border-primary/40"
              )}
              style={{ borderLeftColor: data.color }}
              onClick={() => setSelectedCategory(selectedCategory === data.name ? null : data.name)}
            >
              <div className="flex items-center justify-between mb-8 relative z-10">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">{data.fullName}</span>
                <div className="p-2.5 rounded-[2px] shadow-sm" style={{ backgroundColor: `${data.color}20`, color: data.color }}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="relative z-10">
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-text-main italic tracking-tighter">{data.completionRate}%</h3>
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic">Performance</span>
                </div>
                <div className="w-full bg-bg-base h-1.5 rounded-full mt-4 overflow-hidden border border-border/20">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_currentColor]" 
                    style={{ width: `${data.completionRate}%`, backgroundColor: data.color, color: data.color }}
                  />
                </div>
                <div className="flex gap-1 mt-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div 
                      key={i} 
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-500",
                        i <= (data.completionRate / 20) ? "bg-accent shadow-[0_0_4px_var(--color-accent)]" : "bg-border/20"
                      )} 
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] italic">5T ALIGNMENT</span>
                  <span className="text-[9px] font-black text-text-muted italic">{data.achieved} / {data.total} Passed</span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Chart Area */}
        <GlassCard className="p-8 lg:col-span-1 flex flex-col border border-border shadow-flat">
          <div className="mb-8">
            <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Status Matrix</h3>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Normalized KPI achievement distribution</p>
          </div>
          <div className="flex-1 min-h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" opacity={0.3} />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontWeight: 900, fontSize: 10, fontStyle: 'italic' }} width={30} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-primary)', opacity: 0.05 }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '2px', 
                    border: '1px solid var(--color-border)', 
                    boxShadow: 'var(--shadow-elevation-2)' 
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value: any) => [`${value}%`, 'Score']}
                />
                <Bar dataKey="completionRate" radius={[0, 2, 2, 0]} barSize={24}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Metrics List */}
        <GlassCard className="p-0 lg:col-span-2 border border-border shadow-flat flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border bg-bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">
                {selectedCategory ? `${CATEGORY_NAMES[selectedCategory]} Pulse` : 'Omni Performance Ledger'}
              </h3>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Verified sustainability nodes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-48">
                <select
                  value={selectedCategory || "all"}
                  onChange={(e) => setSelectedCategory(e.target.value === "all" ? null : e.target.value)}
                  className="w-full text-[10px] font-black uppercase tracking-widest bg-bg-base border border-border rounded-[2px] px-4 py-2 appearance-none focus:outline-none focus:border-primary italic cursor-pointer shadow-inner"
                >
                  <option value="all">ALL CATEGORIES</option>
                  <option value="E">ENVIRONMENT</option>
                  <option value="S">SOCIAL</option>
                  <option value="G">GOVERNANCE</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                  <Activity className="w-3 h-3" />
                </div>
              </div>
              <Badge variant="optimal" styleType="soft" className="bg-bg-base border-border text-text-muted font-black text-[9px] uppercase tracking-widest px-2 py-1 italic rounded-[1px]">
                {filteredMetrics.length} Nodes
              </Badge>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-surface/30 text-[10px] uppercase font-black tracking-[0.2em] text-text-muted border-b border-border italic">
                  <th className="py-5 px-8">ID / Vector</th>
                  <th className="py-5 px-6">Definition</th>
                  <th className="py-5 px-6 text-right">Telemetry</th>
                  <th className="py-5 px-6 text-right">Threshold</th>
                  <th className="py-5 px-6 text-center">Protocol</th>
                  <th className="py-5 px-8 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-text-muted">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Hydrating data vectors...</span>
                    </td>
                  </tr>
                ) : filteredMetrics.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-text-muted italic opacity-40">
                      <span className="text-[10px] font-black uppercase tracking-widest">No metrics detected in current category</span>
                    </td>
                  </tr>
                ) : (
                  filteredMetrics.map((metric, idx) => (
                    <motion.tr 
                      key={metric.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="hover:bg-primary/[0.02] transition-colors group"
                    >
                      <td className="py-5 px-8">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-1.5 h-6 rounded-full shadow-[0_0_8px_currentColor]" 
                            style={{ color: CATEGORY_COLORS[metric.category], backgroundColor: CATEGORY_COLORS[metric.category] }} 
                          />
                          <span className="font-mono text-[9px] font-black text-text-muted tracking-tighter uppercase">{metric.metric_id || metric.id}</span>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col">
                          <span className="font-black text-text-main text-xs uppercase tracking-tight">{metric.name}</span>
                          <div className="flex gap-0.5 mt-1 opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                            {['真','善','美','信','通'].map((char, i) => (
                              <span key={i} className="text-[7px] font-black bg-bg-base text-text-muted px-1 rounded-[1px] border border-border/50">
                                {char}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-right font-black italic text-text-main text-sm tracking-tighter">
                        {metric.value.toLocaleString()} <span className="text-[9px] text-text-muted not-italic uppercase tracking-widest ml-1">{metric.unit}</span>
                      </td>
                      <td className="py-5 px-6 text-right font-black italic text-text-muted/60 text-sm tracking-tighter">
                        {metric.target_value ? (
                          <>{metric.target_value.toLocaleString()} <span className="text-[9px] not-italic uppercase tracking-widest ml-1">{metric.unit}</span></>
                        ) : '-'}
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className="flex items-center justify-center">
                          {getStatusBadge(metric.status)}
                        </div>
                      </td>
                      <td className="py-5 px-8 text-right">
                        <Button
                          variant="wireframe"
                          onClick={() => handleSingleVerify(metric)}
                          className="opacity-0 group-hover:opacity-100 h-8 px-4 border-primary/20 text-primary hover:bg-primary/10 transition-all font-black text-[9px] uppercase tracking-[0.2em] rounded-[1px]"
                        >
                          Verify
                        </Button>
                      </td>
                    </motion.tr>
                  )))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <AnimatePresence>
        {generatedReport && (
          <StrategicReportPanel 
            report={generatedReport} 
            onClose={() => setGeneratedReport(null)} 
          />
        )}
        
        {verificationResult && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-base/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl relative"
            >
              <FiveTCertificate 
                data={verificationResult} 
                onClose={() => setVerificationResult(null)} 
              />
              <button 
                onClick={() => setVerificationResult(null)}
                className="absolute -top-12 right-0 text-[10px] font-black text-text-muted uppercase tracking-[0.5em] hover:text-text-main transition-colors flex items-center gap-2"
              >
                Close Matrix <Target className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StrategicReportPanel({ report, onClose }: { report: any, onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-base/60 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.98, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.98, y: 10 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-bg-surface/90 backdrop-blur-2xl rounded-[2px] border border-border shadow-2xl flex flex-col relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-status-optimal" />
        
        <div className="p-10 border-b border-border flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Shield className="w-7 h-7 text-primary" />
              <h2 className="text-2xl font-black text-text-main tracking-tight uppercase italic">Strategic Assessment Ledger</h2>
            </div>
            <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] italic opacity-60">Omni Assessment Sequence // JunAiKey Protocol</p>
          </div>
          <Button variant="wireframe" onClick={onClose} className="rounded-[1px] w-12 h-12 p-0 border-border hover:bg-bg-base text-text-muted">
             <XIcon className="w-6 h-6" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-16 custom-scrollbar">
          {/* Summary Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <h3 className="text-sm font-black text-text-main uppercase tracking-[0.3em] italic">Telemetry Overview</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(report.summary.overview.category_averages).map(([key, value]: [string, any]) => (
                <GlassCard key={key} className="p-8 bg-bg-base border border-border shadow-flat group">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 italic group-hover:text-primary transition-colors">{key} Coefficient</p>
                  <p className="text-4xl font-black text-text-main italic tracking-tighter">{(value as number * 100).toFixed(1)}%</p>
                  <div className="w-full h-1 bg-border/20 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${value * 100}%` }} />
                  </div>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Analysis Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-accent rounded-full" />
              <h3 className="text-sm font-black text-text-main uppercase tracking-[0.3em] italic">Omni Assessment Logic</h3>
            </div>
            <div className="bg-bg-base rounded-[2px] p-10 border border-border shadow-inner relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-primary" />
              </div>
              <pre className="whitespace-pre-wrap font-sans text-text-main leading-relaxed font-bold text-sm relative z-10">
                {report.analysis}
              </pre>
            </div>
          </section>

          {/* Signature Section */}
          <section className="flex flex-col md:flex-row items-center justify-between p-10 bg-bg-base/50 rounded-[1px] border border-border shadow-flat gap-8">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[2px] bg-bg-base shadow-inner flex items-center justify-center border border-border relative">
                 <div className="absolute inset-0 bg-primary/5 animate-pulse" />
                <Shield className="w-10 h-10 text-primary relative z-10" />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-muted tracking-widest uppercase italic opacity-60">Validator Sequence</p>
                <p className="text-xl font-black text-text-main tracking-tighter uppercase italic mt-1">{report.signature.validator}</p>
                <p className="text-[9px] font-mono font-bold text-text-muted mt-2 break-all opacity-40">{report.signature.hash}</p>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-end gap-3">
              <Badge variant="optimal" styleType="solid" className="px-6 py-2 rounded-[1px] bg-status-optimal text-white border-none font-black text-[10px] uppercase tracking-[0.3em] italic">Authenticated</Badge>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-widest italic opacity-60">Timestamp: {new Date(report.timestamp).toLocaleString()}</p>
            </div>
          </section>
        </div>

        <div className="p-8 border-t border-border bg-bg-surface flex justify-center">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.6em] italic opacity-40">5T PROTOCOL: REAL-TIME SUSTAINABILITY ORCHESTRATION</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
