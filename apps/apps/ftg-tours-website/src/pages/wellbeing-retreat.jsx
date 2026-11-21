import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-員工身心平衡旅程 (11張)
const images = [
  { src: '/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.webp', tKey: 'wellbeing.imgBanner' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-企業文化溫度.webp', tKey: 'wellbeing.img1' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-可分享的活動素材.webp', tKey: 'wellbeing.img2' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-員工放鬆回憶.webp', tKey: 'wellbeing.img3' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-團隊可更自交流.webp', tKey: 'wellbeing.img4' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-團隊更自然的連結.webp', tKey: 'wellbeing.img5' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-後續活動靈感.webp', tKey: 'wellbeing.img6' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-恢復能量.webp', tKey: 'wellbeing.img7' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-放鬆節奏.webp', tKey: 'wellbeing.img8' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-留下值得分享的回憶.webp', tKey: 'wellbeing.img9' },
  { src: '/images/wellbeing-retreat/旅程可以留下什麼-自然中的安定感.webp', tKey: 'wellbeing.img10' },
];

function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group h-full">
      <img src={src} alt={title} className="w-full h-56 sm:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm">{desc}</p>
      </figcaption>
    </figure>
  );
}

// 圖標（呈現用，非翻譯內容）— FTGIcon SVG 名稱
const benefitIcons = ['leaf', 'leaf', 'users', 'star', 'star'];
const designIcons = ['mail', 'map', 'shield', 'tree', 'utensils', 'calendar', 'compass', 'clipboard'];
const leaveIcons = ['wind', 'link', 'heart', 'camera', 'star'];
const safetyIcons = ['local', 'shield', 'mountain', 'compass', 'safety'];

const benefitKeys = ['benefit1', 'benefit2', 'benefit3', 'benefit4', 'benefit5'];
const designKeys = ['design1', 'design2', 'design3', 'design4', 'design5', 'design6', 'design7', 'design8'];
const leaveKeys = ['leave1', 'leave2', 'leave3', 'leave4', 'leave5'];
const safetyKeys = ['safety1', 'safety2', 'safety3', 'safety4', 'safety5'];
const journeyKeys = ['journey1', 'journey2', 'journey3', 'journey4', 'journey5', 'journey6'];
const processKeys = ['process1', 'process2', 'process3', 'process4', 'process5'];

