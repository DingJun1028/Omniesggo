/**
 * NumberBadgeCard.jsx — card led by a numbered circular badge instead of an icon.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `$r`
 *   (`function $r({num:e,title:t,desc:n})`). Looks close to TightFeatureCard
 *   (`Qr`) but swaps the icon disc for a `w-9 h-9` badge showing `num`, so the
 *   two are kept as separate components rather than parameterised together.
 */
export default function NumberBadgeCard({ num, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 hover:shadow-lg transition-shadow h-full">
      <div className="flex items-center mb-3">
        <span className="w-9 h-9 rounded-full bg-ftg-green text-white flex items-center justify-center font-bold text-sm">{num}</span>
      </div>
      <h3 className="text-base sm:text-lg font-bold text-ftg-forest mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
