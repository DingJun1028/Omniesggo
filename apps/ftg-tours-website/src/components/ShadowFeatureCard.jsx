/**
 * ShadowFeatureCard.jsx — icon card with a solid green icon disc.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `Di`
 *   (`bg-white rounded-2xl p-6 shadow-sm ... h-full`).
 */
import Icon from './Icon';

export default function ShadowFeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="w-12 h-12 rounded-full bg-ftg-green text-white flex items-center justify-center text-2xl mb-4 shrink-0">
        <Icon name={icon} size={28} className="text-ftg-green" />
      </div>
      <h3 className="text-lg font-bold text-ftg-forest mb-2 leading-snug">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
