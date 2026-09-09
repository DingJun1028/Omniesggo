import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbSgs() {
  return (
    <HtbPageLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="SGS 專業實驗室檢驗"
            description="國際海門冬添加劑最大爭議在於重金屬與化合物殘留，我們以第三方數據直接回答。"
          />
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 leading-7">
            <p>報告編號：AVA23400560</p>
            <p>檢測方法：衛福部認證方法</p>
            <ul className="mt-3 list-disc pl-5">
              <li>汞（Mercury）：未檢出 N.D.</li>
              <li>無機砷（Arsenic）：未檢出 N.D.</li>
              <li>鉛、鎘（Pb/Cd）：遠低於法規標準</li>
              <li>溴仿（Bromoform）：GC-MS 活性定量</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader title="信任基礎" />
          <p className="text-sm text-gray-700 leading-relaxed">
            第三方檢驗是海門冬商品化的必要條件；本站將關鍵結果公開摘要，完整報告可於合作階段有條件提供。
          </p>
        </div>
      </section>

      <HtbFooter />
    </HtbPageLayout>
  );
}
