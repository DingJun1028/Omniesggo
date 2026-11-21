"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  GraduationCap, 
  Layers, 
  Home, 
  Users, 
  Store, 
  Sparkles,
  ChevronRight,
  Coins,
  Trophy,
  Star,
  ArrowLeft,
  Sword,
  ShieldAlert,
  Flame,
  Wind,
  Target,
  Zap,
  CheckCircle2,
  BookOpen,
  Clock
} from "lucide-react";
import { motion } from "motion/react";
import { villageApi, type VillageMember } from "@/lib/ncb-service";
import { useAppContext } from "@/lib/context/app-context";
import { AcademyView } from "./rpg/academy-view";
import { CardsView } from "./rpg/cards-view";
import { RoomView } from "./rpg/room-view";
import { MallView } from "./rpg/mall-view";
import { AgencyView } from "./agency-view";

const VILLAGE_LOCATIONS = [
  {
    id: "academy",
    name: "永續學堂",
    enName: "Sustainability Academy",
    desc: "學習 ESG 知識，完成測驗獲取永續幣與經驗值，提升您的永續等級。",
    icon: GraduationCap,
    color: "blue",
    bgGradient: "from-blue-500/10 to-cyan-500/5",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    status: "開放中",
    action: "進入學堂"
  },
  {
    id: "cards",
    name: "永續卡牌",
    enName: "Sustainability Cards",
    desc: "收集與升級永續行動卡牌，解鎖特殊成就、專屬頭像與村莊能力。",
    icon: Layers,
    color: "purple",
    bgGradient: "from-purple-500/10 to-fuchsia-500/5",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    status: "收集季進行中",
    action: "查看牌組"
  },
  {
    id: "room",
    name: "永續部屋",
    enName: "Sustainability Room",
    desc: "打造專屬的虛擬永續空間，展示您的成就徽章、稀有收藏品與綠色植栽。",
    icon: Home,
    color: "emerald",
    bgGradient: "from-emerald-500/10 to-teal-500/5",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    status: "裝潢中",
    action: "佈置部屋"
  },
  {
    id: "agency",
    name: "永續代理",
    enName: "Sustainability Agency",
    desc: "獲取專屬代理碼，邀請企業與夥伴加入，共同擴大永續影響力並賺取分潤。",
    icon: Users,
    color: "amber",
    bgGradient: "from-amber-500/10 to-orange-500/5",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    status: "熱烈招募中",
    action: "前往代理中心"
  },
  {
    id: "mall",
    name: "永續商城",
    enName: "Sustainability Mall",
    desc: "使用累積的永續幣兌換真實綠色商品、碳權憑證或特優商家專屬折扣。",
    icon: Store,
    color: "rose",
    bgGradient: "from-rose-500/10 to-pink-500/5",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    status: "新品上架",
    action: "逛逛商城"
  }
];

const DAILY_QUESTS = [
  { id: 1, title: "每日簽到", reward: 10, type: "checkin", icon: CheckCircle2, completed: true },
  { id: 2, title: "閱讀一篇 ESG 新聞", reward: 20, type: "read", icon: BookOpen, completed: false },
  { id: 3, title: "完成一堂學堂課程", reward: 50, type: "study", icon: GraduationCap, completed: false },
];

const WORLD_BOSS = {
  name: "碳排巨獸 (Carbon Behemoth)",
  hp: 65,
  maxHp: 100,
  desc: "這隻巨獸正不斷吞噬大氣中的純淨空氣，我們需要全村的力量來淨化它！",
  reward: "傳說級卡牌碎片",
  timeLeft: "2 天 14 小時"
};

const VILLAGE_EVENTS = [
  "恭喜村民 [永續先鋒] 獲得了傳說級卡牌 [太陽能先鋒]！",
  "永續學堂新課程 [生物多樣性保護] 已上架。",
  "全村淨化進度已達到 65%，加油！",
];

const DEFAULT_MEMBER = {
  village_name: "永續冒險者 #2026",
  title: "[初級減碳者]",
  reputation: 1,
  level: 12
};

