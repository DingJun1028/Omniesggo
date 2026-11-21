import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbAbout() {
  return (
    <HtbPageLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="關於高科生技"
            description="從海域育成到畜牧減排，我們相信科研必須回到真實場域。"
          />
          <p className="text-sm text-gray-700 leading-relaxed">
            高科生技專注於海門冬（紅藻）耐熱品種選育、陸基高密度養殖，以及下游飼料添加劑與碳資產平台開發。
            我們的團隊結合水產、畜產、資工與碳權方法學，力求把實驗室成果量產成可驗證的減排方案。
          </p>
          <p className="mt-3 text-sm text-gray-700 leading-relaxed">
            總部與主要育成基地位於台灣，技術來源包括農業部水產試驗所、畜產試驗所，
            以及中山大學、高雄科技大學的聯合研發專利。
          </p>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader title="使命與願景" />
          <ul className="list-disc pl-5 text-sm text-gray-700 leading-7">
            <li>讓本土耐熱海藻品種成為畜牧減排的可用選項</li>
            <li>把碳權收益落回酪農，不是只停留在報告</li>
            <li>以第三方檢驗與 dMRV 建立可追溯的信任基礎</li>
          </ul>
        </div>
      </section>

      <HtbFooter />
    </HtbPageLayout>
  );
}
