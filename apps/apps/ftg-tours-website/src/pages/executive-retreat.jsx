import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-高階主管共識旅程 (10張)
const expImages = [
  { src: '/images/executive-retreat/可搭配的旅程內容-圓桌對話.webp', tKey: 'executive.imgExp1' },
  { src: '/images/executive-retreat/可搭配的旅程內容-團隊共學.webp', tKey: 'executive.imgExp2' },
  { src: '/images/executive-retreat/可搭配的旅程內容-在地餐集.webp', tKey: 'executive.imgExp3' },
  { src: '/images/executive-retreat/可搭配的旅程內容-山林慢行.webp', tKey: 'executive.imgExp4' },
  { src: '/images/executive-retreat/可搭配的旅程內容-文化體驗.webp', tKey: 'executive.imgExp5' },
  { src: '/images/executive-retreat/可搭配的旅程內容-靜心觀景.webp', tKey: 'executive.imgExp6' },
];

const consensusImages = [
  { src: '/images/executive-retreat/高階主管共識-放慢腳步與重新思考.webp', tKey: 'executive.imgCon1' },
  { src: '/images/executive-retreat/高階主管共識-連結自然與對方.webp', tKey: 'executive.imgCon2' },
  { src: '/images/executive-retreat/高階主管共識-領導團隊對話.webp', tKey: 'executive.imgCon3' },
];

function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img src={src} alt={title} className="w-full h-60 sm:h-64 md:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm">{desc}</p>
      </figcaption>
    </figure>
  );
}

function SectionTitle({ children, light = false }) {
  return (
    <h2 className={`text-2xl sm:text-3xl font-bold mb-8 sm:mb-10 text-center ${light ? 'text-white' : 'text-ftg-forest'}`}>
      {children}
    </h2>
  );
}

function IconCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-shadow h-full">
      <div className="w-12 h-12 rounded-full bg-ftg-cream text-2xl flex items-center justify-center mb-4">
                  <FTGIcon name={icon} size={28} className="text-ftg-green" />
                </div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2 leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Card({ title, desc }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg transition-shadow h-full">
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2 leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Step({ num, title, desc }) {
  return (
    <div className="relative flex flex-col items-center text-center px-2">
      <div className="w-12 h-12 rounded-full bg-ftg-green text-white flex items-center justify-center font-bold text-lg mb-4 shrink-0">{num}</div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2 leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function ExecutiveRetreat() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('products.executive'),
    description: t('executive.metaDesc'),
    path: '/executive-retreat',
    keywords: ['共識營', '高階主管', '永續轉型', '策略對話', '主管共識旅程'],
  });

  // 原本這裡是 [0],[1],[3]，靠「跳過 index 2 的頁首橫幅」來避開重複的
  // imgCon3；橫幅已從陣列移除後，index 3 不存在會渲染出 undefined，
  // 所以三張就是全部，直接用整個陣列。
  const consensusShow = consensusImages;
  const benefits = consensusShow.map((p) => ({ src: p.src, title: t(p.tKey), desc: t(p.tKey + 'Desc') }));

  const designIcons = ['compass', 'map', 'shield', 'users', 'leaf', 'clipboard'];
  const designCards = [1, 2, 3, 4, 5, 6].map((i) => ({
    icon: designIcons[i - 1],
    title: t(`executive.design${i}Title`),
    desc: t(`executive.design${i}Desc`),
  }));

  const targetIcons = ['compass', 'refresh', 'leaf', 'users', 'users'];
  const targetCards = [1, 2, 3, 4, 5].map((i) => ({
    icon: targetIcons[i - 1],
    title: t(`executive.target${i}Title`),
    desc: t(`executive.target${i}Desc`),
  }));

  const leaveCards = [1, 2, 3, 4, 5].map((i) => ({
    title: t(`executive.leave${i}Title`),
    desc: t(`executive.leave${i}Desc`),
  }));

  const processCards = [1, 2, 3, 4, 5].map((i) => ({
    title: t(`executive.process${i}Title`),
    desc: t(`executive.process${i}Desc`),
  }));

  const safetyIcons = ['users', 'navigation', 'mountain', 'mail', 'users'];
  const safetyCards = [1, 2, 3, 4, 5].map((i) => ({
    icon: safetyIcons[i - 1],
    title: t(`executive.safety${i}Title`),
    desc: t(`executive.safety${i}Desc`),
  }));

  const valueAddCards = [1, 2, 3, 4].map((i) => ({
    title: t(`executive.valueAdd${i}Title`),
    desc: t(`executive.valueAdd${i}Desc`),
  }));

  const ctaFeatures = [1, 2, 3, 4].map((i) => t(`executive.ctaFeature${i}`));

  return (
    <div>
      <section className="subpage-hero">
        <img src="/images/executive-retreat/高階主管共識-頁首橫幅.webp" alt={t('products.executive')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-4 inline-block font-medium inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.executive')}</h1>
          <p className="subpage-hero__subtitle">{t('executive.sub')}</p>
        </div>
      </section>

      {/* 1. Benefits Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.benefitsTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {benefits.map((b, i) => <PhotoCard key={i} src={b.src} title={b.title} desc={b.desc} />)}
          </div>
        </div>
      </section>

      {/* 2. Design Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.designTitle')}</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
            {designCards.map((c, i) => <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />)}
          </div>
        </div>
      </section>

      {/* 3. Target Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.targetTitle')}</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {targetCards.map((c, i) => <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />)}
          </div>
        </div>
      </section>

      {/* 4. Journey Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.journeyTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {expImages.map((p, i) => <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />)}
          </div>
        </div>
      </section>

      {/* 5. Leave Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.leaveTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {leaveCards.map((c, i) => <Card key={i} title={c.title} desc={c.desc} />)}
          </div>
        </div>
      </section>

      {/* 6. Process Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.processTitle')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 sm:gap-8">
            {processCards.map((s, i) => <Step key={i} num={i + 1} title={s.title} desc={s.desc} />)}
          </div>
        </div>
      </section>

      {/* 7. Safety Section */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.safetyTitle')}</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
            {safetyCards.map((c, i) => <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />)}
          </div>
        </div>
      </section>

      {/* 8. Value Add Section */}
      <section className="py-12 md:py-16 bg-ftg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionTitle>{t('executive.valueAddTitle')}</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {valueAddCards.map((c, i) => <Card key={i} title={c.title} desc={c.desc} />)}
          </div>
        </div>
      </section>

      {/* 9. CTA Block */}
      <section className="py-12 md:py-16 bg-ftg-green">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <CtaForm
            ctaTitle={t('executive.ctaBlockTitle')}
            ctaSub={t('executive.ctaBlockSub')}
            features={ctaFeatures}
          />
        </div>
      </section>
    </div>
  );
}
