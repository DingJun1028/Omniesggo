import { Link } from 'react-router-dom';
import { usePageSeo } from '../utils/seo';
import { useLanguage } from '../i18n/LanguageContext';
import { COMPANY, POLICY_EFFECTIVE_DATE } from '../data/company';

// 5T-Transparent: 每一項蒐集欄位都對應到 worker/schema.sql 與 worker/index.js 的
// 實際 INSERT 欄位，沒有寫程式碼沒收集的東西。IP 欄位是實務上最常被漏寫的一項
// （cf-connecting-ip 確實被存進 D1），此處如實揭露。
// 5T-Trustworthy: reCAPTCHA v3 會把資料傳給 Google（境外），依法需告知並取得同意，
// 且 Google 依其隱私權政策可能將資料用於廣告用途。

export default function Privacy() {
  const { t, lang } = useLanguage();
  usePageSeo({
    title: t('privacy.title'),
    description: t('privacy.metaDesc'),
    path: '/privacy',
    keywords: ['隱私權政策', '個人資料', '個資法', 'FTG TOURS', '墾趣旅遊'],
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
          <h1 className="section-title">{t('privacy.title')}</h1>
          <p className="section-subtitle">{t('privacy.sub')}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-10">
            <h2 className="text-lg font-bold text-ftg-forest mb-4">{t('privacy.controllerTitle')}</h2>
            <ul className="space-y-1 text-gray-700 text-sm">
              <li>{t('privacy.companyName')}：{COMPANY.legalName}</li>
              <li>{t('privacy.taxId')}：{COMPANY.taxId}</li>
              <li>{t('privacy.representative')}：{COMPANY.representative}</li>
              <li>{t('privacy.address')}：{lang === 'en' ? COMPANY.addressEn : COMPANY.address}</li>
              <li>{t('privacy.phone')}：{COMPANY.phone}</li>
              <li>{t('privacy.email')}：{COMPANY.email}</li>
              <li>{t('privacy.licenseNo')}：{COMPANY.licenseNo}</li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">{t('privacy.effective')}{POLICY_EFFECTIVE_DATE}</p>
          </div>

          <h2 className={H2}>{t('privacy.s1Title')}</h2>
          <p className={P}>{t('privacy.s1Body', { name: COMPANY.legalName })}</p>

          <h2 className={H2}>{t('privacy.s2Title')}</h2>
          <p className={P}>{t('privacy.s2Body')}</p>
          <ul className="mb-4">
            <li className={LI}><strong>{t('privacy.dataContact')}</strong>：{t('privacy.dataContactVal')}</li>
            <li className={LI}><strong>{t('privacy.dataContact2')}</strong>：{t('privacy.dataContact2Val')}</li>
            <li className={LI}><strong>{t('privacy.dataRequest')}</strong>：{t('privacy.dataRequestVal')}</li>
            <li className={LI}><strong>{t('privacy.dataTech')}</strong>：{t('privacy.dataTechVal')}</li>
            <li className={LI}><strong>{t('privacy.dataIp')}</strong>：{t('privacy.dataIpVal')}</li>
            {/* 5T-Transparent: 原本此行把「標題：值」拆成兩個 t() 輸出，
                但 dataOptional 本身就是一整句（「以上除聯絡人姓名與電子郵件外，
                其餘欄位皆為選填」），字典裡並不存在對應的 Val 鍵 ——
                t() 對缺鍵原樣回傳字串，於是頁面實際顯示成
                「以上除…皆為選填：privacy.dataOptionalVal」。
                此處只輸出單一 key，避免無意義的破折號與字面量。
                （註：驗證器 check_i18n_missing.py 以 regex 掃 t() 呼叫，
                  會把本註解中的字樣一併計入，故刻意不寫出完整的 key 名。） */}
            <li className={LI}>{t('privacy.dataOptional')}</li>
          </ul>
          <p className={P}>{t('privacy.s2Note')}</p>

          <h2 className={H2}>{t('privacy.s3Title')}</h2>
          <p className={P}>{t('privacy.s3Body')}</p>
          <ul className="mb-4">
            <li className={LI}><strong>{t('privacy.purposeService')}</strong>：{t('privacy.purposeServiceVal')}</li>
            <li className={LI}><strong>{t('privacy.purposeContract')}</strong>：{t('privacy.purposeContractVal')}</li>
            <li className={LI}><strong>{t('privacy.purposeStatute')}</strong>：{t('privacy.purposeStatuteVal')}</li>
          </ul>

          <h2 className={H2}>{t('privacy.s4Title')}</h2>
          <p className={P}>{t('privacy.s4Body')}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4">
            <h3 className="font-bold text-amber-900 mb-2">{t('privacy.recaptchaTitle')}</h3>
            <p className="text-sm text-amber-900 leading-relaxed mb-2">{t('privacy.recaptchaBody')}</p>
            <p className="text-sm text-amber-900 leading-relaxed">{t('privacy.recaptchaBody2')}</p>
          </div>

          <h2 className={H2}>{t('privacy.s5Title')}</h2>
          <p className={P}>{t('privacy.s5Body')}</p>
          <ul className="mb-4">
            <li className={LI}><strong>{t('privacy.shareCloud')}</strong>：{t('privacy.shareCloudVal')}</li>
            <li className={LI}><strong>{t('privacy.sharePartner')}</strong>：{t('privacy.sharePartnerVal')}</li>
          </ul>

          <h2 className={H2}>{t('privacy.s6Title')}</h2>
          <p className={P}>{t('privacy.s6Body', { email: COMPANY.email })}</p>

          <h2 className={H2}>{t('privacy.s7Title')}</h2>
          <p className={P}>{t('privacy.s7Body')}</p>

          <h2 className={H2}>{t('privacy.s8Title')}</h2>
          <p className={P}>{t('privacy.s8Body')}</p>

          <div className="bg-ftg-sand rounded-2xl p-6 md:p-8 mt-10">
            <p className="text-sm text-gray-700 leading-relaxed">
              {t('privacy.contactUs')}：{COMPANY.legalName}（{t('privacy.taxId')} {COMPANY.taxId}）<br />
              {t('privacy.address')}：{lang === 'en' ? COMPANY.addressEn : COMPANY.address}<br />
              {t('privacy.phone')}：{COMPANY.phone}　{t('privacy.email')}：{COMPANY.email}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
