import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import FTGIcon from '../components/FTGIcon';
import CtaForm from '../components/CtaForm';

// 5T-Traceable: 本頁文案全部來自 src/i18n/translations.js 的 about 命名空間，
// source_origin = 用戶 2026-09-30 提供之公司沿革原文。不在 JSX 內硬寫任何
// 中文字串，否則切英文時這頁會漏字（這正是 Privacy/Terms 過去踩過的坑）。
// 5T-Traceable: 文中「1994 年 12 月開業」「30 年」「營業額 1%」為公司自述數字，
// 非本程式碼可驗證之項，僅照原文轉述；不代為計算或推論。
//
// 三大永續目標刻意以陣列 + map 渲染成卡片，而非三段手寫 <div>：
// 三個目標的結構完全同構（標題 + 說明 + 圖示），寫成陣列後版面規則只存在一處，
// 新增第四個目標只需在 translations.js 加 key，不會漏改版面。

export default function About() {
  const { t } = useLanguage();
  usePageSeo({
    title: t('about.title'),
    description: t('about.metaDesc'),
    path: '/about',
    keywords: ['關於我們', '墾趣國際', '永續', 'ESG', 'FTG TOURS', '墾趣旅遊'],
  });

  const goals = [
    { icon: 'award', title: t('about.goal1Title'), desc: t('about.goal1Desc') },
    { icon: 'users', title: t('about.goal2Title'), desc: t('about.goal2Desc') },
    { icon: 'sustainable', title: t('about.goal3Title'), desc: t('about.goal3Desc') },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ftg-forest text-white py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center text-ftg-orange hover:text-white transition-colors mb-6 text-sm min-h-[44px] min-w-[44px] -my-2"
          >
            {t('nav.backHome')}
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold font-serif mb-4">{t('footer.about')}</h1>
          <p className="text-lg text-gray-200">{t('about.title')}</p>
        </div>
      </section>

      {/* 沿革 */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gray-700 leading-relaxed mb-6 text-base md:text-lg">{t('about.p1')}</p>
          <p className="text-gray-700 leading-relaxed mb-6 text-base md:text-lg">{t('about.p2')}</p>
        </div>
      </section>

      {/* 三大永續目標 */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="section-title">{t('about.goalsTitle')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {goals.map((g, i) => (
              <div key={i} className="text-center p-6 bg-white rounded-2xl shadow-sm">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <FTGIcon name={g.icon} size={32} className="text-ftg-green" />
                </div>
                <h3 className="text-xl font-bold text-ftg-forest mb-3">{g.title}</h3>
                <p className="text-gray-600 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 結語 + CTA */}
      <section className="py-20 bg-ftg-forest text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed mb-8">{t('about.closing')}</p>
              <div className="flex items-center gap-4 text-gray-300 text-sm">
                <div className="flex items-center gap-2"><FTGIcon name="shield" size={20} /> {t('nav.products')}</div>
                <div className="flex items-center gap-2"><FTGIcon name="sustainable" size={20} /> {t('about.goalsTitle')}</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-gray-800">
              <CtaForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