export function VillageRpgView() {
  const { aiProxyMode, lang } = useAppContext();
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [showQuests, setShowQuests] = useState(false);
  const [eventIndex, setEventIndex] = useState(0);
  const [isFighting, setIsFighting] = useState(false);
  const [bossHp, setBossHp] = useState(WORLD_BOSS.hp);
  const [dbMembers, setDbMembers] = useState<VillageMember[]>([]);
  const [loading, setLoading] = useState(true);

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能數據進化" : "Omni Evolution",
      subtitle: "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：AI 自動將現實永續行為轉化為稀有資產，提升您的進化等級。" : "AI agent auto-transforming actions into rare assets and evolution points.",
      accent: "from-purple-500 to-indigo-600",
      tag: "[自動]",
      icon: Zap
  } : {
      title: lang === "zh" ? "萬能永續村 RPG" : "Omni Village RPG",
      subtitle: "Omni Manual Control",
      description: lang === "zh" ? "萬能核實：探索永續村莊，手動完成行動並將知識轉化為實質影響力。" : "Explore the village and manually turn knowledge into impact.",
      accent: "from-indigo-500 to-purple-600",
      tag: "[手動]",
      icon: Sparkles
  };

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const { data } = await villageApi.listMembers();
      if (data) setDbMembers(data);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  // Simple event ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setEventIndex((prev) => (prev + 1) % VILLAGE_EVENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleFight = () => {
    if (isFighting) return;
    setIsFighting(true);
    setTimeout(() => {
      setBossHp(prev => Math.max(0, prev - 1));
      setIsFighting(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      {/* Event Ticker */}
      <div className="bg-indigo-900 text-white py-2 px-4 rounded-full overflow-hidden relative h-10 flex items-center">
        <div className="flex items-center gap-3 whitespace-nowrap animate-marquee">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-sm font-bold tracking-wide">
            {VILLAGE_EVENTS[eventIndex]}
          </span>
        </div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
          {/* Character Avatar */}
          <div className="relative group">
            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${branding.accent} p-1 shadow-lg`}>
              <div className="w-full h-full rounded-[20px] bg-white flex items-center justify-center overflow-hidden relative">
                <Image 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sustainability" 
                  alt="Avatar" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${aiProxyMode ? 'bg-rose-500' : 'bg-amber-500'} border-2 border-white flex items-center justify-center shadow-md`}>
              {aiProxyMode ? <Zap className="w-4 h-4 text-white" /> : <Trophy className="w-4 h-4 text-white" />}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                {branding.title}
              </h1>
              <Badge
                variant={aiProxyMode ? 'critical' : 'optimal'}
                styleType="soft"
              >
                {branding.tag}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <span className={`font-bold ${aiProxyMode ? 'text-rose-600' : 'text-indigo-600'}`}>{dbMembers[0]?.village_name || DEFAULT_MEMBER.village_name}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-sm">{lang === 'zh' ? '稱號' : 'Title'}：{dbMembers[0]?.title || DEFAULT_MEMBER.title}</span>
            </div>
          </div>
        </div>

        {/* Player Stats Mini-Dashboard */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 md:gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-amber-700">1,250</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
            <Trophy className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-blue-700">Lv. {dbMembers[0]?.level || DEFAULT_MEMBER.level}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-100">
            <Star className="w-4 h-4 text-purple-500" />
            <span className="font-bold text-purple-700">{dbMembers[0]?.reputation || DEFAULT_MEMBER.reputation}/50</span>
          </div>
          <button 
            onClick={() => setShowQuests(!showQuests)}
            className={`p-2 rounded-xl transition-colors ${showQuests ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            <Target className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Daily Quests Overlay */}
      {showQuests && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-indigo-100 shadow-lg p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" /> 每日永續冒險
            </h3>
            <span className="text-xs font-bold text-slate-400">重置時間: 06:00 AM</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DAILY_QUESTS.map(quest => (
              <div key={quest.id} className={`p-4 rounded-xl border flex items-center justify-between ${quest.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quest.completed ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-slate-400'}`}>
                    <quest.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${quest.completed ? 'text-emerald-800 line-through' : 'text-slate-700'}`}>{quest.title}</p>
                    <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                      <Coins className="w-3 h-3" /> +{quest.reward}
                    </p>
                  </div>
                </div>
                {quest.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <button className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    前往
                  </button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content Area */}
      {activeLocation ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setActiveLocation(null)} 
            className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit"
          >
            <ArrowLeft className="w-4 h-4" /> 返回村莊地圖
          </button>
          
          <div className="mt-4">
            {activeLocation === "academy" && <AcademyView />}
            {activeLocation === "cards" && <CardsView />}
            {activeLocation === "room" && <RoomView />}
            {activeLocation === "agency" && <AgencyView />}
            {activeLocation === "mall" && <MallView />}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* World Boss Section */}
          <GlassCard className="p-8 border-l-4 border-l-rose-500 relative overflow-hidden bg-gradient-to-br from-rose-50/30 to-white">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-900 flex items-center justify-center relative group overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 to-transparent opacity-50" />
                <Flame className={`w-16 h-16 text-rose-500 ${isFighting ? 'animate-bounce scale-110' : 'animate-pulse'}`} />
                {isFighting && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white font-black text-2xl animate-ping">-1</div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-rose-600/80 text-white text-[10px] font-bold py-1 text-center">
                  WORLD BOSS
                </div>
              </div>

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">{WORLD_BOSS.name}</h2>
                  <Badge className="bg-rose-100 text-rose-700 border-rose-200">史詩級戰役</Badge>
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> 剩餘時間: {WORLD_BOSS.timeLeft}
                  </span>
                </div>
                <p className="text-slate-600 mb-6 max-w-xl leading-relaxed">
                  {WORLD_BOSS.desc}
                </p>
                
                <div className="space-y-2 mb-6 max-w-md mx-auto md:mx-0">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-rose-600">淨化進度 (HP)</span>
                    <span className="text-slate-500">{bossHp}% / {WORLD_BOSS.maxHp}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${bossHp}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button 
                    onClick={handleFight}
                    disabled={isFighting}
                    className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Sword className={`w-5 h-5 ${isFighting ? 'animate-spin' : ''}`} /> 
                    {isFighting ? '淨化中...' : '參與淨化行動'}
                  </button>
                  <div className="text-sm font-bold text-slate-500 flex items-center gap-2">
                    獎勵: <span className="text-amber-600 flex items-center gap-1"><Sparkles className="w-4 h-4" /> {WORLD_BOSS.reward}</span>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Village Map Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {VILLAGE_LOCATIONS.map((loc, idx) => (
              <motion.div
                key={loc.id}
                whileHover={{ y: -4 }}
                className="group cursor-pointer"
                onClick={() => setActiveLocation(loc.id)}
              >
                <GlassCard className={`p-6 h-full flex flex-col relative overflow-hidden border-2 transition-colors ${activeLocation === loc.id ? 'border-indigo-400 shadow-md' : 'border-transparent hover:border-slate-200'}`}>
                  {/* Background Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${loc.bgGradient} opacity-50 pointer-events-none`} />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${loc.iconBg} flex items-center justify-center shadow-sm`}>
                        <loc.icon className={`w-7 h-7 ${loc.iconColor}`} />
                      </div>
                      <Badge className="bg-white/80 backdrop-blur-sm text-slate-600 border-slate-200 shadow-sm">
                        {loc.status}
                      </Badge>
                    </div>

                    <div className="mb-4 flex-1">
                      <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
                        {loc.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400 mb-3">{loc.enName}</p>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {loc.desc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100/50 mt-auto">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className={`${loc.iconColor}`}>{loc.action}</span>
                        <div className={`w-8 h-8 rounded-full ${loc.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <ChevronRight className={`w-4 h-4 ${loc.iconColor}`} />
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}

            {/* Coming Soon Placeholder */}
            <GlassCard className="p-6 h-full flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 bg-slate-50/50">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-500 mb-2">更多村莊設施</h3>
              <p className="text-sm text-slate-400">敬請期待未來的擴建計畫...</p>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}

