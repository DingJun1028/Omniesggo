import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import CtaForm from '../components/CtaForm';
import FTGIcon from '../components/FTGIcon';

// 嚴格照資料夾原始順序：子網頁-企業員工旅遊 (14張)
const travelImages = [
  { src: '/images/corporate-travel/企業員工旅遊-團隊交流.webp', tKey: 'corporateTravel.imgTravel1' },
  { src: '/images/corporate-travel/企業員工旅遊-放鬆與充電.webp', tKey: 'corporateTravel.imgTravel2' },
  { src: '/images/corporate-travel/企業員工旅遊-自然與地方體驗.webp', tKey: 'corporateTravel.imgTravel3' },
];

const valueImages = [
  { src: '/images/corporate-travel/可延伸加值服務-串接-Team-Day-Wellbeing-Retreat.webp', tKey: 'corporateTravel.imgVal1' },
  { src: '/images/corporate-travel/可延伸加值服務-年度企業活動規劃.webp', tKey: 'corporateTravel.imgVal2' },
  { src: '/images/corporate-travel/可延伸的加值服務-Basic-Impact-Summary.webp', tKey: 'corporateTravel.imgVal3' },
  { src: '/images/corporate-travel/可延伸的加值服務-ESG-Impact-Note.webp', tKey: 'corporateTravel.imgVal4' },
];

const expImages = [
  { src: '/images/corporate-travel/搭配旅程-地方餐食.webp', tKey: 'corporateTravel.imgExp1' },
  { src: '/images/corporate-travel/搭配旅程-文化體驗.webp', tKey: 'corporateTravel.imgExp2' },
  { src: '/images/corporate-travel/搭配旅程-森林慢行.webp', tKey: 'corporateTravel.imgExp3' },
  { src: '/images/corporate-travel/搭配旅程-無痕戶外.webp', tKey: 'corporateTravel.imgExp4' },
  { src: '/images/corporate-travel/搭配旅程-親近自然.webp', tKey: 'corporateTravel.imgExp5' },
  { src: '/images/corporate-travel/搭配旅程-輕量團隊互動.webp', tKey: 'corporateTravel.imgExp6' },
];

function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img src={src} alt={title} className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105" loading="lazy" />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 md:p-4">
        <h3 className="text-white text-base md:text-lg font-bold">{title}</h3>
        <p className="text-gray-200 text-xs md:text-sm">{desc}</p>
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

