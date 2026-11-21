"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Loader2, 
  AlertCircle, 
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Leaf,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { ViewHeader } from "@/components/ui/view-header";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { supplyChainApi, SupplyChainVendor } from "@/lib/ncb-service";
import { toast } from "sonner";

// Mock data as fallback
const MOCK_VENDORS: SupplyChainVendor[] = [
  { id: "V001", vendor_name: "台積電 (TSMC)", tier: "Tier 1", compliance_score: 98, carbon_emission: 12500, risk_level: "Low", last_audit_date: "2024-02-15", status: "Active" },
  { id: "V002", vendor_name: "日月光 (ASE)", tier: "Tier 1", compliance_score: 92, carbon_emission: 8400, risk_level: "Low", last_audit_date: "2024-01-20", status: "Active" },
  { id: "V003", vendor_name: "鴻海 (Foxconn)", tier: "Tier 1", compliance_score: 85, carbon_emission: 45000, risk_level: "Medium", last_audit_date: "2023-11-10", status: "Active" },
  { id: "V004", vendor_name: "欣興電子 (Unimicron)", tier: "Tier 2", compliance_score: 78, carbon_emission: 5200, risk_level: "Medium", last_audit_date: "2023-10-05", status: "Active" },
  { id: "V005", vendor_name: "南亞電路板 (Nan Ya PCB)", tier: "Tier 2", compliance_score: 88, carbon_emission: 4100, risk_level: "Low", last_audit_date: "2024-03-01", status: "Active" },
  { id: "V006", vendor_name: "某化學原料廠", tier: "Tier 3", compliance_score: 55, carbon_emission: 12000, risk_level: "High", last_audit_date: "2023-08-12", status: "Under Review" },
  { id: "V007", vendor_name: "某包裝材料廠", tier: "Tier 3", compliance_score: 42, carbon_emission: 800, risk_level: "Critical", last_audit_date: "2023-05-20", status: "Suspended" },
  { id: "V008", vendor_name: "聯發科 (MediaTek)", tier: "Tier 1", compliance_score: 95, carbon_emission: 3200, risk_level: "Low", last_audit_date: "2024-01-15", status: "Active" },
  { id: "V009", vendor_name: "環球晶圓 (GlobalWafers)", tier: "Tier 2", compliance_score: 82, carbon_emission: 9500, risk_level: "Medium", last_audit_date: "2023-12-01", status: "Active" },
  { id: "V010", vendor_name: "某物流運輸公司", tier: "Tier 2", compliance_score: 68, carbon_emission: 15600, risk_level: "High", last_audit_date: "2023-09-30", status: "Under Review" },
];

const RISK_COLORS = {
  Low: "var(--color-status-optimal)",      
  Medium: "var(--color-accent)",   
  High: "var(--color-status-lethal)",     
  Critical: "var(--color-status-lethal)", 
};

const TIER_COLORS = {
  "Tier 1": "var(--color-primary)", 
  "Tier 2": "var(--color-accent)", 
  "Tier 3": "var(--color-status-optimal)", 
};

