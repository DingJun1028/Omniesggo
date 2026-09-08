import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbFaq() {
  const items = [
    {
      q: '海門冬養殖是否會影響近海生態？',
      a: '我們採用多營養層級海洋牧場模式，降低養殖密度與底泥負擔，並定期監測水質與生物多樣性指標。',
    },
    {
      q: 'SGS 報告 AVA23400560 的檢測範圍？',
      a: '報告針對汞、無機砷、鉛、鎘進行定量分析；目前結果皆為未檢出，作為食品安全與品牌信任的佐證。',
    },
    {
      q: 'Nuber 平台的藍綠按鈕分別代表什麼？',
      a: '酪農減碳與碳資產登記走藍色 CTA；企業碳權諮詢、碳權購買與ESG報告走綠色 CTA，方便不同對象分流。',
    },
    {
      q: '畜牧減碳數據如何確保不被竄改？',
      a: '平台提供 dMRV 數位監控與報告，並結合產官學國際鏈結單位進行第三方驗證，強化減碳數據可信度。',
    },
  ];

  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="常見問題"
        description="快速了解高科生技的科研、品牌信任與平台操作重點。"
      />
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.q} className="bg-white border border-gray-200 rounded-2xl p-4">
            <summary className="text-sm font-bold text-htb-charcoal cursor-pointer">
              {item.q}
            </summary>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
