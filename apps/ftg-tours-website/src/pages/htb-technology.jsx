import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbTechnology() {
  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="科研與技術"
        description="以海門冬養殖與畜牧碳資產平台為核心，建立可追溯、可驗證的減碳技術鏈。"
      />
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="h-[140px] w-full bg-gradient-to-br from-[#d9770633] to-[#7F1D1D22] border-b border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">海門冬養殖實景</span>
          </div>
          <div className="p-4">
            <h3 className="text-base font-bold text-htb-charcoal">海門冬養殖技術</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              結合海洋牧場與多營養層級養殖，提升碳匯效率並維持生態平衡。
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="h-[140px] w-full bg-gradient-to-br from-[#3B72B933] to-[#0f172a22] border-b border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">dMRV 數據儀表板</span>
          </div>
          <div className="p-4">
            <h3 className="text-base font-bold text-htb-charcoal">dMRV 數據平台</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              數位監控、報告與驗證平台，讓每一筆減碳數據皆可溯源。
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h3 className="text-base font-bold text-htb-charcoal">飼料添加劑與瘤胃優化</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            專利配方改善發酵效率，降低甲烷排放並維持產奶性能。
          </p>
        </div>
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
