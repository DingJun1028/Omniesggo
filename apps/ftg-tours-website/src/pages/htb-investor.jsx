import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbInvestor() {
  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="投資人專區"
        description="聚焦可驗證減碳路徑、科研進度與國際鏈結進展。"
      />
      <div className="space-y-3">
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-htb-charcoal">技術護城河</p>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            以海門冬養殖與 dMRV 平台為核心，建立科研與數據雙重壁壘。
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-htb-charcoal">國際鏈結進展</p>
          <p className="mt-2 text-xs text-gray-600 leading-relaxed">
            與研究機構及國際標準單位合作，強化減碳數據可信度與碳權流通性。
          </p>
        </div>
      </div>
      <div className="mt-4">
        <a href="/htb/contact" className="inline-flex items-center justify-center rounded-xl bg-htb-deepSea px-4 py-3 text-sm font-bold text-white">
          聯繫投資人關係
        </a>
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