function IconCard({ icon, title, desc }) {
  return (
    <div className="bg-ftg-cream rounded-2xl p-6 text-center h-full hover:shadow-lg transition-shadow flex flex-col">
      <div className="text-4xl mb-3 flex items-center justify-center" aria-hidden="true">
        <FTGIcon name={icon} size={32} className="text-ftg-green" />
      </div>
      <h3 className="font-bold text-ftg-forest mb-2 text-lg leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function WellbeingRetreat() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('products.wellbeing'),
    description: t('wellbeing.metaDesc'),
    path: '/wellbeing-retreat',
    keywords: ['員工身心平衡旅程', '員工福祉', '高壓紓壓', '團隊對話', '自然休養'],
  });

  const targetImages = images.slice(1).slice(0, 4);
  const targetKeys = ['target1', 'target2', 'target3', 'target4'];
  const valueAddImages = images.slice(1).slice(4, 8);
  const valueAddKeys = ['valueAdd1', 'valueAdd2', 'valueAdd3', 'valueAdd4'];
  const ctaFeatures = ['ctaFeature1', 'ctaFeature2', 'ctaFeature3', 'ctaFeature4'];

  return (
    <div>
      {/* Hero（保留原有 subpage-hero） */}
      <section className="subpage-hero">
        <img src="/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.webp" alt={t('products.wellbeing')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-4 inline-block font-medium inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.wellbeing')}</h1>
          <p className="subpage-hero__subtitle">{t('wellbeing.sub')}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 1. Benefits */}
        <section className="section-padding">
          <h2 className="section-title text-center">{t('wellbeing.benefitsTitle')}</h2>
          <div className="grid grid-5-responsive gap-5 sm:gap-6 mt-8">
            {benefitKeys.map((k, i) => (
              <IconCard key={k} icon={benefitIcons[i]} title={t(`wellbeing.${k}Title`)} desc={t(`wellbeing.${k}Desc`)} />
            ))}
          </div>
        </section>

        {/* 2. Design */}
        <section className="section-padding bg-ftg-sand rounded-3xl">
          <h2 className="section-title text-center">{t('wellbeing.designTitle')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {designKeys.map((k, i) => (
              <IconCard key={k} icon={designIcons[i]} title={t(`wellbeing.${k}Title`)} desc={t(`wellbeing.${k}Desc`)} />
            ))}
          </div>
        </section>

        {/* 3. Target */}
        <section className="section-padding">
          <h2 className="section-title text-center">{t('wellbeing.targetTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-8">
            {targetImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(`wellbeing.${targetKeys[i]}Title`)} desc={t(`wellbeing.${targetKeys[i]}Desc`)} />
            ))}
          </div>
        </section>

        {/* 4. Journey (timeline) */}
        <section className="section-padding bg-ftg-cream rounded-3xl">
          <h2 className="section-title text-center">{t('wellbeing.journeyTitle')}</h2>
          <ol className="relative mt-10 max-w-3xl mx-auto pl-12">
            <span className="absolute left-4 top-2 bottom-2 w-0.5 bg-ftg-green/30" aria-hidden="true"></span>
            {journeyKeys.map((k, i) => (
              <li key={k} className="relative mb-8 last:mb-0">
                <span className="absolute -left-12 top-0 w-8 h-8 rounded-full bg-ftg-green text-white flex items-center justify-center font-bold text-sm shadow">{i + 1}</span>
                <h3 className="font-bold text-ftg-forest text-lg mb-1">{t(`wellbeing.${k}Title`)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(`wellbeing.${k}Desc`)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 5. Leave */}
        <section className="section-padding">
          <h2 className="section-title text-center">{t('wellbeing.leaveTitle')}</h2>
          <div className="grid grid-5-responsive gap-5 sm:gap-6 mt-8">
            {leaveKeys.map((k, i) => (
              <IconCard key={k} icon={leaveIcons[i]} title={t(`wellbeing.${k}Title`)} desc={t(`wellbeing.${k}Desc`)} />
            ))}
          </div>
        </section>

        {/* 6. Process */}
        <section className="section-padding bg-ftg-sand rounded-3xl">
          <h2 className="section-title text-center">{t('wellbeing.processTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mt-8">
            {processKeys.map((k, i) => (
              <div key={k} className="relative text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-ftg-green text-white flex items-center justify-center text-xl font-bold">{i + 1}</div>
                <h3 className="font-bold text-ftg-forest mb-2 text-lg leading-snug">{t(`wellbeing.${k}Title`)}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{t(`wellbeing.${k}Desc`)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Safety */}
        <section className="section-padding">
          <h2 className="section-title text-center">{t('wellbeing.safetyTitle')}</h2>
          <div className="grid grid-5-responsive gap-5 sm:gap-6 mt-8">
            {safetyKeys.map((k, i) => (
              <IconCard key={k} icon={safetyIcons[i]} title={t(`wellbeing.${k}Title`)} desc={t(`wellbeing.${k}Desc`)} />
            ))}
          </div>
        </section>

        {/* 8. Value Add */}
        <section className="section-padding bg-ftg-cream rounded-3xl">
          <h2 className="section-title text-center">{t('wellbeing.valueAddTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mt-8">
            {valueAddImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(`wellbeing.${valueAddKeys[i]}Title`)} desc={t(`wellbeing.${valueAddKeys[i]}Desc`)} />
            ))}
          </div>
        </section>

        {/* 9. CTA Block */}
        <section className="section-padding">
          <div className="max-w-5xl mx-auto">
            <CtaForm
              ctaTitle={t('wellbeing.ctaBlockTitle')}
              ctaSub={t('wellbeing.ctaBlockSub')}
              features={ctaFeatures.map((f) => t(`wellbeing.${f}`))}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
