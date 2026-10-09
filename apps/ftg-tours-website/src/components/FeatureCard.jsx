/**
 * FeatureCard.jsx — the icon card used across product pages.
 * 5T-Traceable: recovered from bundle `Vr`/`Ar` (identical bodies).
 * This is the component that renders the product icons the mobile board was
 * reported missing: circle backdrop + <Icon size={28} className="text-ftg-green">.
 */
import Icon from './Icon';

export default function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl card-responsive text-center hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-ftg-green/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
        <Icon name={icon} size={28} className="text-ftg-green" />
      </div>
      <h3 className="text-base md:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
