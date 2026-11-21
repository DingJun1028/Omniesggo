import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import FTGIcon from '../components/FTGIcon';
import CtaForm from '../components/CtaForm';

// 5T-Tangible: 本頁原本整份文案硬編繁中，英文介面下仍顯示中文。
// 上一版註解寫著「待補：將本頁文案抽入 translations.js」但從未補上，
// 這裡正式接入 journeyDesign 命名空間。
//
// 另外原本 <CtaForm /> 沒有傳任何 props，CtaForm 內的深綠抬頭帶
// （<h3>{ctaTitle}</h3>）會渲染成空的 — 等於一整塊空白深綠區。
// 與 About.jsx 是同一類缺陷，兩處一併補齊（修類不修例）。

const VALUES = [
  { icon: 'leaf', titleKey: 'journeyDesign.v1Title', descKey: 'journeyDesign.v1Desc' },
  { icon: 'users', titleKey: 'journeyDesign.v2Title', descKey: 'journeyDesign.v2Desc' },
  { icon: 'sustainable', titleKey: 'journeyDesign.v3Title', descKey: 'journeyDesign.v3Desc' },
];

const STEPS = [
  { icon: 'clipboard', titleKey: 'journeyDesign.p1Title', descKey: 'journeyDesign.p1Desc' },
  { icon: 'map', titleKey: 'journeyDesign.p2Title', descKey: 'journeyDesign.p2Desc' },
  { icon: 'users', titleKey: 'journeyDesign.p3Title', descKey: 'journeyDesign.p3Desc' },
  { icon: 'navigation', titleKey: 'journeyDesign.p4Title', descKey: 'journeyDesign.p4Desc' },
  { icon: 'award', titleKey: 'journeyDesign.p5Title', descKey: 'journeyDesign.p5Desc' },
];

const ADVANTAGES = [
  { icon: 'mountain', titleKey: 'journeyDesign.w1Title', descKey: 'journeyDesign.w1Desc' },
  { icon: 'compass', titleKey: 'journeyDesign.w2Title', descKey: 'journeyDesign.w2Desc' },
  { icon: 'shield', titleKey: 'journeyDesign.w3Title', descKey: 'journeyDesign.w3Desc' },
  { icon: 'link', titleKey: 'journeyDesign.w4Title', descKey: 'journeyDesign.w4Desc' },
  { icon: 'sustainable', titleKey: 'journeyDesign.w5Title', descKey: 'journeyDesign.w5Desc' },
];

export default function JourneyDesign() {
  const { t } = useLanguage();

  usePageSeo({
    title: t('journeyDesign.metaTitle'),
    description: t('journeyDesign.metaDesc'),
    path: '/journey-design',
    keywords: t('journeyDesign.keywords').split(','),
  });

  const ctaFeatures = [
    t('journeyDesign.ctaFeature1'),
    t('journeyDesign.ctaFeature2'),
    t('journeyDesign.ctaFeature3'),
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ftg-forest text-white py-20 md:py-28 overflow-hidden">
        {/* 5T-Tangible: 原本這裡有一層 bg-ftg-forest/95 遮罩，疊在下方同色的
            bg-ftg-forest 實色底上。實測疊完顏色完全不變（rgb(26,58,46) →
            rgb(26,58,46)），是純冗餘層：對「畫面變亮」毫無貢獻，卻讓維護者
            誤以為有加深效果而去調它。已移除，實際對比維持 12.44:1。 */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* 5T-Tangible: 觸控區 >= 44px（WCAG 2.5.8）。text-sm 單行只有 ~24px，
              用 -my-2 抵銷 padding，視覺位置不變。 */}
          <Link to="/" className="inline-flex items-center gap-2 text-ftg-orange hover:text-white transition-colors mb-6 text-sm min-h-[44px] min-w-[44px] -my-2">
            {t('journeyDesign.backHome')}
          </Link>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 font-serif leading-tight">
            {t('journeyDesign.h1')}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            {t('journeyDesign.sub')}
          </p>
        </div>
      </section>

      {/* 設計理念 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="section-title">{t('journeyDesign.valuesTitle')}</h2>
            <p className="section-subtitle">{t('journeyDesign.valuesSub')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((item, i) => (
              <div key={i} className="text-center p-6 bg-ftg-sand rounded-2xl">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={item.icon} size={32} className="text-ftg-green" />
                </div>
                <h3 className="text-xl font-bold text-ftg-forest mb-3">{t(item.titleKey)}</h3>
                <p className="text-gray-600 leading-relaxed">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 設計流程 */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="section-title">{t('journeyDesign.processTitle')}</h2>
            <p className="section-subtitle">{t('journeyDesign.processSub')}</p>
          </div>
          <div className="max-w-4xl mx-auto">
            {STEPS.map((step, i) => (
              <div key={i} className="flex gap-6 mb-8 last:mb-0">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-ftg-forest text-white flex items-center justify-center text-xl font-bold shadow-lg">
                    {i + 1}
                  </div>
                  {i < STEPS.length - 1 && <div className="w-0.5 h-full bg-ftg-green/30 mx-auto mt-2"></div>}
                </div>
                <div className="pb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <FTGIcon name={step.icon} size={24} className="text-ftg-green" />
                    <h3 className="text-xl font-bold text-ftg-forest">{t(step.titleKey)}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 為什麼選擇墾趣 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="section-title">{t('journeyDesign.whyTitle')}</h2>
            <p className="section-subtitle">{t('journeyDesign.whySub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {ADVANTAGES.map((item, i) => (
              <div key={i} className="text-center p-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={item.icon} size={24} className="text-ftg-green" />
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{t(item.titleKey)}</h3>
                <p className="text-gray-600 text-xs">{t(item.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-ftg-forest text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 font-serif">{t('journeyDesign.ctaTitle')}</h2>
              <p className="text-lg md:text-xl text-gray-200 mb-8 leading-relaxed">
                {t('journeyDesign.ctaSub')}
              </p>
              <div className="flex items-center gap-4 text-gray-300 text-sm">
                <div className="flex items-center gap-2"><FTGIcon name="shield" size={20} /> {t('journeyDesign.ctaFeature1')}</div>
                <div className="flex items-center gap-2"><FTGIcon name="award" size={20} /> {t('journeyDesign.ctaFeature2')}</div>
                <div className="flex items-center gap-2"><FTGIcon name="heart" size={20} /> {t('journeyDesign.ctaFeature3')}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-gray-800">
              <CtaForm
                ctaTitle={t('journeyDesign.ctaBlockTitle')}
                ctaSub={t('journeyDesign.ctaBlockSub')}
                features={ctaFeatures}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
