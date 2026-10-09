import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './index.css'
import { organizationJsonLd, localBusinessJsonLd, webSiteJsonLd } from './utils/seo.js'

const injectJsonLd = (item) => {
  if (typeof document === 'undefined') return;
  const existing = document.querySelector('script[type="application/ld+json"][data-ftg-seo]');
  if (existing) return;
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-ftg-seo', 'true');
  script.text = JSON.stringify(item);
  document.head.appendChild(script);
};

const bootstrapSeo = () => {
  injectJsonLd(webSiteJsonLd);
  injectJsonLd(organizationJsonLd);
  injectJsonLd(localBusinessJsonLd('ESG Outdoor Wellbeing Travel'));
};

bootstrapSeo();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
