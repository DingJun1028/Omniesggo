/**
 * siteData.js — FTG TOURS 內容資料 (簡化版,不依賴 i18n)
 * 5T-Traceable: image 路徑來自 /var/www/ftgtours/bak.20261008-235415/images/
 *   (部署版 Oct 6 明亮版圖片,2026-10-08 復原)
 * 如需 i18n / 進階內容,參考 git log 1457ea068 (recovered 但含未定義 e() 變數)
 */

// 公司基本資料
export const COMPANY = {
  legalName: '墾趣旅行社股份有限公司',
  shortName: '墾趣旅遊',
  brandEn: 'FTG TOURS',
  taxId: '93794912',
  registryNo: '859500',
  licenseNo: '交觀甲第07142號',
};

// 圖檔路徑
export const HERO_BANNER = '/images/hero-banner.webp';
export const LOGO = '/images/logo.webp';

// 6 大企業方案 (Home.jsx 卡片用)
export const SERVICES = [
  { title: '企業員工旅遊',  desc: '客製化員工旅遊,凝聚團隊與永續行動',  link: '/corporate-travel',  img: '/images/corporate-travel/企業員工旅遊-頁首大橫幅.webp' },
  { title: '企業家庭日',     desc: '親子共融的戶外健康家庭日活動',        link: '/family-day',        img: '/images/family-day/企業家庭日-頁首大橫幅.webp' },
  { title: 'ESG Outdoor Team Day', desc: '結合環境與社會共益的戶外團隊日',     link: '/esg-team-day',      img: '/images/esg-team-day/team-day-頁首大橫幅.webp' },
  { title: '員工身心平衡',   desc: '森林療癒、正念練習、數位排毒',          link: '/wellbeing-retreat', img: '/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.webp' },
  { title: '高階主管共識營', desc: '共識建立與策略 retreat',                 link: '/executive-retreat', img: '/images/executive-retreat/高階主管共識-頁首橫幅.webp' },
  { title: 'ESG Impact Note', desc: '活動成果報告與永續揭露',                link: '/esg-impact-note',   img: '/images/esg-impact-note/ESG-Impact-Note-頁首大橫幅.webp' },
];

// 5 大優勢 (Home.jsx 區塊用)
export const ADVANTAGES = [
  { icon: 'mountain',  title: '深耕戶外生活的品牌經驗', desc: '多年戶外導覽與旅遊經營經驗' },
  { icon: 'map',       title: '戶外路線與難度設計',     desc: '依據需求規劃最適合的旅程難度' },
  { icon: 'clipboard', title: '完整的旅行專業執行',     desc: '合法旅行社、保險、交通一站式' },
  { icon: 'users',     title: '與地方共同完成旅程',     desc: '在地夥伴合作,共創地方價值' },
  { icon: 'sustainable', title: '讓永續成為旅程中的實際行動', desc: 'ESG Impact Note 成果摘要' },
];
