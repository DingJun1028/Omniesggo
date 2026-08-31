export default function Footer() {
  return (
    <footer className="bg-ftg-forest text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">墾趣旅遊 FTG TOURS</h3>
            <p className="text-gray-300 text-sm">為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">企業方案</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><a href="/corporate-travel" className="hover:text-ftg-orange transition-colors">企業員工旅遊</a></li>
              <li><a href="/family-day" className="hover:text-ftg-orange transition-colors">企業家庭日</a></li>
              <li><a href="/esg-team-day" className="hover:text-ftg-orange transition-colors">ESG Outdoor Team Day</a></li>
              <li><a href="/wellbeing-retreat" className="hover:text-ftg-orange transition-colors">員工身心平衡</a></li>
              <li><a href="/executive-retreat" className="hover:text-ftg-orange transition-colors">高階主管共識營</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">聯絡我們</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>hello@ftgtours.com</li>
              <li>+886-2-7743-1006</li>
              <li>台北市中山區</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2026 墾趣旅遊 FTG TOURS. All rights reserved.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="/privacy-policy" className="hover:text-white transition-colors">隱私政策</a>
            <a href="/terms-of-service" className="hover:text-white transition-colors">服務條款</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
