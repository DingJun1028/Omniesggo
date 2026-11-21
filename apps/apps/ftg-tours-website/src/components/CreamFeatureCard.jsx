/**
 * CreamFeatureCard.jsx — cream-background icon card, larger glyph (size 32).
 * 5T-Traceable: recovered verbatim from the deployed bundle, `mi`.
 *   The icon sits in a bare flex box with aria-hidden, not in a disc.
 */
import Icon from './Icon';

export default function CreamFeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-ftg-cream rounded-2xl p-6 text-center h-full hover:shadow-lg transition-shadow flex flex-col">
      <div className="text-4xl mb-3 flex items-center justify-center" aria-hidden="true">
        <Icon name={icon} size={32} className="text-ftg-green" />
      </div>
      <h3 className="font-bold text-ftg-forest mb-2 text-lg leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
