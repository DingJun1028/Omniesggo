// src/pages/Home.jsx
// 墾趣旅遊 FTG TOURS — 官網首頁 (含 hero 圖 + 6 大服務圖卡 + 5 大優勢)
import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import PhotoCard from '../components/PhotoCard';
import ContactSection from '../components/ContactSection';
import { HERO_BANNER, SERVICES, ADVANTAGES } from '../data/siteData';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section — full-width 圖背景 */}
      <section className="relative flex items-center justify-center overflow-hidden min-h-[52vh] sm:min-h-[58vh] md:min-h-[64vh] lg:min-h-[68vh] max-h-[760px] py-16 sm:py-20 md:py-24">
        <img
          src={HERO_BANNER}
          alt="FTG TOURS 墾趣旅遊 企業員工旅遊戶外旅程橫幅"
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
          loading="eager"
        />
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="bg-black/25 rounded-2xl px-4 py-6 md:px-8 md:py-8 -m-1 md:-m-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 font-serif leading-tight text-balance break-words px-2">
              墾趣旅遊 FTG TOURS
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-100 max-w-3xl mx-auto leading-relaxed">
              結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/corporate-travel" className="bg-ftg-green text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-ftg-forest transition-colors">
                探索企業方案 →
              </Link>
              <Link to="/journey-design" className="bg-white/10 backdrop-blur-sm text-white border-2 border-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-base md:text-lg hover:bg-white/20 transition-colors">
                客製化旅程設計
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5 大優勢區塊 */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title text-ftg-forest">為什麼是墾趣</h2>
            <p className="section-subtitle">五大優勢，讓旅程與眾不同</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {ADVANTAGES.map((a, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-ftg-green/10 flex items-center justify-center">
                  <Icon name={a.icon} size={32} className="text-ftg-green" />
                </div>
                <h3 className="font-bold text-ftg-forest mb-2 text-sm">{a.title}</h3>
                <p className="text-gray-600 text-xs">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 大企業方案 (含圖卡) */}
      <section className="section-padding bg-ftg-sand">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="section-title text-ftg-forest">六大企業方案</h2>
            <p className="section-subtitle">客製化戶外體驗,滿足企業多元需求</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {SERVICES.map((s, i) => (
              <Link key={i} to={s.link} className="block card-elevated group hover:border-ftg-orange/30 transition-all overflow-hidden p-0">
                <PhotoCard src={s.img} title={s.title} desc={s.desc} />
                <div className="p-4 md:p-6">
                  <span className="inline-block text-sm text-ftg-orange font-medium group-hover:underline">了解更多 →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ftg-cream">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-ftg-forest mb-6">準備好打造專屬的永續旅程了嗎?</h2>
          <p className="text-gray-600 mb-8">與我們討論您的需求,為企業與員工創造有意義的旅行體驗</p>
          <a href="https://journey.ftgtours.esggo.co" target="_blank" rel="noopener noreferrer" className="inline-block px-10 py-4 rounded-full font-semibold text-lg bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow-lg">
            免費諮詢 →
          </a>
        </div>
      </section>

      <ContactSection />
    </div>
  );
}