export function SupplyChainView() {
  const [vendors, setVendors] = useState<SupplyChainVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能供應鏈監測" : "Omni Supply Chain",
    subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
    description: lang === "zh" ? "萬能代理：AI 自動監控供應商合規偏移，即時觸發風險預警與代行稽核。" : "AI agent auto-monitoring vendor compliance and triggering alerts.",
    accent: "text-proxy",
    tag: "[自動]",
    icon: Zap
  } : {
    title: lang === "zh" ? "萬能供應鏈管理" : "Omni Supply Chain",
    subtitle: lang === "zh" ? "萬能核實 (Omni Manual Control)" : "Omni Manual Control",
    description: lang === "zh" ? "萬能核實：追蹤供應商合規狀態與碳排放，構建具備韌性的萬能供應鏈。" : "Tracking vendor compliance and emissions to build a resilient chain.",
    accent: "text-primary",
    tag: "[手動]",
    icon: Truck
  };

  useEffect(() => {
    const fetchVendors = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supplyChainApi.list();
        
        if (error || !data || data.length === 0) {
          setVendors(MOCK_VENDORS);
          setUsingMockData(true);
          if (error) setError(error.message || "Failed to fetch from NCBDB");
        } else {
          setVendors(data);
          setUsingMockData(false);
        }
      } catch (err: any) {
        setVendors(MOCK_VENDORS);
        setUsingMockData(true);
        setError(err.message || "Network error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = v.vendor_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            v.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = tierFilter === "ALL" || v.tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [vendors, searchQuery, tierFilter]);

  const metrics = useMemo(() => {
    const totalVendors = vendors.length;
    const avgCompliance = totalVendors > 0 
      ? vendors.reduce((acc, v) => acc + v.compliance_score, 0) / totalVendors 
      : 0;
    const totalEmissions = vendors.reduce((acc, v) => acc + v.carbon_emission, 0);
    const highRiskCount = vendors.filter(v => v.risk_level === "High" || v.risk_level === "Critical").length;

    const emissionsByTier = [
      { name: "Tier 1", value: vendors.filter(v => v.tier === "Tier 1").reduce((acc, v) => acc + v.carbon_emission, 0) },
      { name: "Tier 2", value: vendors.filter(v => v.tier === "Tier 2").reduce((acc, v) => acc + v.carbon_emission, 0) },
      { name: "Tier 3", value: vendors.filter(v => v.tier === "Tier 3").reduce((acc, v) => acc + v.carbon_emission, 0) },
    ];

    const riskDistribution = [
      { name: "Low", value: vendors.filter(v => v.risk_level === "Low").length },
      { name: "Medium", value: vendors.filter(v => v.risk_level === "Medium").length },
      { name: "High", value: vendors.filter(v => v.risk_level === "High").length },
      { name: "Critical", value: vendors.filter(v => v.risk_level === "Critical").length },
    ].filter(d => d.value > 0);

    return { totalVendors, avgCompliance, totalEmissions, highRiskCount, emissionsByTier, riskDistribution };
  }, [vendors]);

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-2">
            <Badge variant="optimal" styleType="soft" className="font-mono text-[10px] uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none">
              {usingMockData ? "Demo Mode" : "SYNCED"}
            </Badge>
          </div>
        }
      />

      {error && usingMockData && (
        <div className="bg-status-lethal/5 border border-status-lethal/10 rounded-xl p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="w-5 h-5 text-status-lethal flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-black text-status-lethal uppercase tracking-widest italic">DEMO MODE ACTIVE</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed italic">
              Unable to reach NCBDB node. Displaying simulated telemetry data from cache.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <GlassCard className="p-6 flex flex-col justify-between border-l-2 border-primary shadow-flat">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary/10 rounded-[2px] shadow-sm">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] italic">Telemetry</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 italic">Total Vendors</p>
            <h3 className="text-3xl font-black text-text-main italic tracking-tighter">{metrics.totalVendors}</h3>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col justify-between border-l-2 border-status-optimal shadow-flat">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-status-optimal/10 rounded-[2px] shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-status-optimal" />
            </div>
            <div className="flex items-center text-status-optimal text-[10px] font-black bg-status-optimal/10 px-2 py-1 rounded-[2px] tracking-widest italic">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              2.4%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 italic">Avg Compliance</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-text-main italic tracking-tighter">{metrics.avgCompliance.toFixed(1)}</h3>
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">/ 100</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col justify-between border-l-2 border-accent shadow-flat">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-accent/10 rounded-[2px] shadow-sm">
              <Leaf className="w-6 h-6 text-accent" />
            </div>
            <div className="flex items-center text-status-lethal text-[10px] font-black bg-status-lethal/10 px-2 py-1 rounded-[2px] tracking-widest italic">
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              5.2%
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1 italic">Supply Chain tCO2e</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-black text-text-main italic tracking-tighter">{(metrics.totalEmissions / 1000).toFixed(1)}k</h3>
              <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Scope 3</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col justify-between border-l-2 border-status-lethal bg-status-lethal/[0.02] shadow-flat">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-status-lethal/10 rounded-[2px] shadow-sm">
              <ShieldAlert className="w-6 h-6 text-status-lethal" />
            </div>
            <Badge variant="lethal" styleType="solid" className="px-2 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-[2px]">Intervention</Badge>
          </div>
          <div>
            <p className="text-[10px] font-black text-status-lethal/70 uppercase tracking-widest mb-1 italic">Critical Risks</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-status-lethal italic tracking-tighter">{metrics.highRiskCount}</h3>
              <span className="text-[10px] text-status-lethal/60 font-black uppercase tracking-widest italic">Nodes Pending</span>
            </div>
          </div>
          <Button 
            variant="wireframe" 
            className="mt-6 py-2 border-status-lethal/20 text-status-lethal hover:bg-status-lethal/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1px] h-9"
            onClick={() => toast.warning("Initiating high-risk vendor audit process...")}
          >
            Acknowledge
          </Button>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <GlassCard className="p-8 min-h-[400px] flex flex-col relative overflow-hidden group border border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
            <Leaf className="w-4 h-4 text-accent" />
            Emission Allocation Matrix
          </h3>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center relative z-10">
            {isLoading ? (
              <div className="flex w-full h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.emissionsByTier}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {metrics.emissionsByTier.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(TIER_COLORS)[index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          backdropFilter: 'blur(8px)',
                          borderRadius: '2px', 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          boxShadow: 'var(--shadow-elevation-2)' 
                        }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        formatter={(value: any) => [`${value.toLocaleString()} tCO2e`, 'Value']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 pl-0 sm:pl-8 mt-6 sm:mt-0 space-y-4">
                  {metrics.emissionsByTier.map((entry, index) => (
                    <div key={entry.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: Object.values(TIER_COLORS)[index % 3] }} />
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{entry.name}</span>
                        </div>
                        <span className="text-sm font-black text-text-main italic">{(entry.value / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="w-full h-1 bg-bg-base rounded-full overflow-hidden">
                         <div className="h-full bg-primary/20" style={{ width: `${(entry.value / metrics.totalEmissions) * 100}%`, backgroundColor: Object.values(TIER_COLORS)[index % 3] + "40" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8 min-h-[400px] flex flex-col relative overflow-hidden group border border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-status-lethal/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h3 className="text-[11px] font-black text-text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-3 italic">
            <ShieldAlert className="w-4 h-4 text-status-lethal" />
            Supply Chain Risk Distribution
          </h3>
          <div className="flex-1 w-full flex flex-col sm:flex-row items-center relative z-10">
            {isLoading ? (
              <div className="flex w-full h-full items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {metrics.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS]} />
                        ))}
                      </Pie>
                      <Tooltip 
                         contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                          backdropFilter: 'blur(8px)',
                          borderRadius: '2px', 
                          border: '1px solid rgba(0,0,0,0.1)', 
                          boxShadow: 'var(--shadow-elevation-2)' 
                        }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 pl-0 sm:pl-8 mt-6 sm:mt-0 space-y-4">
                  {metrics.riskDistribution.map((entry) => (
                    <div key={entry.name} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: RISK_COLORS[entry.name as keyof typeof RISK_COLORS] }} />
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{entry.name} Risk</span>
                        </div>
                        <span className="text-sm font-black text-text-main italic">{entry.value} Nodes</span>
                      </div>
                      <div className="w-full h-1 bg-bg-base rounded-full overflow-hidden">
                         <div className="h-full" style={{ width: `${(entry.value / metrics.totalVendors) * 100}%`, backgroundColor: RISK_COLORS[entry.name as keyof typeof RISK_COLORS] + "40" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Data Table */}
      <GlassCard className="p-0 overflow-hidden flex flex-col border border-border shadow-flat">
        <div className="p-6 border-b border-border bg-bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Vendor Compliance Ledger</h3>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Real-time audit status across supply chain nodes</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text" 
                placeholder="SEARCH NODES..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest border border-border rounded-[2px] bg-bg-base focus:outline-none focus:border-primary w-full shadow-inner italic"
              />
            </div>
            
            <div className="relative flex-shrink-0 w-40">
              <Filter className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <select 
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="pl-12 pr-8 py-2.5 text-[10px] font-black uppercase tracking-widest border border-border rounded-[2px] bg-bg-base focus:outline-none focus:border-primary appearance-none cursor-pointer w-full italic"
              >
                <option value="ALL">ALL TIERS</option>
                <option value="Tier 1">TIER 1</option>
                <option value="Tier 2">TIER 2</option>
                <option value="Tier 3">TIER 3</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-surface text-[10px] uppercase font-black tracking-[0.2em] text-text-muted border-b border-border italic">
                <th className="p-6 pl-8">Vendor [ID]</th>
                <th className="p-6">Structure</th>
                <th className="p-6">Protocol Score</th>
                <th className="p-6 lowercase tracking-normal">tCO2e Allocation</th>
                <th className="p-6">Risk Vector</th>
                <th className="p-6">Operational</th>
                <th className="p-6 pr-8 text-right">Last Audit (Hash)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-muted">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Compiling supply chain matrix...</span>
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-text-muted">
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">No nodes matching current vector</span>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-primary/[0.02] transition-colors group">
                    <td className="p-6 pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-text-main text-xs uppercase tracking-tight">{vendor.vendor_name}</span>
                        <span className="text-[9px] text-text-muted font-mono tracking-tighter uppercase mt-0.5">{vendor.id}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge variant="optimal" styleType="soft" className="font-black text-[9px] uppercase tracking-widest bg-bg-base border-border text-text-muted px-2 py-0.5 rounded-[1px]">
                        {vendor.tier}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1 bg-bg-base rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${vendor.compliance_score}%`,
                              backgroundColor: vendor.compliance_score >= 80 ? 'var(--color-status-optimal)' : vendor.compliance_score >= 60 ? 'var(--color-accent)' : 'var(--color-status-lethal)'
                            }}
                          />
                        </div>
                        <span className="text-xs font-black text-text-main italic">{vendor.compliance_score}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-text-main italic">{vendor.carbon_emission.toLocaleString()}</span>
                    </td>
                    <td className="p-6">
                      <Badge 
                        variant={vendor.risk_level === 'Low' ? 'optimal' : vendor.risk_level === 'Medium' ? 'optimal' : 'lethal'} 
                        styleType="soft"
                        className="text-[9px] font-black uppercase tracking-widest border-none px-2 py-0.5 rounded-[1px]"
                      >
                        {vendor.risk_level}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${
                          vendor.status === 'Active' ? 'text-status-optimal' : 
                          vendor.status === 'Under Review' ? 'text-accent' : 'text-status-lethal'
                        }`} />
                        <span className="text-[10px] text-text-muted font-black uppercase tracking-widest italic">{vendor.status}</span>
                      </div>
                    </td>
                    <td className="p-6 pr-8 text-right">
                      <div className="flex items-center justify-end gap-2 text-text-muted opacity-60">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-mono tracking-tighter">{vendor.last_audit_date}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
