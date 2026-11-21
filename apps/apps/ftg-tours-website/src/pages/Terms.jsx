import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import { COMPANY, POLICY_EFFECTIVE_DATE } from '../data/company';

// 5T-Transparent: 條款中的營業登記資料一律自 src/data/company.js 讀取，
// 不在頁面內硬寫，避免政策與頁面資訊漂移。
// 5T-Trustworthy: 明載業者登記資訊（依旅行社業管理權責應揭露）與定型化契約
// 必備事項，消費者得據以主張權益。

export default function Terms() {
  const { t, lang } = useLanguage();
  usePageSeo({
    title: t('terms.title'),
    description: t('terms.metaDesc'),
    path: '/terms',
    keywords: ['服務條款', '定型化契約', '旅行社', 'FTG TOURS', '墾趣旅遊'],
  });

  const H2 = 'text-2xl font-bold text-ftg-forest mt-10 mb-4';
  const P = 'text-gray-700 leading-relaxed mb-4';
  const LI = 'text-gray-700 leading-relaxed mb-2 ml-5 list-disc';

  return (
    <div>
      <section className="relative py-20 bg-ftg-sand">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Link to="/" className="text-ftg-green hover:underline mb-4 inline-block inline-flex items-center min-h-[44px] min-w-[44px] -my-2">
            {t('nav.backHome')}
          </Link>
          <h1 className="section-title">{t('terms.title')}</h1>
          <p className="section-subtitle">{t('terms.sub')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-10">
            <h2 className="text-lg font-bold text-ftg-forest mb-4">{t('terms.companyTitle')}</h2>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>{t('privacy.companyName')}：{COMPANY.legalName}</li>
              <li>{t('privacy.taxId')}：{COMPANY.taxId}</li>
              <li>{t('privacy.registryNo')}：{COMPANY.registryNo}</li>
              <li>{t('privacy.licenseNo')}：{COMPANY.licenseNo}</li>
              <li>{t('privacy.assuranceNo')}：{COMPANY.assuranceNo}</li>
              <li>{t('privacy.representative')}：{COMPANY.representative}</li>
              <li>{t('privacy.address')}：{lang === 'en' ? COMPANY.addressEn : COMPANY.address}</li>
              <li>{t('privacy.phone')}：{COMPANY.phone}　{t('terms.fax')}：{COMPANY.fax}</li>
              <li>{t('privacy.email')}：{COMPANY.email}　{t('terms.line')}：{COMPANY.lineId}</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">{t('privacy.effective')}{POLICY_EFFECTIVE_DATE}</p>
          </div>

          <h2 className={H2}>{t('terms.s1Title')}</h2>
          <p className={P}>{t('terms.s1Body', { name: COMPANY.legalName })}</p>

          <h2 className={H2}>{t('terms.s2Title')}</h2>
          <p className={P}>{t('terms.s2Body')}</p>
          <ul className="mb-4">
            <li className={LI}>{t('terms.s2i1')}</li>
            <li className={LI}>{t('terms.s2i2')}</li>
            <li className={LI}>{t('terms.s2i3')}</li>
            <li className={LI}>{t('terms.s2i4')}</li>
          </ul>

          <h2 className={H2}>{t('terms.s3Title')}</h2>
          <p className={P}>{t('terms.s3Body')}</p>

          <h2 className={H2}>{t('terms.s4Title')}</h2>
          <p className={P}>{t('terms.s4Body')}</p>

          <h2 className={H2}>{t('terms.s5Title')}</h2>
          <p className={P}>{t('terms.s5Body')}</p>
          <ul className="mb-4">
            <li className={LI}>{t('terms.s5i1')}</li>
            <li className={LI}>{t('terms.s5i2')}</li>
          </ul>

          <h2 className={H2}>{t('terms.s6Title')}</h2>
          <p className={P}>{t('terms.s6Body')}</p>

          <h2 className={H2}>{t('terms.s7Title')}</h2>
          <p className={P}>{t('terms.s7Body', { email: COMPANY.email })}</p>

          <div className="bg-ftg-sand rounded-2xl p-6 md:p-8 mt-10">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('terms.acknowledge')}<br />
              {COMPANY.legalName}　{t('privacy.representative')}：{COMPANY.representative}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
