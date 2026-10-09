import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-ESG Impact Note (13張)
const noteImages = [
  { src: '/images/esg-impact-note/ESG-Impact-Note-ESG行動亮點.webp', tKey: 'impactNote.note1' },
  { src: '/images/esg-impact-note/ESG-Impact-Note-參與者回饋與感受.webp', tKey: 'impactNote.note2' },
  { src: '/images/esg-impact-note/ESG-Impact-Note-地方及環境貢獻.webp', tKey: 'impactNote.note3' },
  { src: '/images/esg-impact-note/ESG-Impact-Note-旅程與活動全貌.webp', tKey: 'impactNote.note4' },
];

const resultImages = [
  { src: '/images/esg-impact-note/ESG成果內容-地方共好與社會價值.webp', tKey: 'impactNote.res1' },
  { src: '/images/esg-impact-note/成果內容-ESG-SDGs-對應整理.webp', tKey: 'impactNote.res2' },
  { src: '/images/esg-impact-note/成果內容-參與人次與投入紀錄.webp', tKey: 'impactNote.res3' },
  { src: '/images/esg-impact-note/成果內容-員工回饋與影像故事.webp', tKey: 'impactNote.res4' },
  { src: '/images/esg-impact-note/成果內容-後續改善與行動建議.webp', tKey: 'impactNote.res5' },
  { src: '/images/esg-impact-note/成果內容-活動基本資訊與行程摘要.webp', tKey: 'impactNote.res6' },
  { src: '/images/esg-impact-note/成果內容-環境友善行動成果.webp', tKey: 'impactNote.res7' },
  { src: '/images/esg-impact-note/結果內容-員工回饋與影像故事.webp', tKey: 'impactNote.res8' },
];

function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img src={src} alt={title} className="w-full h-60 sm:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm mt-1">{desc}</p>
      </figcaption>
    </figure>
  );
}

function IconCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* 5T-Tangible：這裡原本是 bg-ftg-green 底卻給 icon text-ftg-green —— 同色相疊，
          深綠線畫在深綠圓上等於隱形（空白綠圈）。圓底既然是實色深綠，線就必須反白。
          FTGIcon 的 className 會覆寫父層 text-white，所以要改在 icon 自身上。 */}
      <div className="w-12 h-12 rounded-full bg-ftg-green text-white flex items-center justify-center text-2xl mb-4 shrink-0">
        <FTGIcon name={icon} size={28} className="text-white" />
      </div>
      <h3 className="text-lg font-bold text-ftg-forest mb-2 leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function SectionTitle({ children, light }) {
  return (
    <h2 className={`text-2xl md:text-3xl font-bold mb-8 md:mb-10 text-center ${light ? 'text-white' : 'text-ftg-forest'}`}>
      {children}
    </h2>
  );
}

export default function EsgImpactNote() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('products.impactNote'),
    description: t('impactNote.metaDesc'),
    path: '/esg-impact-note',
    keywords: ['ESG Impact Note', '活動成果', '雇主品牌', '永續溝通', 'ESG 素材'],
  });

  // 1. Benefits — 3 cards with images from noteImages
  const benefitCards = [1, 2, 3].map((n) => ({
    src: noteImages[n - 1].src,
    title: t(`impactNote.benefit${n}Title`),
    desc: t(`impactNote.benefit${n}Desc`),
  }));

  // 2. Design — 6 icon cards
  const designIcons = ['compass', 'puzzle', 'clipboard', 'pencil', 'refresh', 'star'];
  const designCards = [1, 2, 3, 4, 5, 6].map((n) => ({
    icon: designIcons[n - 1],
    title: t(`impactNote.design${n}Title`),
    desc: t(`impactNote.design${n}Desc`),
  }));

  // 3. Target — 5 icon cards
  const targetIcons = ['clipboard', 'tag', 'users', 'folder', 'users'];
  const targetCards = [1, 2, 3, 4, 5].map((n) => ({
    icon: targetIcons[n - 1],
    title: t(`impactNote.target${n}Title`),
    desc: t(`impactNote.target${n}Desc`),
  }));

  // 5. Leave — 5 cards
  const leaveCards = [1, 2, 3, 4, 5].map((n) => ({
    title: t(`impactNote.leave${n}Title`),
    desc: t(`impactNote.leave${n}Desc`),
  }));

  // 6. Process — 5 numbered steps
  const processSteps = [1, 2, 3, 4, 5].map((n) => ({
    title: t(`impactNote.process${n}Title`),
    desc: t(`impactNote.process${n}Desc`),
  }));

  // 7. Safety — 5 cards
  const safetyIcons = ['users', 'check', 'clipboard', 'shield', 'safety'];
  const safetyCards = [1, 2, 3, 4, 5].map((n) => ({
    icon: safetyIcons[n - 1],
    title: t(`impactNote.safety${n}Title`),
    desc: t(`impactNote.safety${n}Desc`),
  }));

  // 8. Value Add — 4 cards
  const valueIcons = ['compass', 'star', 'calendar', 'tool'];
  const valueCards = [1, 2, 3, 4].map((n) => ({
    icon: valueIcons[n - 1],
    title: t(`impactNote.valueAdd${n}Title`),
    desc: t(`impactNote.valueAdd${n}Desc`),
  }));

  // 9. CTA — 4 features
  const ctaFeatures = [1, 2, 3, 4].map((n) => t(`impactNote.ctaFeature${n}`));

  return (
    <div>
      <section className="subpage-hero">
        <img src="/images/esg-impact-note/ESG-Impact-Note-頁首大橫幅.webp" alt={t('products.impactNote')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-3 sm:mb-4 inline-block font-medium inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.impactNote')}</h1>
          <p className="subpage-hero__subtitle">{t('impactNote.sub')}</p>
        </div>
      </section>

      {/* 1. Benefits Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.benefitsTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {benefitCards.map((c, i) => (
              <PhotoCard key={i} src={c.src} title={c.title} desc={c.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Design Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.designTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {designCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Target Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.targetTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {targetCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Journey Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.journeyTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {resultImages.map((p, i) => (
              <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Leave Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.leaveTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {leaveCards.map((c, i) => (
              <div key={i} className="bg-ftg-cream rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow flex items-start gap-4 h-full">
                <span className="text-ftg-green shrink-0">
                  <FTGIcon name="check" size={24} />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ftg-forest mb-1 leading-snug">{c.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Process Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.processTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
            {processSteps.map((s, i) => (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-ftg-green text-white flex items-center justify-center text-xl font-bold mb-4 shadow-md shrink-0">{i + 1}</div>
                <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2 leading-snug">{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Safety Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.safetyTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {safetyCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />
            ))}
          </div>
          <div className="mt-8 md:mt-10 bg-yellow-50 border border-yellow-200 rounded-2xl p-6 md:p-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">{t('impactNote.disclaimerTitle')}</h3>
            <p className="text-gray-700 text-sm leading-relaxed">{t('impactNote.disclaimer')}</p>
          </div>
        </div>
      </section>

      {/* 8. Value Add Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('impactNote.valueAddTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {valueCards.map((c, i) => (
              <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. CTA Block */}
      <section className="py-12 md:py-16 lg:py-20 bg-ftg-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <CtaForm
            ctaTitle={t('impactNote.ctaBlockTitle')}
            ctaSub={t('impactNote.ctaBlockSub')}
            features={ctaFeatures}
          />
        </div>
      </section>
    </div>
  );
}
