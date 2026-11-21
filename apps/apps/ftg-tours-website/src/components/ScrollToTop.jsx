import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 每次路由切換（含 HashRouter 的 #/path 變化）後，立即滾動回頁面頂部
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // 若網址帶有 #anchor（如 #esg-section），交給瀏覽器原生錨點滾動
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}
