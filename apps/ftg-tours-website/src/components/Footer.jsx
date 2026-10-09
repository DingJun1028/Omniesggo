import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { FTGIcon } from './FTGIcon';
// 5T-Trustworthy: 聯絡資訊一律讀 src/data/company.js。原先此處硬寫
// 886 2 7743 1006 / hello@ftgtours.com / 台北市中山區，與隱私權政策
// 揭露的資料蒐集者（02-8512-3099 / service@ftg-tours.com.tw / 新北三重）
// 不符 — 政策頁與頁面互相矛盾即為自曝矛盾。
import { COMPANY } from '../data/company';

export default function Footer() {
  const { t, lang } = useLanguage();
  // 5T-Tangible: 英文版用英文地址 / 只留英文品牌名。
  // 版權列原本固定印「FTG TOURS 墾趣旅遊」，中文對英文頁是殘留；
  // 品牌中英文全名在中文頁仍完整保留，不因這個判斷而消失。
  const address = lang === 'en' ? COMPANY.addressEn : COMPANY.address;
  const brandForCopyright = lang === 'en' ? COMPANY.brandEn : COMPANY.shortName;
  return (
    <footer className="bg-ftg-forest text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <img src="/images/logo.webp" alt="墾趣旅遊 FTG TOURS" className="h-10 md:h-12 w-auto mb-4" />
            <p className="text-gray-300 text-sm leading-relaxed">
              {t('footer.brandTagline')}
            </p>
          </div>

          {/* Corporate Programs */}
          <div>
            <h4 className="text-base font-semibold mb-3 md:mb-4">{t('footer.corpPrograms')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/corporate-travel" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.corpTravel')}</Link></li>
              <li><Link to="/family-day" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.familyDay')}</Link></li>
              <li><Link to="/esg-team-day" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.esgTeamDay')}</Link></li>
              <li><Link to="/wellbeing-retreat" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.wellbeing')}</Link></li>
            </ul>
          </div>

          {/* Advanced Programs */}
          <div>
            <h4 className="text-base font-semibold mb-3 md:mb-4">{t('footer.advancedPrograms')}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/executive-retreat" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.executive')}</Link></li>
              <li><Link to="/esg-impact-note" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('products.impactNote')}</Link></li>
              <li><Link to="/journey-design" className="text-gray-300 hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('nav.journeyDesign')}</Link></li>
            </ul>
          </div>

          {/* Contact
              5T-Tangible（2026-10-01）：手機版使用者回報「幾乎需要小圖示的
              聯絡項目都沒有 icon」且純文字無法點。這裡把 COMPANY 既有真實
              資料轉成帶 icon 的可點擊連結（tel: / mailto: / LINE 分享 / 地圖），
              每個觸控目標 ≥44px，符合行動可點擊性。

              5T-Transparent：這裡只連「資料本身就指向」的服務 —
              tel/mailto 依瀏覽器協定的標準格式、地址連 Google Maps 查詢。
              FB / IG / YouTube 仍不放，因為 COMPANY 沒有真實帳號網址；
              捏造網址會產生點得開卻導不到正確頁面的假連結。 */}
          <div>
            <h4 className="text-base font-semibold mb-3 md:mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>
                <a href={`tel:${COMPANY.phone.replace(/-/g, '')}`}
                   className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] hover:text-white transition-colors">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12">
                  <FTGIcon name="phone" size={16} className="text-ftg-sand" />
                </span>
                  <span>{t('footer.phone')}：{COMPANY.phone}</span>
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`}
                   className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] hover:text-white transition-colors">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12">
                  <FTGIcon name="mail" size={16} className="text-ftg-sand" />
                </span>
                  <span>{t('footer.email')}：{COMPANY.email}</span>
                </a>
              </li>
              <li>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(COMPANY.address)}`}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] hover:text-white transition-colors">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12">
                  <FTGIcon name="map" size={16} className="text-ftg-sand" />
                </span>
                  <span>{t('footer.address')}：{address}</span>
                </a>
              </li>
              <li>
                {/* LINE 官方 deep link：帶 @ 前綴的 ID 才是有效格式。 */}
                <a href={`https://line.me/R/ti/p/@${COMPANY.lineId.replace(/^@/, '')}`}
                   target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 min-h-[44px] min-w-[44px] hover:text-white transition-colors">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12">
                  <FTGIcon name="send" size={16} className="text-ftg-sand" />
                </span>
                  <span>{t('footer.line')}：{COMPANY.lineId}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-500 mt-8 pt-6 text-sm text-gray-400">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/logo.webp" alt="墾趣旅遊 FTG TOURS" className="h-8 w-auto" />
              <p>&copy; 2026 {brandForCopyright}. {t('footer.rights')}</p>
            </div>
            <div className="space-x-4">
              <Link to="/about" className="hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('footer.about')}</Link>
              <Link to="/privacy" className="hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors inline-flex items-center min-h-[44px] min-w-[44px] px-2 -mx-2">{t('footer.terms')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
