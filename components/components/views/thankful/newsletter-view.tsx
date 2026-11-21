"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  Mail, 
  Calendar, 
  BookOpen, 
  Lightbulb, 
  Newspaper, 
  UserCheck, 
  Search,
  ChevronRight,
  Download,
  Share2,
  Edit,
  ArrowLeft,
  Plus,
  Zap,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { communityApi } from "@/lib/ncb-service";
import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";
import { cn } from "@/lib/utils";

const NEWSLETTER_CATEGORIES = [
  { id: "all", label: "All Items", icon: Newspaper },
  { id: "monthly", label: "Monthly Report", icon: Mail },
  { id: "thinktank", label: "Think Tank", icon: Lightbulb },
  { id: "events", label: "Events", icon: Calendar },
  { id: "prophet", label: "Prophet", icon: UserCheck },
  { id: "announcement", label: "Announcements", icon: Newspaper },
];

const NEWSLETTERS = [
  {
    id: "2026-03",
    title: "ESG Sunshine 善向永續 - 2026年3月號專刊",
    subtitle: "美以打擊伊朗升溫：能源與航運風險如何重定價？",
    date: "2026-03-01",
    category: "monthly",
    author: "楊坤修 博士",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCjWNMMT-TEcmkbdf0Si_iM72l8HxNPFpmITyCqGuMlH3iYaM8XpyC8jLHg-vifmDsHVt3nSFMkANsHGipV8Rb2Bs55uMK7ojV5ZAnfpMWCdA8hrlPXIzY6YsvNLz97ZJ1qUnYzVPLL8yLCh1W0oTYlnIAAvVkIQLvVQKQFUI9T0hQLVWjN6lsss_15Qjfadd64rP2zUNkFIIP3EWWGDFUgiGUlFx70V0ixIndMtUmEpG2ThynwsiEqFkAf_qwl242o10CrPX8P2Q",
    isFeatured: true,
  },
  {
    id: "thinktank-1",
    title: "超越合規：創價型 ESG 的崛起",
    subtitle: "顧問洞悉：為什麼「少做惡」已不夠？企業如何透過社會影響力創造價值？",
    date: "2026-03-05",
    category: "thinktank",
    author: "善向研究中心",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "prophet-1",
    title: "先知饋送：AI 與永續數據的深貫廣通",
    subtitle: "未來十年，AI 將如何重塑溫室氣體核算與供應鏈透明度？",
    date: "2026-03-10",
    category: "prophet",
    author: "AI 先知系統",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "course-1",
    title: "ESG 策略規劃師認證班",
    subtitle: "認證課程：精準掌握國際準則，建立企業轉型實戰能力。",
    date: "2026-04-10",
    category: "events",
    author: "教育中心",
    image: "https://images.unsplash.com/photo-1524178232363-1fb28f74b671?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "announcement-1",
    title: "善向永續官網改版公告",
    subtitle: "公告：全新互動式智庫平台正式上線，提供更及時的 ESG 資訊。",
    date: "2026-03-12",
    category: "announcement",
    author: "系統管理員",
    image: "https://images.unsplash.com/photo-1454165833767-027ffea7025c?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "event-1",
    title: "2026 永續領袖高峰會",
    subtitle: "講座資訊：報名開跑！與全球 ESG 先鋒對話，共創淨零未來。",
    date: "2026-03-15",
    category: "events",
    author: "活動小組",
    image: "https://images.unsplash.com/photo-1540575861501-7ad060e1c27b?auto=format&fit=crop&q=80&w=800",
  }
];

