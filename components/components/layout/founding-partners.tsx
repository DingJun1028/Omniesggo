import { GlassCard } from "@/components/ui/glass-card";
import { ExternalLink, Users, Megaphone } from "lucide-react";

const PARTNERS = [
  { name: "山衛科技", features: "專注於環境監測與物聯網技術，提供精準的環境數據分析。", url: "#" },
  { name: "墾趣", features: "戶外休閒與永續生活推廣，倡導與自然共存的綠色生活方式。", url: "#" },
  { name: "全人評測", features: "整合性身心靈健康評測，關注員工與個人的全面福祉。", url: "#" },
  { name: "語言步驟", features: "透過語言學習與跨文化溝通，促進多元包容與知識傳遞。", url: "#" },
  { name: "王道阿丹與施振榮Stand哥", features: "倡導王道精神與永續經營理念，推動企業社會責任與創新。", url: "#" },
];

export function FoundingPartners() {
  return (
    <GlassCard className="p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3 text-balance">
        <Users className="w-6 h-6 text-[#009E9D]" />
        紀念元祖夥伴
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PARTNERS.map((p, i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#009E9D]/30 transition-all">
            <h3 className="font-bold text-slate-800 mb-2 text-balance">{p.name}</h3>
            <p className="text-sm text-slate-600 mb-4 text-pretty">{p.features}</p>
            <a href={p.url} className="text-xs font-bold text-[#009E9D] flex items-center gap-1 hover:underline">
              了解更多 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
      <div className="mt-8 p-6 bg-gradient-to-r from-[#009E9D]/10 to-[#219EBC]/10 rounded-2xl border border-[#009E9D]/20 text-center">
        <Megaphone className="w-8 h-8 text-[#009E9D] mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-2 text-balance">善向永續村，召集令！</h3>
        <p className="text-sm text-slate-600 text-pretty mb-6">
          我們誠摯邀請更多志同道合的商家與村民一同入住，共創永續生態圈！
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Beta Signup */}
          <div className="bg-white/50 p-6 rounded-xl border border-[#009E9D]/10 text-left">
            <h4 className="font-bold text-slate-800 mb-4 text-balance">🔥 搶先預告：遊戲化改版即將登場！</h4>
            <p className="text-sm text-slate-600 mb-6 text-pretty">
              留下您的聯絡資訊，即可優先取得「善向永續村」遊戲化改版的封測資格，搶先體驗永續治理的樂趣。
            </p>
            <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="請輸入您的電子郵件" 
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#009E9D]/20"
                required
              />
              <button className="w-full px-6 py-2 bg-[#009E9D] text-white rounded-lg font-bold hover:bg-[#008A89] transition-colors">
                預約封測
              </button>
            </form>
          </div>

          {/* Agent Code Reward */}
          <div className="bg-white/50 p-6 rounded-xl border border-[#009E9D]/10 text-left">
            <h4 className="font-bold text-slate-800 mb-4 text-balance">💎 專屬代理碼獎勵</h4>
            <p className="text-sm text-slate-600 mb-4 text-pretty">分享代碼，共創永續生態</p>
            
            <div className="bg-slate-900/5 p-3 rounded-lg mb-4">
              <p className="text-xs text-slate-500 mb-1">您的代理碼</p>
              <p className="font-mono font-bold text-[#009E9D] text-lg tracking-wider">ESG-PIONEER-2026</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-white/50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500">累積永續幣</p>
                <p className="font-bold text-slate-800 text-lg">1,250</p>
              </div>
              <div className="bg-white/50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500">成功邀請企業</p>
                <p className="font-bold text-slate-800 text-lg">3</p>
              </div>
            </div>
            
            <button className="w-full px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors">
              分享邀請連結
            </button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
