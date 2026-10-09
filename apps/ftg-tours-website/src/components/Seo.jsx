/**
 * Seo.jsx — per-route <head> writer.
 * 5T-Traceable: recovered from bundle `yr`.
 */
import { useEffect } from 'react';

export default function Seo({ title, description }) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', 'description');
        document.head.appendChild(el);
      }
      el.setAttribute('content', description);
    }
  }, [title, description]);
  return null;
}
