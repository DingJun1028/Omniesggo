import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-企業家庭日 可搭配體驗 (6張)
const expImages = [
  { src: '/images/family-day/可搭配的體驗-地方餐食.webp', tKey: 'familyDay.imgExp1' },
  { src: '/images/family-day/可搭配的體驗-手作體驗png.webp', tKey: 'familyDay.imgExp2' },
  { src: '/images/family-day/可搭配的體驗-森林慢行.webp', tKey: 'familyDay.imgExp3' },
  { src: '/images/family-day/可搭配的體驗-無痕戶外.webp', tKey: 'familyDay.imgExp4' },
  { src: '/images/family-day/可搭配的體驗-親子任務.webp', tKey: 'familyDay.imgExp5' },
  { src: '/images/family-day/可搭配的體驗-親子自然觀察.webp', tKey: 'familyDay.imgExp6' },
];

// 1. Benefits：3 張圖卡（取用「好的企業家庭日」圖庫中標題相符者）
const benefitCards = [
  { src: '/images/family-day/好的企業家庭日-親子互動更緊密.webp', titleKey: 'familyDay.benefit1Title', descKey: 'familyDay.benefit1Desc' },
  { src: '/images/family-day/好的企業家庭日-自然共學與成長.webp', titleKey: 'familyDay.benefit2Title', descKey: 'familyDay.benefit2Desc' },
  { src: '/images/family-day/好的企業家庭日-企業關懷更有感.webp', titleKey: 'familyDay.benefit3Title', descKey: 'familyDay.benefit3Desc' },
];

// 2. Design：6 張圖示卡
const designCards = [
  { icon: 'users', titleKey: 'familyDay.design1Title', descKey: 'familyDay.design1Desc' },
  { icon: 'star', titleKey: 'familyDay.design2Title', descKey: 'familyDay.design2Desc' },
  { icon: 'compass', titleKey: 'familyDay.design3Title', descKey: 'familyDay.design3Desc' },
  { icon: 'utensils', titleKey: 'familyDay.design4Title', descKey: 'familyDay.design4Desc' },
  { icon: 'shield', titleKey: 'familyDay.design5Title', descKey: 'familyDay.design5Desc' },
  { icon: 'award', titleKey: 'familyDay.design6Title', descKey: 'familyDay.design6Desc' },
];

// 3. Target：5 張圖示卡
const targetCards = [
  { icon: 'calendar', titleKey: 'familyDay.target1Title', descKey: 'familyDay.target1Desc' },
  { icon: 'heart', titleKey: 'familyDay.target2Title', descKey: 'familyDay.target2Desc' },
  { icon: 'users', titleKey: 'familyDay.target3Title', descKey: 'familyDay.target3Desc' },
  { icon: 'clipboard', titleKey: 'familyDay.target4Title', descKey: 'familyDay.target4Desc' },
  { icon: 'users', titleKey: 'familyDay.target5Title', descKey: 'familyDay.target5Desc' },
];

// 5. Leave：5 張圖示卡
const leaveCards = [
  { icon: 'heart', titleKey: 'familyDay.leave1Title', descKey: 'familyDay.leave1Desc' },
  { icon: 'star', titleKey: 'familyDay.leave2Title', descKey: 'familyDay.leave2Desc' },
  { icon: 'leaf', titleKey: 'familyDay.leave3Title', descKey: 'familyDay.leave3Desc' },
  { icon: 'award', titleKey: 'familyDay.leave4Title', descKey: 'familyDay.leave4Desc' },
  { icon: 'smile', titleKey: 'familyDay.leave5Title', descKey: 'familyDay.leave5Desc' },
];

// 6. Process：5 個編號步驟
const processSteps = [
  { titleKey: 'familyDay.process1Title', descKey: 'familyDay.process1Desc' },
  { titleKey: 'familyDay.process2Title', descKey: 'familyDay.process2Desc' },
  { titleKey: 'familyDay.process3Title', descKey: 'familyDay.process3Desc' },
  { titleKey: 'familyDay.process4Title', descKey: 'familyDay.process4Desc' },
  { titleKey: 'familyDay.process5Title', descKey: 'familyDay.process5Desc' },
];

// 7. Safety：5 張圖示卡
const safetyCards = [
  { icon: 'shield', titleKey: 'familyDay.safety1Title', descKey: 'familyDay.safety1Desc' },
  { icon: 'navigation', titleKey: 'familyDay.safety2Title', descKey: 'familyDay.safety2Desc' },
  { icon: 'users', titleKey: 'familyDay.safety3Title', descKey: 'familyDay.safety3Desc' },
  { icon: 'clipboard', titleKey: 'familyDay.safety4Title', descKey: 'familyDay.safety4Desc' },
  { icon: 'users', titleKey: 'familyDay.safety5Title', descKey: 'familyDay.safety5Desc' },
];

// 8. Value Add：4 張圖示卡
const valueAddCards = [
  { icon: 'clipboard', titleKey: 'familyDay.valueAdd1Title', descKey: 'familyDay.valueAdd1Desc' },
  { icon: 'leaf', titleKey: 'familyDay.valueAdd2Title', descKey: 'familyDay.valueAdd2Desc' },
  { icon: 'calendar', titleKey: 'familyDay.valueAdd3Title', descKey: 'familyDay.valueAdd3Desc' },
  { icon: 'link', titleKey: 'familyDay.valueAdd4Title', descKey: 'familyDay.valueAdd4Desc' },
];

function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img src={src} alt={title} className="w-full h-60 sm:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-4 sm:p-5">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm mt-1">{desc}</p>
      </figcaption>
    </figure>
  );
}

function IconCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl card-responsive text-center hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-ftg-green/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
        <FTGIcon name={icon} size={28} className="text-ftg-green" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function FamilyDay() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('products.familyDay'),
    description: t('familyDay.metaDesc'),
    path: '/family-day',
    keywords: ['企業家庭日', '親子活動', '雇主品牌', '永續教育', '員工家庭關懷'],
  });

  const ctaFeatures = [
    t('familyDay.ctaFeature1'), t('familyDay.ctaFeature2'),
    t('familyDay.ctaFeature3'), t('familyDay.ctaFeature4'),
  ];

  return (
    <div>
      <section className="subpage-hero">
        <img src="/images/family-day/企業家庭日-頁首大橫幅.webp" alt={t('products.familyDay')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-3 sm:mb-4 inline-block font-medium text-sm sm:text-base inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.familyDay')}</h1>
          <p className="subpage-hero__subtitle">{t('familyDay.sub')}</p>
        </div>
      </section>

      {/* 1. Benefits Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.benefitsTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {benefitCards.map((c, i) => (
              <PhotoCard key={i} src={c.src} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Design Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-ftg-cream/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.designTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {designCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Target Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.targetTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {targetCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Journey Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-ftg-cream/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.journeyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {expImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Leave Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.leaveTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {leaveCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Process Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-ftg-cream/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.processTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {processSteps.map((s, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm flex items-start gap-3 sm:gap-4 h-full">
                <span className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-ftg-green text-white rounded-full flex items-center justify-center font-bold text-base sm:text-lg">{i + 1}</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-1">{t(s.titleKey)}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{t(s.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Safety Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.safetyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {safetyCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Value Add Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-ftg-cream/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-title text-center">{t('familyDay.valueAddTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {valueAddCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={t(c.titleKey)} desc={t(c.descKey)} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Block */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CtaForm
            ctaTitle={t('familyDay.ctaBlockTitle')}
            ctaSub={t('familyDay.ctaBlockSub')}
            features={ctaFeatures}
          />
        </div>
      </section>
    </div>
  );
}