export default function CorporateTravel() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('products.corpTravel'),
    description: t('corporateTravel.metaDesc'),
    path: '/corporate-travel',
    keywords: ['企業員工旅遊', 'Team Building', '戶外體驗', 'ESG 活動', '公司旅遊'],
  });

  const designCards = [
    { icon: 'compass', title: t('corporateTravel.design1Title'), desc: t('corporateTravel.design1Desc') },
    { icon: 'mountain', title: t('corporateTravel.design2Title'), desc: t('corporateTravel.design2Desc') },
    { icon: 'utensils', title: t('corporateTravel.design3Title'), desc: t('corporateTravel.design3Desc') },
    { icon: 'leaf', title: t('corporateTravel.design4Title'), desc: t('corporateTravel.design4Desc') },
    { icon: 'sun', title: t('corporateTravel.design5Title'), desc: t('corporateTravel.design5Desc') },
    { icon: 'users', title: t('corporateTravel.design6Title'), desc: t('corporateTravel.design6Desc') },
  ];

  const targetCards = [
    { icon: 'calendar', title: t('corporateTravel.target1Title'), desc: t('corporateTravel.target1Desc') },
    { icon: 'users', title: t('corporateTravel.target2Title'), desc: t('corporateTravel.target2Desc') },
    { icon: 'gift', title: t('corporateTravel.target3Title'), desc: t('corporateTravel.target3Desc') },
    { icon: 'leaf', title: t('corporateTravel.target4Title'), desc: t('corporateTravel.target4Desc') },
    { icon: 'link', title: t('corporateTravel.target5Title'), desc: t('corporateTravel.target5Desc') },
  ];

  const leaveCards = [
    { title: t('corporateTravel.leave1Title'), desc: t('corporateTravel.leave1Desc') },
    { title: t('corporateTravel.leave2Title'), desc: t('corporateTravel.leave2Desc') },
    { title: t('corporateTravel.leave3Title'), desc: t('corporateTravel.leave3Desc') },
    { title: t('corporateTravel.leave4Title'), desc: t('corporateTravel.leave4Desc') },
    { title: t('corporateTravel.leave5Title'), desc: t('corporateTravel.leave5Desc') },
  ];

  const processSteps = [
    { title: t('corporateTravel.process1Title'), desc: t('corporateTravel.process1Desc') },
    { title: t('corporateTravel.process2Title'), desc: t('corporateTravel.process2Desc') },
    { title: t('corporateTravel.process3Title'), desc: t('corporateTravel.process3Desc') },
    { title: t('corporateTravel.process4Title'), desc: t('corporateTravel.process4Desc') },
    { title: t('corporateTravel.process5Title'), desc: t('corporateTravel.process5Desc') },
  ];

  const safetyCards = [
    { icon: 'shield', title: t('corporateTravel.safety1Title'), desc: t('corporateTravel.safety1Desc') },
    { icon: 'navigation', title: t('corporateTravel.safety2Title'), desc: t('corporateTravel.safety2Desc') },
    { icon: 'compass', title: t('corporateTravel.safety3Title'), desc: t('corporateTravel.safety3Desc') },
    { icon: 'award', title: t('corporateTravel.safety4Title'), desc: t('corporateTravel.safety4Desc') },
    { icon: 'users', title: t('corporateTravel.safety5Title'), desc: t('corporateTravel.safety5Desc') },
  ];

  const valueAddCards = valueImages;

  const ctaFeatures = [
    t('corporateTravel.ctaFeature1'),
    t('corporateTravel.ctaFeature2'),
    t('corporateTravel.ctaFeature3'),
    t('corporateTravel.ctaFeature4'),
  ];

  return (
    <div>
      <section className="subpage-hero">
        <img src="/images/corporate-travel/企業員工旅遊-頁首大橫幅.webp" alt={t('products.corpTravel')} className="subpage-hero__img" loading="lazy" />
        <div className="subpage-hero__content">
          <Link to="/" className="text-ftg-orange hover:underline mb-3 md:mb-4 inline-block font-medium text-sm md:text-base inline-flex items-center min-h-[44px] min-w-[44px] -my-2">{t('nav.backHome')}</Link>
          <h1 className="subpage-hero__title">{t('products.corpTravel')}</h1>
          <p className="subpage-hero__subtitle">{t('corporateTravel.sub')}</p>
        </div>
      </section>

      <section className="section-padding px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* 1. Benefits */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.benefitsTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            {travelImages.map((p, i) => <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />)}
          </div>

          {/* 2. Design */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.designTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            {designCards.map((c, i) => <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />)}
          </div>

          {/* 3. Target */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.targetTitle')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {targetCards.map((c, i) => <IconCard key={i} icon={c.icon} title={c.title} desc={c.desc} />)}
          </div>

          {/* 4. Journey */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.journeyTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
            {expImages.map((p, i) => <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />)}
          </div>

          {/* 5. Leave */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.leaveTitle')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {leaveCards.map((c, i) => (
              <div key={i} className="bg-ftg-cream border border-gray-100 rounded-2xl card-responsive hover:shadow-lg transition-shadow">
                <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2">{c.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* 6. Process */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.processTitle')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {processSteps.map((s, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl card-responsive text-center hover:shadow-lg transition-shadow">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-ftg-green text-white rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4 text-lg md:text-xl font-bold">{i + 1}</div>
                <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2">{s.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* 7. Safety */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.safetyTitle')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-12 md:mb-16">
            {safetyCards.map((c, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl card-responsive text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-ftg-green/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <FTGIcon name={c.icon} size={28} className="text-ftg-green" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2">{c.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>

          {/* 8. Value Add */}
          <h2 className="text-2xl md:text-3xl font-bold text-ftg-forest mb-5 md:mb-8 text-center">{t('corporateTravel.valueAddTitle')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
            {valueAddCards.map((p, i) => <PhotoCard key={i} src={p.src} title={t(p.tKey)} desc={t(p.tKey + 'Desc')} />)}
          </div>

          {/* 9. CTA Block */}
          <CtaForm
            ctaTitle={t('corporateTravel.ctaBlockTitle')}
            ctaSub={t('corporateTravel.ctaBlockSub')}
            features={ctaFeatures}
          />

        </div>
      </section>
    </div>
  );
}
