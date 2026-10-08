import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';
import { IconMail, IconPin, IconPhone } from '../components/htb/HtbIcons';

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
            <p className="flex items-start gap-2">
              <IconMail className="w-4 h-4 mt-1.5 shrink-0 text-htb-deepSea" />
              <span>Email：info@hsu-kc.com</span>
            </p>
            <p className="mt-2 flex items-start gap-2">
              <IconPin className="w-4 h-4 mt-1.5 shrink-0 text-htb-deepSea" />
              <span>總部：台灣主要育成基地與研發中心</span>
            </p>
            <p className="mt-2 flex items-start gap-2">
              <IconPhone className="w-4 h-4 mt-1.5 shrink-0 text-htb-deepSea" />
              <span>合作洽談：請來信並註明「酪農合作」或「企業碳權」</span>
            </p>
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
