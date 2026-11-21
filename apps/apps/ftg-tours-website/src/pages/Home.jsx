import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import FTGIcon from '../components/FTGIcon';
import CtaForm from '../components/CtaForm';

// 5T-Traceable: 卡片文案改由 t('home.*List') 供應（字典已有正體與英文），
// icon 是純裝飾且不參與翻譯，故留在這裡以索引對應，不進字典。
const ADVANTAGE_ICONS = ['mountain', 'map', 'clipboard', 'users', 'sustainable'];
const FEATURE_ICONS = ['leaf', 'utensils', 'users', 'star', 'sustainable'];
const PROCESS_ICONS = ['users', 'link', 'shield', 'heart', 'star'];
const MOMENT_ICONS = ['sun', 'users', 'star', 'heart', 'award'];
const STEP_ICONS = ['compass', 'map', 'users', 'navigation', 'clipboard'];
const SAFETY_ICONS = ['heart', 'navigation', 'shield', 'award', 'users', 'leaf'];

export default function Home() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('home.h1') || 'ESG 戶外健康旅遊方案',
    description: t('home.metaDesc'),
    path: '/',
    keywords: ['ESG 旅遊', '企業員工旅遊', '團隊日', '家庭日', '身心平衡旅程'],
  });

  const products = [
    { title: t('home.p1Title'), desc: t('home.p1Desc'), link: '/corporate-travel', img: '/images/corporate-travel/企業員工旅遊-頁首大橫幅.webp' },
    { title: t('home.p2Title'), desc: t('home.p2Desc'), link: '/family-day', img: '/images/family-day/企業家庭日-頁首大橫幅.webp' },
    { title: t('home.p3Title'), desc: t('home.p3Desc'), link: '/esg-team-day', img: '/images/esg-team-day/team-day-頁首大橫幅.webp' },
    { title: t('home.p4Title'), desc: t('home.p4Desc'), link: '/wellbeing-retreat', img: '/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.webp' },
    { title: t('home.p5Title'), desc: t('home.p5Desc'), link: '/executive-retreat', img: '/images/executive-retreat/高階主管共識-頁首橫幅.webp' },
    { title: t('home.p6Title'), desc: t('home.p6Desc'), link: '/esg-impact-note', img: '/images/esg-impact-note/ESG-Impact-Note-頁首大橫幅.webp' },
  ];

  return (
    <div>
      {/* 1. Hero Section */}
            {/* 5T-Tangible: 原本 h-screen(100vh) 在桌機過高、且手機 100vh 會被網址列吃掉
                改成 min-h-[clamp()] — 小螢 56vh、桌機 72vh 上限，橫幅比例固定不失控 */}
            <section className="relative flex items-center justify-center bg-ftg-forest overflow-hidden min-h-[52vh] sm:min-h-[58vh] md:min-h-[64vh] lg:min-h-[68vh] max-h-[760px] py-16 sm:py-20 md:py-24">
              <img
                src="/images/hero-banner.webp"
                alt="FTG TOURS 墾趣旅遊 企業員工旅遊戶外旅程橫幅"
                className="absolute inset-0 w-full h-full object-cover"
                fetchPriority="high"
                decoding="async"
                loading="eager"
              />
              {/* 5T-Tangible（2026-10-02 修正）：拿掉外圍遮罩，照片保持明亮。
                                使用者要求「拿掉外圍的遮罩 讓他明亮」「只要一層 照片保持明亮
                                再用一個方框 遮罩 當成字體的背景」。

                                原狀態是「兩層全域遮罩（forest/0.42 + white/0.07）+ black/25
                                文字方框」，等於三層。歷史上的 forest/0.42 是為了救對比，
                                但它把整張照片壓成沉悶色 —— 正好是使用者不要的結果。

                                現在改為零層全域遮罩 + 唯一一層文字方框。代價是方框必須
                                自己扛下全部對比責任（實測，照片亮/中/暗三種情境取最差）：
                                    black/25 → 2.57:1  ❌ 不合格
                                    black/45 → 4.46:1  ❌ 差一點（副標 gray-100 不是大字）
                                    black/50 → 5.24:1  ✅ AA 通過  ← 採用
                                這是為什麼 alpha 從 25 直接跳到 50：不是為了「更暗好看」，
                                而是因為外層已無遮罩墊底，方框是唯一的對比來源。

                                5T-Transparent: 沒有遮罩不等於沒有處理。Tailwind 3 的 opacity
                                是白名單制，black/50 在白名單內，不會被靜默丟棄；仍由
                                scripts/check_overlay_css.py 驗證實際有產生規則。 */}
                            <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
                          {/* 唯一的遮罩：文字方框。照片在其餘面積完全無濾鏡，保持原始亮度。
                              rounded 讓它不覆蓋按鈕的圓角造型。 */}
                          <div className="bg-black/50 rounded-2xl px-4 py-6 md:px-8 md:py-8 -m-1 md:-m-2">
          {/* 5T-Tangible: 移除 whitespace-nowrap。它強制 h1 單行不換行，
              text-6xl 在 <1280px 螢幕必然水平溢出（這是「字跑出邊邊」的根因）。
              改用 text-wrap: balance 讓標題在斷點處優雅折行，字級同步下修。 */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 font-serif leading-tight text-balance break-words px-2">
            {t('home.heroTitle')}
          </h1>
          <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
            {t('home.heroSub')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link to="/corporate-travel" className="bg-ftg-green text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-ftg-forest transition-colors">
              {t('home.exploreBtn')}
            </Link>
            <Link to="/journey-design" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-white/20 transition-colors">
              {t('home.designBtn')}
            </Link>
          </div>
          {/* 4 Feature Tags — 5T-Tangible: 改走 t()，原本硬編中文在英文版會漏字 */}
          <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/15 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium border border-white/20 whitespace-nowrap">
                {t(`home.heroTag${i}`)}
              </span>
            ))}
          </div>
        </div>
            </div>
      </section>

      {/* 2. 為什麼是墾趣 */}
      <section id="esg-section" className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.whyTitle')}</h2>
            <p className="section-subtitle">{t('home.whySub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {t('home.advantageList').map((a, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={ADVANTAGE_ICONS[i % ADVANTAGE_ICONS.length]} size={32} className="text-ftg-green" />
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{a.title}</h3>
                <p className="text-gray-600 text-xs">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 從一趟旅程，看見更多可能 (Three Values) */}
      <section id="esg-section" className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.valuesTitle')}</h2>
            <p className="section-subtitle">{t('home.valuesSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ftg-green/10 rounded-full flex items-center justify-center mb-6">
                <FTGIcon name="leaf" size={32} className="text-ftg-green" />
              </div>
              <h3 className="text-2xl font-bold text-ftg-forest mb-4">{t('home.v1Title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('home.v1Desc')}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ftg-green/10 rounded-full flex items-center justify-center mb-6">
                <FTGIcon name="users" size={32} className="text-ftg-green" />
              </div>
              <h3 className="text-2xl font-bold text-ftg-forest mb-4">{t('home.v2Title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('home.v2Desc')}</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ftg-green/10 rounded-full flex items-center justify-center mb-6">
                <FTGIcon name="heart" size={32} className="text-ftg-green" />
              </div>
              <h3 className="text-2xl font-bold text-ftg-forest mb-4">{t('home.v3Title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('home.v3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 墾趣的旅程特色 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.featuresTitle')}</h2>
            <p className="section-subtitle">{t('home.featuresSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {t('home.featureList').map((f, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-ftg-sand hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={FEATURE_ICONS[i % FEATURE_ICONS.length]} size={28} className="text-ftg-green" />
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{f.title}</h3>
                <p className="text-gray-600 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. 墾趣如何讓企業旅程更完整 */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.processTitle')}</h2>
            <p className="section-subtitle">{t('home.processSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {t('home.processList').map((p, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ftg-green text-white flex items-center justify-center shadow-lg">
                  <FTGIcon name={PROCESS_ICONS[i % PROCESS_ICONS.length]} size={24} className="text-white" />
                </div>
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-ftg-forest text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{p.title}</h3>
                <p className="text-gray-600 text-xs">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. 六大企業旅遊與體驗方案 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.productsTitle')}</h2>
            <p className="section-subtitle">{t('home.productsSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, i) => (
              <Link key={i} to={product.link} className="group bg-ftg-cream rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="aspect-[16/9] overflow-hidden">
                  <img src={product.img} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-center w-10 h-10 bg-ftg-green text-white rounded-full font-bold text-sm mb-3 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-ftg-forest mb-2">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{product.desc}</p>
                  <span className="text-ftg-green font-semibold flex items-center text-sm group-hover:translate-x-2 transition-transform">
                    {t('home.learnMore')}
                    <svg className="ml-1.5 h-6 w-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 適合這些企業時刻 */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.momentsTitle')}</h2>
            <p className="section-subtitle">{t('home.momentsSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {t('home.momentList').map((m, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-white hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={MOMENT_ICONS[i % MOMENT_ICONS.length]} size={28} className="text-ftg-green" />
                </div>
                <h3 className="font-bold text-ftg-forest text-sm">{m.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 從需求到成行，墾趣陪你一起完成 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.stepsTitle')}</h2>
            <p className="section-subtitle">{t('home.stepsSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {t('home.stepList').map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ftg-green text-white flex items-center justify-center shadow-lg">
                  <FTGIcon name={STEP_ICONS[i % STEP_ICONS.length]} size={24} className="text-white" />
                </div>
                <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-ftg-forest text-white flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{s.title}</h3>
                <p className="text-gray-600 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. 專業執行，讓旅程更安全 */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.safetyTitle')}</h2>
            <p className="section-subtitle">{t('home.safetySub')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {t('home.safetyList').map((s, i) => (
              <div key={i} className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={SAFETY_ICONS[i % SAFETY_ICONS.length]} size={24} className="text-ftg-green" />
                </div>
                <p className="text-sm font-medium text-ftg-forest">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. 讓旅程留下值得分享的成果 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title">{t('home.resultsTitle')}</h2>
            <p className="section-subtitle">{t('home.resultsSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {t('home.resultList').map((r, i) => (
              <div key={i} className="bg-ftg-sand rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <h3 className="font-bold text-ftg-forest mb-2">{r.title}</h3>
                <p className="text-gray-600 text-sm">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA Section — 標題 + 表單（與子頁一致） */}
      <section className="py-20 bg-ftg-forest text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <CtaForm
              ctaTitle={t('home.ctaTitle')}
              ctaSub={t('home.ctaSub')}
              features={[t('home.ctaFeature1'), t('home.ctaFeature2'), t('home.ctaFeature3')]}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
