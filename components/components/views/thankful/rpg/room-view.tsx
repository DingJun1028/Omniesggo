import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { TreePine, Trophy, Medal, Star, Crown, Shield } from "lucide-react";

const BADGES = [
  { name: "初級減碳者 (Beginner Decarbonizer)", icon: Medal, color: "emerald", date: "2025-10-12" },
  { name: "知識探索者 (Knowledge Explorer)", icon: Star, color: "blue", date: "2025-11-05" },
  { name: "綠色推廣大使 (Green Policy Ambassador)", icon: Crown, color: "amber", date: "2026-01-20" },
  { name: "合規守護者 (Compliance Guardian)", icon: Shield, color: "indigo", date: "2026-02-15" },
];

export function RoomView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">我的永續部屋 (My Sustainability Room)</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Virtual Plant */}
        <GlassCard className="lg:col-span-2 p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden bg-gradient-to-b from-emerald-50/30 to-white border-2 border-emerald-100">
          <div className="absolute top-6 left-6">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-sm px-3 py-1">世界樹 (World Tree) Lv. 12</Badge>
          </div>
          <div className="absolute top-6 right-6 text-right">
            <p className="text-xs font-bold text-slate-400 mb-1">下一級需要 (Next Level)</p>
            <p className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">450 EXP</p>
          </div>
          
          {/* Tree Illustration Placeholder */}
          <div className="relative w-64 h-64 flex items-center justify-center mt-8">
            <div className="absolute inset-0 bg-emerald-200/30 rounded-full blur-3xl animate-pulse" />
            <TreePine className="w-48 h-48 text-emerald-500 relative z-10 drop-shadow-2xl" />
            <div className="absolute bottom-4 w-40 h-6 bg-black/5 rounded-[100%] blur-md" />
          </div>
          
          <p className="mt-8 text-slate-500 text-center max-w-md font-medium">
            您的世界樹正在茁壯成長！完成更多永續任務，為它注入綠色能量 (Fuel it with Green Energy).
          </p>
        </GlassCard>

        {/* Right: Badges & Stats */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> 成就徽章 (Achievement Badges)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {BADGES.map((badge, idx) => (
                <div key={idx} className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-100 text-center hover:bg-white hover:shadow-md transition-all cursor-default">
                  <div className={`w-12 h-12 rounded-full bg-${badge.color}-100 flex items-center justify-center mb-3 shadow-sm`}>
                    <badge.icon className={`w-6 h-6 text-${badge.color}-600`} />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{badge.name}</span>
                  <span className="text-[10px] text-slate-400 mt-1.5">{badge.date}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">部屋裝飾 (Room Decorations)</h3>
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <p className="text-sm font-medium text-slate-500">前往商城購買更多裝飾品 (Go to Mall for more decorations)</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
