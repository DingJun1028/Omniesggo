import { Badge } from "@/components/ui/badge";
import { Zap, Leaf, Droplets, Wind, Shield, Sparkles } from "lucide-react";

const CARDS = [
  { id: 1, name: "太陽能先鋒 (Solar Pioneer)", rarity: "Legendary", icon: Zap, color: "amber", effect: "每日獲得 (Daily Gain) +50 永續幣", desc: "引領綠色能源轉型 (Green Energy Transition) 的先驅者。", level: 3 },
  { id: 2, name: "植樹達人 (Tree Planting Guru)", rarity: "Epic", icon: Leaf, color: "emerald", effect: "碳抵換成本 (Carbon Offset Cost) -5%", desc: "致力於恢復地球綠肺 (Restoring Earth) 的行動者。", level: 2 },
  { id: 3, name: "節水模範 (Water Conservation Role Model)", rarity: "Rare", icon: Droplets, color: "blue", effect: "水資源任務獎勵 (Water Task Reward) +20%", desc: "珍惜每一滴水資源 (Valuing Every Drop) 的守護者。", level: 4 },
  { id: 4, name: "風力守護者 (Wind Guardian)", rarity: "Common", icon: Wind, color: "slate", effect: "無特殊效果 (No Special Effect)", desc: "乘風而行 (Wind Power) 的綠色使者。", level: 1 },
  { id: 5, name: "合規護盾 (Compliance Shield)", rarity: "Epic", icon: Shield, color: "indigo", effect: "審核通過率 (Audit Pass Rate) +10%", desc: "確保企業營運符合最高 ESG 標準 (Meeting ESG Standards).", level: 1 },
];

const RARITY_COLORS: Record<string, string> = {
  Legendary: "from-amber-300 to-orange-500 border-amber-400 text-amber-900",
  Epic: "from-purple-300 to-fuchsia-500 border-purple-400 text-purple-900",
  Rare: "from-blue-300 to-cyan-500 border-blue-400 text-blue-900",
  Common: "from-slate-200 to-slate-400 border-slate-300 text-slate-800",
};

export function CardsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">永續卡牌收集冊 (Sustainability Card Collection)</h2>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4" /> 抽取新卡牌 (Draw New Cards)
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {CARDS.map(card => (
          <div key={card.id} className="group cursor-pointer" style={{ perspective: "1000px" }}>
            <div className={`relative p-1 rounded-2xl bg-gradient-to-br ${RARITY_COLORS[card.rarity]} shadow-md transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-xl`}>
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-5 h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={`bg-${card.color}-100 text-${card.color}-700 border-none`}>{card.rarity}</Badge>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">Lv.{card.level}</span>
                </div>
                <div className={`w-16 h-16 mx-auto rounded-full bg-${card.color}-100 flex items-center justify-center mb-4 shadow-inner`}>
                  <card.icon className={`w-8 h-8 text-${card.color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-center text-slate-800 mb-1">{card.name}</h3>
                <p className="text-xs text-center text-slate-500 mb-4 flex-1">{card.desc}</p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-auto">
                  <p className="text-xs font-bold text-slate-600 text-center">{card.effect}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
