"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Trophy, Target, CheckCircle, Flame, Star, Shield, Users } from "lucide-react";
import { useOmniGamification } from "../../hooks/useOmniGamification";
import { getLeaderboard } from "../../actions/gamification";

const IconMap = {
  Target: <Target className="w-6 h-6 text-emerald-400" />,
  Flame: <Flame className="w-6 h-6 text-cyan-400" />,
  Shield: <Shield className="w-6 h-6 text-purple-400" />,
  Star: <Star className="w-6 h-6 text-yellow-400" />,
};

type LeaderboardEntry = {
  id: string;
  name: string;
  level: number;
  xp: number;
  avatar: string;
};

export function GamifiedDashboard() {
  const { 
    level, xp, xpNeeded, streakDays, quests, badges, 
    showLevelUp, lastGainedXp, completeQuest, dismissLevelUp 
  } = useOmniGamification();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    getLeaderboard().then(setLeaderboard);
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 p-8 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* ---------------- LEVEL UP OVERLAY ---------------- */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm"
            onClick={dismissLevelUp}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-gradient-to-br from-cyan-950 to-emerald-950 border-2 border-cyan-400/50 p-12 rounded-3xl text-center shadow-[0_0_100px_rgba(6,182,212,0.3)] relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(6,182,212,0.4)_360deg)] opacity-30"
              />
              <Zap className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
              <h1 className="text-5xl font-black text-cyan-400 dark:text-cyan-300 mb-2">
                LEVEL UP!
              </h1>
              <p className="text-2xl font-bold text-slate-200">
                等級提升至 {level}
              </p>
              <p className="text-slate-400 mt-4">全通能量上限提升，解鎖新任務！</p>
              <button 
                onClick={dismissLevelUp}
                className="mt-8 px-8 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-full transition-colors w-full"
              >
                繼續旅程
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <SparklesIcon className="text-cyan-400 w-8 h-8" />
              全通永續中心 <span className="text-cyan-400">Hub</span>
            </h1>
            <p className="text-slate-400 mt-2 text-lg">完成每日降熵任務，提升您的 ESG 影響力。</p>
          </div>
          
          {/* 連續登入烈火特效 */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 px-6 py-3 rounded-full shadow-[0_0_20px_rgba(249,115,22,0.15)]"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className="w-8 h-8 text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]" />
            </motion.div>
            <div className="flex flex-col">
              <span className="text-xs text-orange-300/80 font-bold tracking-wider uppercase">Streak</span>
              <span className="text-xl font-black text-orange-400 leading-none">{streakDays} 天</span>
            </div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Level & XP Progress */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-colors" />
              
              <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Star className="w-5 h-5 text-emerald-400" />
                    等級 {level}
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">全通能量 (Omni-Energy) 進度</p>
                </div>
                <div className="text-sm font-mono text-cyan-400">{(xp / xpNeeded * 100).toFixed(1)}%</div>
              </div>
              <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative z-10">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 relative"
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / xpNeeded) * 100}%` }}
                  transition={{ type: "spring", stiffness: 50, damping: 15 }}
                >
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50" />
                </motion.div>
              </div>
            </motion.div>

            {/* Quest Board */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold">每日任務 (Quest Board)</h2>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {quests.map((quest) => (
                    <motion.div 
                      key={quest.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                      className={`flex items-center justify-between p-5 rounded-2xl border transition-colors ${
                        quest.completed 
                          ? "bg-emerald-500/10 border-emerald-500/30" 
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => !quest.completed && completeQuest(quest.id, quest.xpReward)}
                          disabled={quest.completed}
                          className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                            quest.completed 
                              ? "border-emerald-400 bg-emerald-400 text-[#020617] scale-110" 
                              : "border-slate-500 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] text-transparent hover:text-cyan-400"
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <div>
                          <h3 className={`font-medium transition-colors ${quest.completed ? "text-slate-400 line-through" : "text-slate-100"}`}>
                            {quest.title}
                          </h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400 mt-2 inline-block">
                            {quest.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className={`font-mono font-bold ${quest.completed ? "text-emerald-400" : "text-cyan-400"}`}>
                        +{quest.xpReward} XP
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Badges & Leaderboard */}
          <div className="space-y-8">
            
            {/* Badges */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-400" />
                <h2 className="text-2xl font-bold">獲得徽章</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`group relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 border transition-all cursor-default ${
                      badge.unlocked 
                        ? "bg-gradient-to-br from-white/10 to-white/5 border-white/20 shadow-lg shadow-cyan-500/10" 
                        : "bg-slate-900/50 border-white/5 opacity-50 grayscale"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 ${
                      badge.unlocked ? "bg-[#020617] shadow-inner border border-white/10" : "bg-slate-800"
                    }`}>
                      {IconMap[badge.iconName]}
                    </div>
                    <h3 className="text-sm font-bold text-center leading-tight">{badge.name}</h3>
                    <div className="absolute inset-0 bg-[#020617]/95 backdrop-blur-md rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center z-10 border border-white/10 pointer-events-none">
                      <p className="text-xs text-slate-300 font-medium">{badge.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Leaderboard */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-cyan-400" />
                <h2 className="text-2xl font-bold">ESG 影響力排行榜</h2>
              </div>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-lg shadow-inner">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                          {user.name}
                          {index === 0 && <span className="text-xs text-yellow-400 font-mono">TOP 1</span>}
                        </div>
                        <div className="text-xs text-emerald-400">Lv. {user.level}</div>
                      </div>
                    </div>
                    <div className="text-sm font-mono text-cyan-400">{user.xp} XP</div>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Sparkles Icon Helper
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}
