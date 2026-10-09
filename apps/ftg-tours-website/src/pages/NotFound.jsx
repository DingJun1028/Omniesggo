import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <main style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 72, fontWeight: 900, color: '#10243f', lineHeight: 1 }}>404</div>
      <h1 style={{ color: '#3c6e47', margin: '16px 0 8px', fontSize: 24 }}>
        {t('notFound.title') || '找不到這個頁面'}
      </h1>
      <p style={{ color: '#5b6b7b', maxWidth: 420, marginBottom: 24 }}>
        {t('notFound.desc') || '您要找的旅程頁面可能已移動或網址有誤'}
      </p>
      <Link to="/" style={{
        background: '#c9a24b', color: '#1a1205', padding: '12px 28px',
        borderRadius: 999, fontWeight: 700, textDecoration: 'none'
      }}>
        {t('notFound.back') || '返回首頁'}
      </Link>
    </main>
  );
}
