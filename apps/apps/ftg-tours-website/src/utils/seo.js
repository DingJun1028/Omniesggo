import { useEffect } from 'react';
// 5T-Trustworthy: 結構化資料（JSON-LD）會被 Google 讀取並顯示在搜尋結果，
// 屬於對外公開的法律聲明。電話/地址必須與隱私權政策揭露的資料蒐集者一致，
// 否則政策頁與搜尋結果互相矛盾。單一真實來源 = src/data/company.js。
import { COMPANY } from '../data/company';

const SITE_URL = 'https://ftgtours.esggo.co';
const BRAND = 'FTG TOURS 墾趣旅遊';
const DEFAULT_TITLE = '墾趣旅遊 FTG TOURS | ESG 戶外健康旅遊方案';
const DEFAULT_DESCRIPTION =
  '墾趣結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。';

const canonical = (path = '') =>
  path
    ? `${SITE_URL.replace(/\/$/, '')}/#/${path.replace(/^\//, '')}`
    : `${SITE_URL.replace(/\/$/, '')}/`;

export const usePageSeo = ({ title, description, path = '', keywords = [] }) => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BRAND}` : DEFAULT_TITLE;
    const metaDescription = description || DEFAULT_DESCRIPTION;

    document.title = fullTitle;

    const ensureMeta = (attr, value, content) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    ensureMeta('name', 'description', metaDescription);
    if (description) {
      ensureMeta('name', 'og:description', metaDescription);
    }
    ensureMeta('name', 'keywords', keywords.join(','));
    ensureMeta('name', 'og:title', fullTitle);
    ensureMeta('property', 'og:url', canonical(path));
    ensureMeta('property', 'og:type', 'website');

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonical(path));
  }, [title, description, path, keywords]);
};

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND,
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`,
  description: DEFAULT_DESCRIPTION,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: COMPANY.phone,
      email: COMPANY.email,
    },
  ],
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.street,
    addressLocality: COMPANY.city,
    addressRegion: COMPANY.district,
    postalCode: COMPANY.postalCode,
    addressCountry: 'TW',
  },
  sameAs: ['https://ftgtours.esggo.co'],
};

export const localBusinessJsonLd = (service = 'ESG Outdoor Wellbeing Travel') => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: BRAND,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    streetAddress: COMPANY.street,
    addressLocality: COMPANY.city,
    addressRegion: COMPANY.district,
    postalCode: COMPANY.postalCode,
    addressCountry: 'TW',
  },
  telephone: COMPANY.phone,
  serviceType: service,
});

export const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  inLanguage: ['zh-Hant', 'zh-CN', 'en'],
  alternateName: {
    '@type': 'Text',
    '@value': 'FTG TOURS',
  },
};
