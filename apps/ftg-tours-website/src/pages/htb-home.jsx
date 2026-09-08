import HtbPageLayout from '../components/htb/HtbPageLayout';
import HtbHero from '../components/htb/HtbHero';
import HtbImagePlaceholder from '../components/htb/HtbImagePlaceholder';
import HtbStatCard from '../components/htb/HtbStatCard';
import HtbSectionHeader from '../components/htb/HtbSectionHeader';
import HtbFooter from '../components/htb/HtbFooter';

export default function HtbHome() {
  return (
    <HtbPageLayout>
      <HtbHero />

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="產業危機與市場剛需"
            description="畜牧溫室氣體排放已是全球減碳關鍵戰場，以下數據凸顯立即行動的迫切性。"
          />
          <div className="mx-auto max-w-[480px] grid grid-cols-2 gap-3 md:grid-cols-4">
            <HtbStatCard value="14.5%" label="全球牛隻碳排佔比" />
            <HtbStatCard value="110 kg" label="每頭牛年甲烷排放" />
            <HtbStatCard value="84 倍" label="甲烷暖化潛勢（GWP20）" />
            <HtbStatCard value="15 億頭" label="全球乳牛存欄總量" />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="實體科研基地：陸基高密度養殖實證"
            description="從孢子體到飼料添加劑，皆由自有陸基養殖系統量產驗證，不是實驗室猜想。"
          />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <HtbImagePlaceholder label="手握紅褐色海門冬耐熱株" gradient="from-[#d9770633] to-[#7F1D1D22]" />
              <div className="p-3">
                <p className="text-[13px] font-bold">手握紅褐色海門冬耐熱株</p>
                <p className="text-xs text-gray-600 mt-1">四分孢子體高密培養</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <HtbImagePlaceholder label="手握鮮綠色海木耳" gradient="from-[#8CC63F33] to-[#064e3b22]" />
              <div className="p-3">
                <p className="text-[13px] font-bold">手握鮮綠色海木耳</p>
                <p className="text-xs text-gray-600 mt-1">綠色葉狀體繁育槽</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <HtbImagePlaceholder label="階梯式圓形養殖循環槽" gradient="from-[#3B72B933] to-[#0f172a22]" />
              <div className="p-3">
                <p className="text-[13px] font-bold">階梯式圓形養殖循環槽</p>
                <p className="text-xs text-gray-600 mt-1">陸基溫控與氣提水路</p>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
              <HtbImagePlaceholder label="多段式過濾採收網槽" gradient="from-[#7F1D1D33] to-[#3B72B922]" />
              <div className="p-3">
                <p className="text-[13px] font-bold">多段式過濾採收網槽</p>
                <p className="text-xs text-gray-600 mt-1">高活性溴仿鎖存加工</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="SGS 專業實驗室檢驗：安全與零殘留"
            description="國際海門冬添加劑最大爭議在於重金屬與化合物殘留，我們以第三方數據直接回答。"
          />
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-600 mb-2">SGS 報告編號：AVA23400560（衛福部認證方法）</div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2.5 border-b border-gray-100 text-sm">
              <span>汞（Mercury）</span>
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">未檢出 N.D.</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2.5 border-b border-gray-100 text-sm">
              <span>無機砷（Arsenic）</span>
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">未檢出 N.D.</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2.5 border-b border-gray-100 text-sm">
              <span>鉛、鎘（Pb/Cd）</span>
              <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">遠低於法規標準</span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-2.5 text-sm">
              <span>溴仿（Bromoform）</span>
              <span className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-900">GC-MS 活性定量</span>
            </div>
          </div>
        </div>
      </section>

      <section id="nuber" className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="Nuber 平台：雙輪驅動商業閉環"
            description="科技推力降低減排成本，經濟拉力讓酪農與品牌共享永續價值。"
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
          <HtbSectionHeader
            title="產官學科研與國際鏈結"
            description="技術來源公開可追溯，並與國際方法學對接。"
          />
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 leading-7">
            <li>農業部水產試驗所育成中心技術移轉進駐</li>
            <li>農業部畜產試驗所場域合作驗證（審議中）</li>
            <li>國立中山大學、高雄科技大學共同研發專利</li>
            <li>跨國技術協調：對接澳洲 FutureFeed 方法學</li>
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="合作方案"
          />
          <div className="mt-4 grid gap-3">
            <a href="#farmer" className="block w-full rounded-xl bg-htb-deepSea px-4 py-3 text-center text-sm font-bold text-white">
              酪農加入合作
            </a>
            <a href="#enterprise" className="block w-full rounded-xl bg-htb-sprout px-4 py-3 text-center text-sm font-bold text-[#14301a]">
              企業碳權諮詢
            </a>
            <a href="#consumer" className="block w-full rounded-xl bg-white px-4 py-3 text-center text-sm font-bold text-htb-charcoal border border-gray-200">
              探索低碳選項
            </a>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="科研與技術亮點"
            description="從科研基地到數據平台，形成可重複驗證的減碳技術鏈。"
          />
          <HtbResearchGrid />
          <div className="mt-4">
            <a href="/htb/technology" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-htb-deepSea border border-gray-200">
              查看技術頁
            </a>
          </div>
        </div>
      </section>

      <section className="bg-[#F4F6F9]">
        <div className="mx-auto max-w-[480px] px-4 py-6">
          <HtbSectionHeader
            title="案例與實績"
            description="從牧場到碳權，從實驗到國際鏈結，紀錄可驗證的減碳路徑。"
          />
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-htb-charcoal">酪農減碳實證</p>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">配合 Nuber 平台完成首批畜牧碳資產盤查與減排追蹤。</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-htb-charcoal">產官學國際鏈結</p>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">與研究機構及國際標準單位合作，強化減碳數據可信度。</p>
            </div>
          </div>
          <div className="mt-4">
            <a href="/htb/cases" className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-htb-deepSea border border-gray-200">
              查看案例頁
            </a>
          </div>
        </div>
      </section>

      <HtbFooter />
    </HtbPageLayout>
  );
}
