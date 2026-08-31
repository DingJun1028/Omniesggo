import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-ftg-forest mb-8 hover:text-ftg-orange transition-colors text-sm">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回首頁
        </Link>
        <h1 className="text-3xl font-bold text-ftg-forest mb-8">隱私政策</h1>
        <div className="prose prose-lg text-gray-700 space-y-6">
          <p>墾趣旅遊（FTG TOURS）非常重視您的隱私權。本政策說明我們如何收集、使用與保護您的個人資訊。</p>
          <h2 className="text-xl font-bold text-ftg-forest">資訊收集</h2>
          <p>我們可能收集您主動提供的資訊（如姓名、電子郵件、聯絡電話），以及瀏覽器自動傳送的資訊（如 IP 位址、瀏覽紀錄）。</p>
          <h2 className="text-xl font-bold text-ftg-forest">資訊使用</h2>
          <p>我們使用所收集的資訊提供、維護與改善服務，以及與您聯繫相關活動資訊。</p>
          <h2 className="text-xl font-bold text-ftg-forest">資訊保護</h2>
          <p>我們採取適當的安全措施保護您的個人資訊，防止未經授權的存取、變更或揭露。</p>
          <h2 className="text-xl font-bold text-ftg-forest">聯絡我們</h2>
          <p>若您對本隱私政策有任何疑問，請透過 hello@ftgtours.com 與我們聯繫。</p>
        </div>
      </div>
    </div>
  );
}
