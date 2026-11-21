"use client";

import { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Loader2, 
  AlertCircle, 
  Info,
  Leaf,
  Users,
  Building2,
  Zap
} from "lucide-react";
import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";
import { cn } from "@/lib/utils";
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  ReferenceArea
} from "recharts";
import { materialityApi, MaterialityTopic } from "@/lib/ncb-service";

// Mock data as fallback
const MOCK_TOPICS: MaterialityTopic[] = [
  { id: "1", topic_name: "溫室氣體排放", category: "E", business_impact: 9.2, stakeholder_importance: 9.5, description: "減少範疇一、二、三的碳排放量" },
  { id: "2", topic_name: "能源管理", category: "E", business_impact: 8.5, stakeholder_importance: 8.0, description: "提升能源使用效率與再生能源比例" },
  { id: "3", topic_name: "水資源管理", category: "E", business_impact: 6.5, stakeholder_importance: 7.2, description: "水資源回收與節水措施" },
  { id: "4", topic_name: "廢棄物管理", category: "E", business_impact: 7.0, stakeholder_importance: 7.5, description: "推動循環經濟與廢棄物減量" },
  { id: "5", topic_name: "員工健康與安全", category: "S", business_impact: 8.8, stakeholder_importance: 9.0, description: "提供安全的工作環境與健康照護" },
  { id: "6", topic_name: "人才吸引與留任", category: "S", business_impact: 9.0, stakeholder_importance: 8.5, description: "具競爭力的薪酬與職涯發展" },
  { id: "7", topic_name: "多元與包容 (DEI)", category: "S", business_impact: 6.0, stakeholder_importance: 7.8, description: "建立多元平等的職場文化" },
  { id: "8", topic_name: "供應鏈勞工權益", category: "S", business_impact: 7.5, stakeholder_importance: 8.2, description: "確保供應商遵守勞動人權規範" },
  { id: "9", topic_name: "商業道德與誠信", category: "G", business_impact: 9.5, stakeholder_importance: 9.2, description: "反貪腐、反賄賂與道德行為準則" },
  { id: "10", topic_name: "資訊安全與隱私", category: "G", business_impact: 9.8, stakeholder_importance: 9.6, description: "保護客戶與公司機密資料" },
  { id: "11", topic_name: "風險管理", category: "G", business_impact: 8.5, stakeholder_importance: 8.0, description: "企業營運風險辨識與控管" },
  { id: "12", topic_name: "創新與研發", category: "G", business_impact: 8.0, stakeholder_importance: 7.0, description: "持續投入綠色技術與產品創新" },
];

const CATEGORY_COLORS = {
  E: "var(--color-primary)",
  S: "var(--color-accent)",
  G: "var(--color-status-optimal)",
};

const CATEGORY_ICONS = {
  E: Leaf,
  S: Users,
  G: Building2,
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const Icon = CATEGORY_ICONS[data.category as keyof typeof CATEGORY_ICONS];
    
    return (
      <GlassCard className="p-4 border border-border shadow-elevation-2 min-w-[200px] bg-bg-surface/90 backdrop-blur-xl rounded-[2px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-[2px]" style={{ backgroundColor: `${CATEGORY_COLORS[data.category as keyof typeof CATEGORY_COLORS]}15` }}>
            <Icon className="w-4 h-4" style={{ color: CATEGORY_COLORS[data.category as keyof typeof CATEGORY_COLORS] }} />
          </div>
          <p className="font-black text-text-main text-[11px] uppercase tracking-tight italic">{data.topic_name}</p>
        </div>
        <div className="space-y-2 text-[10px] font-black uppercase tracking-widest text-text-muted italic">
          <div className="flex justify-between">
            <span>Impact (X):</span>
            <span className="font-mono text-text-main">{data.business_impact.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span>Importance (Y):</span>
            <span className="font-mono text-text-main">{data.stakeholder_importance.toFixed(1)}</span>
          </div>
        </div>
        {data.description && (
          <p className="mt-4 text-[9px] text-text-muted leading-relaxed border-t border-border pt-3 italic font-bold">
            {data.description}
          </p>
        )}
      </GlassCard>
    );
  }
  return null;
};

const MATRIX_CATEGORIES = ["ALL", "E", "S", "G"] as const;

