import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbCases() {
  return (
    <HtbPageLayout>
      <HtbSectionHeader
        title="案例與實績"
        description="從牧場到碳權，從實驗到國際鏈結，紀錄高科生技的可驗證減碳路徑。"
      />
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="h-[140px] w-full bg-gradient-to-br from-[#3B72B933] to-[#0f172a22] border-b border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">酪農減碳實證</span>
          </div>
          <div className="p-4">
            <h3 className="text-base font-bold text-htb-charcoal">酪農減碳實證</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              配合 Nuber 平台完成首批畜牧碳資產盤查與減排追蹤。
            </p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="h-[140px] w-full bg-gradient-to-br from-[#8CC63F33] to-[#064e3b22] border-b border-gray-200 flex items-center justify-center">
            <span className="text-xs text-gray-600">產官學國際鏈結</span>
          </div>
          <div className="p-4">
            <h3 className="text-base font-bold text-htb-charcoal">產官學國際鏈結</h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              與研究機構及國際標準單位合作，強化減碳數據可信度。
            </p>
          </div>
        </div>
      </div>
      <HtbFooter />
    </HtbPageLayout>
  );
}
