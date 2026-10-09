/**
 * TightFeatureCard.jsx — icon/title/desc card, tight padding, grid-fill height.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `Qr`.
 *   Not interchangeable with FeatureCard: `rounded-xl p-5 sm:p-6` (vs
 *   `rounded-2xl card-responsive`) and `h-full` for equal-height grids.
 */
import Icon from './Icon';

export default function TightFeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center h-full">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-ftg-green/10 text-ftg-green flex items-center justify-center text-2xl mb-3 sm:mb-4">
        <Icon name={icon} size={28} className="text-ftg-green" />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
