import { useLanguage } from '../i18n/LanguageContext';

export default function Hero() {
  const { t } = useLanguage();

  return (
    // 5T-Tangible: 原本 sm:min-h-screen 在桌機過高（且手機 100vh 被網址列吃掉）。
    // 改成有上限的 vh 階梯，橫幅比例固定。
    <section 
      className="relative min-h-[48vh] sm:min-h-[54vh] md:min-h-[60vh] lg:min-h-[64vh] max-h-[700px] flex items-end bg-cover bg-center" 
      style={{ backgroundImage: "url('/images/hero-banner.webp')" }}
    >
      {/* 5T-Tangible（2026-10-02 修正）：拿掉外圍遮罩，照片保持明亮。
          與 Home.jsx / index.css .subpage-hero__content 同一組態 —— 全站橫幅
          只允許一個遮罩：文字方框本身。照片在其餘面積保持原始亮度。

          原為全域 sunlight/[0.56] + 文字區 cream/80 局部底，兩層。
          移除全域層後 cream/80 方框仍足以支撐深綠字：
          實測最差對比 7.74:1（照片亮部／中間調／暗部三情境）。

          註：本元件目前未被任何頁面引用（src/ 內無 import），
          保留以維持全站橫幅樣式一致；一旦重新引用即為同一組態。 */}


      {/* Desktop Layout */}
      <div className="hidden sm:flex relative z-10 w-full max-w-7xl mx-auto pl-8 xl:pl-16 pb-16">
        {/* 左側文字 (靠左, 寬度 480-560px) */}
        <div className="text-left max-w-md xl:max-w-lg bg-ftg-cream/80 rounded-2xl px-6 py-6 xl:px-8 xl:py-7">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ftg-forest mb-6 leading-tight">
            {t('hero.title')}
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-ftg-forest mb-8">
            {t('hero.subtitle')}
          </p>
          <button className="bg-ftg-orange hover:bg-orange-600 text-white px-6 py-3 rounded-full font-bold transition-all hover:scale-105 shadow-lg">
            {t('hero.ctaButton')}
          </button>
        </div>
      </div>

      {/* Mobile Layout: 文字在圖片下方的暖白卡片 */}
      <div className="sm:hidden absolute bottom-0 left-0 right-0 bg-ftg-sunlight p-6 rounded-t-3xl shadow-lg">
        <h1 className="text-3xl font-bold text-ftg-forest mb-3">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-ftg-forest mb-4">
          {t('hero.subtitle')}
        </p>
        <button className="w-full bg-ftg-orange hover:bg-orange-600 text-white py-3 rounded-full font-bold">
          {t('hero.ctaButton')}
        </button>
      </div>

      {/* 右側留白, 供人物顯示 (object-position: 70% center) */}
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none"></div>
    </section>
  );
}