export function NewsletterView() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<typeof NEWSLETTERS[0] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbNewsletters, setDbNewsletters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能智能報訊" : "Omni Newsletter",
      subtitle: lang === "zh" ? "萬能代理 (Omni AI Agent)" : "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：AI 自主監控全球永續法規與風險動態，自動聚合關鍵洞見供您參考。" : "AI agent auto-aggregating global regulatory changes and sustainability insights.",
      tag: "[自動]",
      icon: Zap
  } : {
      title: lang === "zh" ? "萬能脈動報訊" : "Omni Newsletter",
      subtitle: lang === "zh" ? "萬能核實 (Omni Manual Control)" : "Omni Manual Control",
      description: lang === "zh" ? "萬能核實：匯集全球永續動態與深度洞見，為企業決策提供清晰的實作路徑。" : "Gathering global sustainability dynamics and deep insights for SMEs.",
      tag: "[手動]",
      icon: Mail
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await communityApi.listPosts();
        if (data && data.length > 0) {
          const mapped = data.map(post => ({
            id: post.id,
            title: post.title,
            subtitle: post.content.substring(0, 100) + "...",
            date: post.created_at.split('T')[0],
            category: post.category || "announcement",
            author: post.author_id === "1" ? "楊坤修 博士" : "社群成員",
            image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
            content: post.content
          }));
          setDbNewsletters(mapped);
        }
      } catch (e) {
        console.error("Failed to fetch community posts", e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const allNewsletters = [...NEWSLETTERS, ...dbNewsletters];

  const filteredNewsletters = allNewsletters.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (selectedArticle) {
    return (
      <div className="view-container animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="wireframe" 
            onClick={() => {
              setSelectedArticle(null);
              setIsEditing(false);
            }}
            className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border-border hover:bg-bg-surface"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Ledger
          </Button>
          <div className="flex gap-3">
             <Button variant="wireframe" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest border-border">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="wireframe" className="h-9 px-4 text-[9px] font-black uppercase tracking-widest border-border">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Button 
              variant="solid"
              className="h-9 px-6 text-[9px] font-black uppercase tracking-widest italic rounded-[1px]"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="w-4 h-4 mr-2" /> {isEditing ? "Finalize" : "Edit Phase"}
            </Button>
          </div>
        </div>

        <GlassCard className="overflow-hidden border border-border shadow-flat bg-bg-surface/50">
          {/* Article Header */}
          <div className="relative h-[450px]">
            <Image 
              src={selectedArticle.image} 
              alt={selectedArticle.title}
              fill
              className="object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/40 to-transparent flex flex-col justify-end p-12">
              <div className="flex items-center gap-4 mb-6">
                <Badge variant="optimal" styleType="solid" className="bg-primary text-white border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 italic rounded-[1px]">
                  {NEWSLETTER_CATEGORIES.find(c => c.id === selectedArticle.category)?.label}
                </Badge>
                <div className="h-px w-12 bg-white/20" />
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">{selectedArticle.date}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-text-main leading-tight tracking-tighter italic uppercase">
                {selectedArticle.title}
              </h1>
              <div className="mt-8 flex items-center gap-6">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[11px] font-black text-text-main uppercase tracking-widest italic">{selectedArticle.author}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-12 md:p-16 bg-bg-base/30 backdrop-blur-md">
            {isEditing ? (
              <div className="space-y-8 max-w-4xl mx-auto">
                <div className="bg-primary/[0.03] border-l-2 border-primary p-6 rounded-[1px] flex items-start gap-4">
                  <Zap className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest italic">Omni Scribe Activated</h4>
                    <p className="text-[10px] font-bold text-text-muted mt-1 uppercase tracking-widest italic leading-relaxed">
                      Editing: <span className="text-primary">{selectedArticle.title}</span>. Content will be cryptographically hashed upon finalization.
                    </p>
                  </div>
                </div>
                
                <div className="border border-border rounded-[1px] overflow-hidden bg-bg-base shadow-inner">
                  <div className="flex items-center justify-between p-4 border-b border-border bg-bg-surface/50">
                    <div className="flex gap-4">
                      <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] italic">Format: ESG_MARKDOWN</span>
                      <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] italic">Node: BROADCAST_MODE</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-primary/40" />)}
                    </div>
                  </div>
                   <textarea 
                    className="w-full h-[600px] p-10 font-mono text-sm bg-transparent border-0 focus:ring-0 outline-none resize-none leading-relaxed text-text-main italic font-bold"
                    placeholder="ENTER ALCHEMY INSIGHT..."
                    defaultValue={selectedArticle.title + "\n\n" + selectedArticle.subtitle + "\n\n..."}
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                <div className="prose prose-slate lg:prose-lg max-w-none text-text-main drop-shadow-sm">
                  <div className="bg-bg-surface p-8 rounded-[1px] border border-border mb-12 italic text-text-muted text-lg font-bold leading-relaxed shadow-sm border-l-2 border-l-accent">
                    {selectedArticle.subtitle}
                  </div>
                  
                   <h2 className="text-2xl font-black text-text-main mb-8 flex items-center gap-4 uppercase italic tracking-tight">
                    <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_10px_var(--color-primary)]" />
                    Strategic Perspective Ledger
                  </h2>
                  
                  <p className="text-lg font-bold leading-relaxed mb-10 text-text-main/80 italic">
                    The intersection of geopolitical volatility and corporate sustainability mandates a total rethink of supply chain resilience. Under the 5T protocol, we define this as the &quot;Resilience Matrix Integration.&quot;
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <GlassCard className="p-8 border border-border bg-bg-surface/50 shadow-flat">
                      <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 italic">Vector: GEOPOLITICAL_RISK</h4>
                      <p className="text-[11px] font-bold text-text-muted italic leading-relaxed">Systemic shocks to primary infrastructure in the Middle East have triggered a 300% surge in localized insurance coefficients.</p>
                    </GlassCard>
                    <GlassCard className="p-8 border border-border bg-bg-surface/50 shadow-flat">
                      <h4 className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-4 italic">Vector: ENERGY_INDEPENDENCE</h4>
                      <p className="text-[11px] font-bold text-text-muted italic leading-relaxed">Diversification away from fossil-centric grids is no longer a climate goal; it is a fundamental survival mandate.</p>
                    </GlassCard>
                  </div>

                  <div className="bg-text-main p-12 rounded-[1px] mb-16 shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-6 opacity-10">
                        <Zap className="w-24 h-24 text-accent" />
                     </div>
                    <h4 className="text-accent font-black mb-8 flex items-center gap-3 uppercase tracking-[0.4em] text-[10px] italic">
                      <Lightbulb className="w-5 h-5" /> Omni Strategic Mandate:
                    </h4>
                    <ul className="space-y-6 text-bg-base/80 text-sm font-bold italic">
                      <li className="flex gap-4">
                        <span className="text-accent font-black">01</span>
                        <span>Re-evaluate geographical footprint: transition to NEAR-SHORE or FRIEND-SHORE models.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-black">02</span>
                        <span>Accelerate grid transition to reduce dependency on high-volatility fossil clusters.</span>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-accent font-black">03</span>
                        <span>Implement dynamic 5T stress testing for all Tier 1-3 supply nodes.</span>
                      </li>
                    </ul>
                  </div>

                   <div className="border-t border-border pt-16 flex flex-col items-center">
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] mb-8 italic opacity-40">End of Transmission // Omni Chronicle</p>
                    <Button variant="solid" className="h-12 px-12 rounded-[1px] font-black uppercase tracking-[0.2em] italic shadow-lg">
                      Secure Full Access
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

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
                placeholder="SEARCH ARCHIVE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-bg-base border border-border rounded-[2px] pl-12 pr-4 py-2 text-[10px] font-black uppercase tracking-widest text-text-main focus:outline-none focus:border-primary shadow-inner italic"
              />
            </div>
            <Button 
              variant="solid"
              className="h-10 px-6 font-black uppercase tracking-widest italic rounded-[1px] shadow-flat"
              onClick={() => {
                const newArticle = {
                  id: `new-${Date.now()}`,
                  title: "NEW ALCHEMY INSIGHT",
                  subtitle: "Awaiting strategic input...",
                  date: new Date().toISOString().split('T')[0],
                  category: "announcement",
                  author: "Omni Scribe",
                  image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
                };
                setDbNewsletters([newArticle, ...dbNewsletters]);
                setSelectedArticle(newArticle);
                setIsEditing(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" /> Publish
            </Button>
          </div>
        }
      />

      {/* Categories Scroller */}
      <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar mb-8">
        {NEWSLETTER_CATEGORIES.map(category => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={cn(
              "flex items-center gap-3 px-8 py-3 rounded-[1px] whitespace-nowrap transition-all duration-300 border italic",
              activeCategory === category.id 
                ? "bg-primary border-primary text-white font-black shadow-flat" 
                : "bg-bg-base text-text-muted hover:border-primary/40 border-border font-black text-[11px] uppercase tracking-widest"
            )}
          >
            <category.icon className="w-4 h-4" />
            <span className={activeCategory === category.id ? "text-xs" : "text-[11px]"}>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Featured Newsletter */}
      {activeCategory === "all" && !searchQuery && NEWSLETTERS[0] && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group cursor-pointer mb-12"
          onClick={() => setSelectedArticle(NEWSLETTERS[0])}
        >
          <GlassCard className="overflow-hidden border border-border shadow-flat hover:bg-bg-surface/50 transition-colors p-0 rounded-[1px]">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-[400px] lg:h-full overflow-hidden">
                <Image 
                  src={NEWSLETTERS[0].image} 
                  alt={NEWSLETTERS[0].title}
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
                />
                 <div className="absolute top-6 left-6">
                  <Badge variant="lethal" styleType="solid" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] bg-red-600 text-white rounded-[1px] italic shadow-2xl">
                    FEATURED INSIGHT
                  </Badge>
                </div>
              </div>
              <div className="p-12 lg:p-16 flex flex-col justify-center bg-bg-base/30 backdrop-blur-md">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-primary font-black text-[10px] tracking-[0.4em] uppercase italic">
                    <Mail className="w-4 h-4" /> 2026 MARCH_CHRONICLE
                  </div>
                  <h2 className="text-4xl font-black text-text-main leading-none tracking-tighter uppercase italic">
                    {NEWSLETTERS[0].title}
                  </h2>
                  <div className="border-l-2 border-accent pl-8 py-4 bg-bg-base/50">
                    <p className="text-text-muted text-lg font-bold leading-relaxed italic opacity-80">
                      {NEWSLETTERS[0].subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-8 pt-6">
                     <span className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest italic"><UserCheck className="w-4 h-4" /> {NEWSLETTERS[0].author}</span>
                     <span className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-widest italic"><Calendar className="w-4 h-4" /> {NEWSLETTERS[0].date}</span>
                  </div>
                    <div className="pt-10">
                    <Button variant="wireframe" className="h-12 px-10 rounded-[1px] font-black uppercase tracking-[0.3em] italic border-primary/40 text-primary hover:bg-primary/10 transition-all group/btn">
                      ENTER INSIGHT <ChevronRight className="w-4 h-4 ml-4 group-hover/btn:translate-x-2 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Newsletter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredNewsletters.filter(n => !n.isFeatured || activeCategory !== "all").map((item, idx) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              onClick={() => setSelectedArticle(item)}
              className="group cursor-pointer"
            >
              <GlassCard className="p-0 overflow-hidden border border-border shadow-flat flex flex-col h-full bg-bg-surface/30 hover:bg-bg-surface transition-all rounded-[1px]">
                <div className="relative h-56 overflow-hidden">
                  <Image 
                    src={item.image} 
                    alt={item.title}
                    fill
                    className="object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="optimal" styleType="soft" className="bg-bg-base/80 backdrop-blur-md border border-border text-text-muted font-black text-[9px] uppercase tracking-widest px-3 py-1 italic rounded-[1px]">
                      {NEWSLETTER_CATEGORIES.find(c => c.id === item.category)?.label}
                    </Badge>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-text-main mb-3 uppercase italic tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] font-bold text-text-muted leading-relaxed italic line-clamp-2 mb-8 opacity-60">
                    {item.subtitle}
                  </p>
                  <div className="mt-auto pt-6 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic flex items-center gap-2">
                       <UserCheck className="w-3.5 h-3.5" /> {item.author.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest italic flex items-center gap-2">
                       <Calendar className="w-3.5 h-3.5" /> {item.date}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredNewsletters.length === 0 && (
         <div className="flex flex-col items-center justify-center py-32 bg-bg-base border border-dashed border-border rounded-[1px]">
          <BookOpen className="w-16 h-16 mb-6 text-text-muted/20" />
          <span className="text-[11px] font-black uppercase tracking-[0.4em] text-text-muted/40 italic">Zero telemetry detected in current subspace</span>
          <Button variant="wireframe" onClick={() => { setActiveCategory("all"); setSearchQuery(""); }} className="mt-8 text-[10px] font-black uppercase tracking-widest italic border-border">
            Reset Archive Filter
          </Button>
        </div>
      )}

      {/* Subscription Card */}
      <GlassCard className="bg-text-main p-16 text-center border-none shadow-2xl mt-12 relative overflow-hidden group rounded-[2px]">
         <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute -top-20 -right-20 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Mail className="w-96 h-96 text-white" />
         </div>
         
        <div className="relative z-10 max-w-3xl mx-auto space-y-10">
          <div className="inline-flex p-5 bg-white/5 rounded-[1px] shadow-inner border border-white/10">
            <Share2 className="w-10 h-10 text-accent animate-pulse" />
          </div>
           <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
            Join the Omni Circle // Strategic Sustenance
          </h2>
          <p className="text-white/40 text-lg font-bold italic tracking-tight">
            Weekly chronicles of global ESG shifts, geopolitical stress-tests, and operational excellence vectors.
          </p>
           <div className="flex flex-col sm:flex-row gap-4 pt-6 justify-center max-w-xl mx-auto">
            <input 
              type="email" 
              placeholder="ENTER EMAIL ADDRESS..." 
              className="bg-white/5 border border-white/10 rounded-[1px] px-8 py-4 text-white placeholder:text-white/20 outline-none focus:border-accent flex-1 font-mono text-sm shadow-inner transition-all"
            />
            <Button variant="solid" className="bg-accent hover:bg-accent/80 h-14 px-12 rounded-[1px] font-black uppercase tracking-[0.2em] italic text-white shadow-2xl border-none">
              Initialize
            </Button>
          </div>
           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.6em] italic mt-6">
            Privacy Sealed // Universal Encryption // Perpetual Knowledge
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
