import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-ESG戶外團隊日 (10張)
const teamImages = [
  { src: '/images/esg-team-day/ESG-戶外團隊-走進自然.webp', tKey: 'esgTeamDay.imgTeam1' },
  { src: '/images/esg-team-day/team-day-團隊共創.webp', tKey: 'esgTeamDay.imgTeam2' },
  { src: '/images/esg-team-day/team-day-連結地方與環境.webp', tKey: 'esgTeamDay.imgTeam3' },
];

const expImages = [
  { src: '/images/esg-team-day/可搭配的旅程內容-友善環境行動.webp', tKey: 'esgTeamDay.imgExp1' },
  { src: '/images/esg-team-day/可搭配的旅程內容-團隊合作任務.webp', tKey: 'esgTeamDay.imgExp2' },
  { src: '/images/esg-team-day/可搭配的旅程內容-地方餐食.webp', tKey: 'esgTeamDay.imgExp3' },
  { src: '/images/esg-team-day/可搭配的旅程內容-文化體驗.webp', tKey: 'esgTeamDay.imgExp4' },
  { src: '/images/esg-team-day/可搭配的旅程內容-森林健走.webp', tKey: 'esgTeamDay.imgExp5' },
  { src: '/images/esg-team-day/可搭配的旅程內容-自然觀察.webp', tKey: 'esgTeamDay.imgExp6' },
];

// 靜態圖示對應（設計 / 目標 / 安心 / 加值 / CTA 各區塊）
const designData = [
  { n: 1, icon: 'compass' },
  { n: 2, icon: 'leaf' },
  { n: 3, icon: 'map' },
  { n: 4, icon: 'users' },
  { n: 5, icon: 'shield' },
  { n: 6, icon: 'award' },
];
const targetData = [
  { n: 1, icon: 'leaf' },
  { n: 2, icon: 'users' },
  { n: 3, icon: 'star' },
  { n: 4, icon: 'link' },
  { n: 5, icon: 'star' },
];
const leaveData = [
  { n: 1, icon: 'users' },
  { n: 2, icon: 'leaf' },
  { n: 3, icon: 'local' },
  { n: 4, icon: 'camera' },
  { n: 5, icon: 'users' },
];
const processData = [1, 2, 3, 4, 5].map((n) => ({ n }));
const safetyData = [
  { n: 1, icon: 'users' },
  { n: 2, icon: 'shield' },
  { n: 3, icon: 'mountain' },
  { n: 4, icon: 'sustainable' },
  { n: 5, icon: 'users' },
];
const valueAddData = [
  { n: 1, icon: 'clipboard' },
  { n: 2, icon: 'clipboard' },
  { n: 3, icon: 'calendar' },
  { n: 4, icon: 'link' },
];

// 保留原有 PhotoCard 元件
function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group h-full">
      <img src={src} alt={title} className="w-full h-56 sm:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm">{desc}</p>
      </figcaption>
    </figure>
  );
}

function IconCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center h-full">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-ftg-green/10 text-ftg-green flex items-center justify-center text-2xl mb-3 sm:mb-4">
                  <FTGIcon name={icon} size={28} className="text-ftg-green" />
                </div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-shadow h-full">
      <div className="flex items-center mb-3">
        <span className="w-9 h-9 rounded-full bg-ftg-green text-white flex items-center justify-center font-bold text-sm">{num}</span>
      </div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <h2 className="text-2xl sm:text-3xl font-bold text-ftg-forest mb-8 sm:mb-10 text-center">{title}</h2>
  );
}

export default function EsgTeamDay() {
  const { t } = useLanguage();
  const ctaFeatures = [
    t('esgTeamDay.ctaFeature1'),
    t('esgTeamDay.ctaFeature2'),
    t('esgTeamDay.ctaFeature3'),
    t('esgTeamDay.ctaFeature4'),
  ];
  usePageSeo({
    title: t('products.esgTeamDay'),
    description: t('esgTeamDay.metaDesc'),
    path: '/esg-team-day',
    keywords: ['ESG 戶外團隊日', '企業活動', '團隊凝聚', '無痕山林', '永續行動'],
  });

  return (
    <div>
      {/* 頁首 Hero：保留原有 subpage-hero 區塊 */}
      <section className="subpage-hero">
        <img src="/images/esg-team-day/team-day-頁首大橫幅.webp" alt={t('products.esgTeamDay')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-4 inline-block font-medium inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.esgTeamDay')}</h1>
          <p className="subpage-hero__subtitle">{t('esgTeamDay.sub')}</p>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 1. Benefits Section */}
          <SectionHeading title={t('esgTeamDay.benefitsTitle')} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-14 sm:mb-20">
            {teamImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />
            ))}
          </div>

          {/* 2. Design Section */}
          <SectionHeading title={t('esgTeamDay.designTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-14 sm:mb-20">
            {designData.map((d) => (
              <IconCard key={d.n} icon={d.icon} title={t(`esgTeamDay.design${d.n}Title`)} desc={t(`esgTeamDay.design${d.n}Desc`)} />
            ))}
          </div>

          {/* 3. Target Section */}
          <SectionHeading title={t('esgTeamDay.targetTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-14 sm:mb-20">
            {targetData.map((d) => (
              <IconCard key={d.n} icon={d.icon} title={t(`esgTeamDay.target${d.n}Title`)} desc={t(`esgTeamDay.target${d.n}Desc`)} />
            ))}
          </div>

          {/* 4. Journey Section */}
          <SectionHeading title={t('esgTeamDay.journeyTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-14 sm:mb-20">
            {expImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />
            ))}
          </div>

          {/* 5. Leave Section */}
          <SectionHeading title={t('esgTeamDay.leaveTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 mb-14 sm:mb-20">
            {leaveData.map((d) => (
              <IconCard key={d.n} icon={d.icon} title={t(`esgTeamDay.leave${d.n}Title`)} desc={t(`esgTeamDay.leave${d.n}Desc`)} />
            ))}
          </div>

          {/* 6. Process Section */}
          <SectionHeading title={t('esgTeamDay.processTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-14 sm:mb-20">
            {processData.map((d) => (
              <StepCard key={d.n} num={d.n} title={t(`esgTeamDay.process${d.n}Title`)} desc={t(`esgTeamDay.process${d.n}Desc`)} />
            ))}
          </div>

          {/* 7. Safety Section */}
          <SectionHeading title={t('esgTeamDay.safetyTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 mb-14 sm:mb-20">
            {safetyData.map((d) => (
              <IconCard key={d.n} icon={d.icon} title={t(`esgTeamDay.safety${d.n}Title`)} desc={t(`esgTeamDay.safety${d.n}Desc`)} />
            ))}
          </div>

          {/* 8. Value Add Section */}
          <SectionHeading title={t('esgTeamDay.valueAddTitle')} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-14 sm:mb-20">
            {valueAddData.map((d) => (
              <IconCard key={d.n} icon={d.icon} title={t(`esgTeamDay.valueAdd${d.n}Title`)} desc={t(`esgTeamDay.valueAdd${d.n}Desc`)} />
            ))}
          </div>

          {/* 9. CTA Block — 改用共用 CtaForm 元件（含 RWD 網格與間距優化） */}
          <div className="mb-14 sm:mb-20">
            <CtaForm
              ctaTitle={t('esgTeamDay.ctaBlockTitle')}
              ctaSub={t('esgTeamDay.ctaBlockSub')}
              features={ctaFeatures}
            />
          </div>

        </div>
      </section>
    </div>
  );
}
