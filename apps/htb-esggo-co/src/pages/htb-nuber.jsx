import { useState } from 'react';
import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbNuber() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <HtbPageLayout>
      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="Nuber：畜牧碳資產平台"
            description="把飼料減排、IoT 採集、碳權交易整合成一條可執行的閉環。"
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border-l-4 border-htb-deepSea bg-white p-4">
              <p className="font-bold">🚀 PUSH 科技推力</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 leading-7">
                <li>專利海門冬飼料添加劑優化瘤胃發酵</li>
                <li>穿戴式 IoT 智慧頸圈即時採集打嗝排放</li>
                <li>dMRV 系統自動對接國際碳權標準（VCS）</li>
              </ul>
            </div>
            <div className="rounded-2xl border-l-4 border-htb-sprout bg-white p-4">
              <p className="font-bold">🧲 PULL 經濟拉力</p>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 leading-7">
                <li>牛奶收購價 +5%（酪農每公升增收 1.5–2 元）</li>
                <li>終端「低碳牛奶」享有 10–15% 綠色品牌溢價</li>
                <li>每頭牛年減碳 1–3 噸，共享高價值碳權分潤</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader title="合作方案" />
          <div className="mt-4 grid gap-3">
            <a href="#farmer" className="block w-full rounded-xl bg-htb-deepSea px-4 py-3 text-center text-sm font-bold text-white">酪農加入合作</a>
            <a href="#enterprise" className="block w-full rounded-xl bg-htb-sprout px-4 py-3 text-center text-sm font-bold text-[#14301a]">企業碳權諮詢</a>
            <a href="#consumer" className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-htb-charcoal border border-gray-200">探索低碳選項</a>
          </div>
        </div>
      </section>

      <HtbFooter />
    </HtbPageLayout>
  );
}
