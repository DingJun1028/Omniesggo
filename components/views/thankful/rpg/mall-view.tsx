import { GlassCard } from "@/components/ui/glass-card";
import { ShoppingCart, Coins, Gift, Ticket, Coffee, Book, TreeDeciduous } from "lucide-react";

const PRODUCTS = [
  { id: 1, name: "特優商家 9 折券 (Merchants 10% OFF Voucher)", desc: "適用於所有綠色聯盟特優商家 (Green Alliance Merchants).", price: 500, icon: Ticket, color: "blue" },
  { id: 2, name: "公平貿易咖啡豆 (Fair Trade Coffee Beans)", desc: "來自瓜地馬拉的 100% 公平貿易認證咖啡 (Guatemala Certifed Coffee).", price: 1200, icon: Coffee, color: "amber" },
  { id: 3, name: "永續報告書範本 (Sustainability Report Template)", desc: "進階版 CSR/ESG 報告書排版範本 (Advanced Report Layout Template).", price: 800, icon: Book, color: "indigo" },
  { id: 4, name: "認養一棵樹 (Adopt a Tree)", desc: "我們將以您的名義在亞馬遜雨林種下一棵樹 (Amazon Rainforest Reforestation).", price: 3000, icon: TreeDeciduous, color: "emerald" },
  { id: 5, name: "神祕卡牌包 (Mystery Card Pack)", desc: "包含 3 張隨機永續卡牌，有機會獲得史詩卡 (3 Random Sustainability Cards)！", price: 1500, icon: Gift, color: "purple" },
];

export function MallView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">永續商城 (Sustainability Mall)</h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
          <span className="text-sm font-medium text-amber-800">您的餘額 (Balance):</span>
          <Coins className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-amber-700 text-lg">1,250 幣 (Coins)</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCTS.map(product => (
          <GlassCard key={product.id} className="p-6 flex flex-col h-full hover:border-amber-200 transition-all hover:shadow-md group">
            <div className={`w-16 h-16 rounded-2xl bg-${product.color}-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
              <product.icon className={`w-8 h-8 text-${product.color}-600`} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{product.name}</h3>
            <p className="text-sm text-slate-500 mb-6 flex-1 leading-relaxed">{product.desc}</p>
            
            <div className="flex items-center justify-between pt-5 border-t border-slate-100 mt-auto">
              <div className="flex items-center gap-1.5">
                <Coins className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-xl text-slate-700">{product.price}</span>
              </div>
              <button className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors flex items-center gap-2 shadow-sm">
                <ShoppingCart className="w-4 h-4" /> 兌換 (Redeem)
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