export function MaterialityMatrixView() {
  const [topics, setTopics] = useState<MaterialityTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"ALL" | "E" | "S" | "G">("ALL");
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode ? {
    title: lang === "zh" ? "萬能重大性矩陣" : "Omni Matrix",
    subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
    description: lang === "zh" ? "萬能代理：自動分析利害關係人關注點，自主鎖定關鍵議題。" : "AI agent auto-analyzing stakeholder concerns and identifying core issues.",
    tag: "[自動]",
    icon: Zap,
    quadrants: ["AI TARGET", "AI MONITOR"]
  } : {
    title: lang === "zh" ? "萬能重大性矩陣" : "Omni Matrix",
    subtitle: lang === "zh" ? "萬能核實 (Omni Manual Control)" : "Omni Manual Control",
    description: lang === "zh" ? "萬能核實：手動映射財務衝擊與社會影響，鎖定核心發展路徑。" : "Manually mapping financial impact and social influence to define core paths.",
    tag: "[手動]",
    icon: Target,
    quadrants: ["HIGH-IMPACT", "STANDARD"]
  };

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await materialityApi.list();
        
        if (error || !data || data.length === 0) {
          setTopics(MOCK_TOPICS);
          setUsingMockData(true);
          if (error) setError(error.message || "Failed to fetch from NCBDB");
        } else {
          setTopics(data);
          setUsingMockData(false);
        }
      } catch (err: any) {
        setTopics(MOCK_TOPICS);
        setUsingMockData(true);
        setError(err.message || "Network error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // ⚡ Bolt Optimization: Memoize filtering to prevent O(N) recalculations on unrelated state changes (like window resize/animations)
  // Impact: Reduces CPU cycles during render phase by caching the filtered subset
  const filteredTopics = useMemo(() => {
    return activeCategory === "ALL"
      ? topics
      : topics.filter(t => t.category === activeCategory);
  }, [topics, activeCategory]);

  // ⚡ Bolt Optimization: Extract inline .sort() from JSX to prevent O(N log N) recalculations on every single re-render
  // Impact: Significant improvement in framerate when hovering nodes or triggering React updates
  const sortedFilteredTopics = useMemo(() => {
    return [...filteredTopics].sort((a, b) => (b.business_impact + b.stakeholder_importance) - (a.business_impact + a.stakeholder_importance));
  }, [filteredTopics]);

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex items-center gap-2">
            <Badge variant="optimal" styleType="soft" className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3">
              {topics.length} Nodes
            </Badge>
          </div>
        }
      />

      {error && usingMockData && (
        <div className="bg-status-lethal/5 border border-status-lethal/10 rounded-xl p-4 flex items-start gap-3 mb-8">
          <AlertCircle className="w-5 h-5 text-status-lethal flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-black text-status-lethal uppercase tracking-widest italic">Node Sync Failed</h4>
            <p className="text-[11px] text-text-muted mt-1 leading-relaxed italic">
              Displaying simulated materiality vectors from local cache. {error}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <GlassCard className="lg:col-span-2 p-8 flex flex-col min-h-[550px] border border-border shadow-flat relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Materiality Distribution Matrix</h3>
              <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Mapping Business Impact vs Stakeholder Importance</p>
            </div>
            
            <div className="flex bg-bg-base p-1 rounded-[2px] border border-border shadow-inner">
              {MATRIX_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-[1px] transition-all italic ${
                    activeCategory === cat
                      ? "bg-primary text-white shadow-flat"
                      : "text-text-muted hover:text-text-main"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Calculating node positions...</span>
            </div>
          ) : (
            <div className="flex-1 w-full relative">
              {/* Quadrant Labels */}
              <div className="absolute top-4 right-4 text-[9px] font-black text-status-lethal uppercase tracking-[0.2em] bg-bg-base/80 px-3 py-1.5 rounded-[1px] border border-status-lethal/20 z-10 pointer-events-none backdrop-blur-md italic">
                {branding.quadrants[0]}
              </div>
              <div className="absolute bottom-12 left-12 text-[9px] font-black text-text-muted uppercase tracking-[0.2em] bg-bg-base/80 px-3 py-1.5 rounded-[1px] border border-border z-10 pointer-events-none backdrop-blur-md italic">
                {branding.quadrants[1]}
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                  
                   {/* Quadrant Backgrounds */}
                  <ReferenceArea x1={5} x2={10} y1={5} y2={10} fill="var(--color-primary)" fillOpacity={0.03} />
                  <ReferenceArea x1={0} x2={5} y1={0} y2={5} fill="var(--color-text-muted)" fillOpacity={0.02} />
                  
                  {/* Axes */}
                  <XAxis 
                    type="number" 
                    dataKey="business_impact" 
                    name="Impact" 
                    domain={[0, 10]} 
                    tickCount={6}
                    stroke="var(--color-border)"
                    tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontWeight: 900, fontStyle: 'italic' }}
                    label={{ value: 'BUSINESS IMPACT VECTOR', position: 'bottom', offset: 20, fontSize: 10, fill: "var(--color-text-muted)", fontWeight: 900, letterSpacing: '0.2em', fontStyle: 'italic' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="stakeholder_importance" 
                    name="Importance" 
                    domain={[0, 10]} 
                    tickCount={6}
                    stroke="var(--color-border)"
                    tick={{ fontSize: 10, fill: "var(--color-text-muted)", fontWeight: 900, fontStyle: 'italic' }}
                    label={{ value: 'STAKEHOLDER IMPORTANCE VECTOR', angle: -90, position: 'insideLeft', offset: -10, fontSize: 10, fill: "var(--color-text-muted)", fontWeight: 900, letterSpacing: '0.2em', fontStyle: 'italic' }}
                  />
                  <ZAxis type="number" range={[100, 500]} />
                  
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-primary)', opacity: 0.5 }} />
                  
                  {/* Data Points */}
                  <Scatter name="Topics" data={filteredTopics}>
                    {filteredTopics.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]} 
                        fillOpacity={0.6}
                        stroke={CATEGORY_COLORS[entry.category as keyof typeof CATEGORY_COLORS]}
                        strokeWidth={2}
                        className="transition-all duration-300 hover:fill-opacity-100 cursor-pointer"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* List Section */}
        <GlassCard className="p-0 overflow-hidden flex flex-col h-[550px] border border-border shadow-flat">
          <div className="p-6 border-b border-border bg-bg-surface/50">
            <h3 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic flex items-center gap-3">
              <Info className="w-4 h-4 text-text-muted" />
              Impact Vector Ledger
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-bg-base/30">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredTopics.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-muted p-10 text-center italic opacity-40">
                <Target className="w-8 h-8 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">No nodes in current category</span>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedFilteredTopics.map((topic) => {
                    const Icon = CATEGORY_ICONS[topic.category as keyof typeof CATEGORY_ICONS];
                    const color = CATEGORY_COLORS[topic.category as keyof typeof CATEGORY_COLORS];
                    const isHighPriority = topic.business_impact >= 7.5 && topic.stakeholder_importance >= 7.5;
                    
                    return (
                      <div 
                        key={topic.id}
                        className={cn(
                          "p-4 rounded-[1px] border border-border transition-all shadow-flat relative overflow-hidden group",
                          isHighPriority ? "bg-primary/[0.03] border-primary/20" : "bg-bg-base"
                        )}
                      >
                         <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: color }} />
                        <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-[1px] shadow-sm" style={{ backgroundColor: `${color}15` }}>
                              <Icon className="w-4 h-4" style={{ color }} />
                            </div>
                            <h4 className="text-[11px] font-black text-text-main uppercase tracking-tight italic line-clamp-1" title={topic.topic_name}>
                              {topic.topic_name}
                            </h4>
                          </div>
                          {isHighPriority && (
                            <Badge variant="lethal" styleType="solid" className="text-[8px] px-2 py-0.5 font-black uppercase tracking-widest rounded-[1px] italic">
                              CORE
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                          <div className="bg-bg-base/50 p-3 rounded-[1px] border border-border/50 shadow-inner group-hover:bg-bg-surface transition-colors">
                            <span className="text-[8px] font-black text-text-muted block mb-1 uppercase tracking-widest italic">Impact</span>
                            <span className="text-sm font-black italic text-text-main tracking-tighter">{topic.business_impact.toFixed(1)}</span>
                          </div>
                          <div className="bg-bg-base/50 p-3 rounded-[1px] border border-border/50 shadow-inner group-hover:bg-bg-surface transition-colors">
                            <span className="text-[8px] font-black text-text-muted block mb-1 uppercase tracking-widest italic">Importance</span>
                            <span className="text-sm font-black italic text-text-main tracking-tighter">{topic.stakeholder_importance.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
