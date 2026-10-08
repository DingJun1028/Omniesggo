import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbContact() {
  return (
    <HtbPageLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="聯絡我們"
            description="酪農、企業合作、媒體採訪皆歡迎直接聯繫。"
          />
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700 leading-7">
            <p>📧 Email：info@hsu-kc.com</p>
            <p className="mt-2">📍 總部：台灣主要育成基地與研發中心</p>
            <p className="mt-2">📞 合作洽談：請來信並註明「酪農合作」或「企業碳權」</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader title="常見問題" />
          <ul className="list-disc pl-5 text-sm text-gray-700 leading-7">
            <li>海門冬添加劑如何申請試用？</li>
            <li>Nuber 平台是否支援國際碳權標準？</li>
            <li>SGS 報告可否提供給合作夥伴有條件閱覽？</li>
          </ul>
        </div>
      </section>

      <HtbFooter />
    </HtbPageLayout>
  );
}
