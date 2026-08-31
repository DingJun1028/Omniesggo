import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-ftg-forest mb-8 hover:text-ftg-orange transition-colors text-sm">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          返回首頁
        </Link>
        <h1 className="text-3xl font-bold text-ftg-forest mb-8">服務條款</h1>
        <div className="prose prose-lg text-gray-700 space-y-6">
          <p>歡迎使用墾趣旅遊（FTG TOURS）服務。當您使用我們的服務時，即表示您同意遵守本條款。</p>
          <h2 className="text-xl font-bold text-ftg-forest">服務說明</h2>
          <p>我們提供企業永續旅行規劃、活動策劃、旅程管理與相關諮詢服務。</p>
          <h2 className="text-xl font-bold text-ftg-forest">預約與取消</h2>
          <p>所有預約需經雙方確認。取消政策依各方案規定辦理。</p>
          <h2 className="text-xl font-bold text-ftg-forest">責任限制</h2>
          <p>我們致力於提供優質服務，但對不可抗力因素導致的損失不承擔責任。</p>
          <h2 className="text-xl font-bold text-ftg-forest">聯絡我們</h2>
          <p>若您對本條款有任何疑問，請透過 hello@ftgtours.com 與我們聯繫。</p>
        </div>
      </div>
    </div>
  );
}
