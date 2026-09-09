import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbPartnership() {
  const items = [
    { title: '酪農場域合作', desc: '開放牧場接入 Nuber 平台，建立可追溯的畜牧碳資產盤查與減排追蹤。' },
    { title: '研究機構合作', desc: '歡迎產學團隊共同參與場域驗證與數據分析，加速 dMRV 標準化。' },
    { title: '企業碳權諮詢', desc: '提供 ESG 報告與碳權購買策略，協助企業達成減碳目標。' },
  ];

  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="合作方案"
        description="從牧場到企業，從科研到國際標準，我們提供多層級合作模式。"
      />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-htb-charcoal">{item.title}</p>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <a href="/htb/contact" className="inline-flex items-center justify-center rounded-xl bg-htb-sprout px-4 py-3 text-sm font-bold text-white">
          洽談合作
        </a>
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
