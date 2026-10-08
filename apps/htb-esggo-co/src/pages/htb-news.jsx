import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbNews() {
  const items = [
    {
      title: '高科生技與畜產試驗所場域驗證啟動',
      date: '2026-08-20',
      summary: '畜牧減排數據首次導入第三方場域驗證流程。',
    },
    {
      title: 'Nuber 平台 dairy carbon 模組上線',
      date: '2026-07-05',
      summary: '酪農可即時查看每頭牛減碳量與潛在碳權收益。',
    },
    {
      title: 'SGS 報告 AVA23400560 公開摘要',
      date: '2026-06-12',
      summary: '汞、無機砷、鉛鎘未檢出，強化品牌信任基礎。',
    },
  ];

  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="最新消息"
        description="追蹤高科生技的科研進度、平台更新與合作案進展。"
      />
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.title} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-htb-charcoal">{item.title}</p>
              <span className="text-[11px] text-gray-500">{item.date}</span>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.summary}</p>
          </div>
        ))}
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
