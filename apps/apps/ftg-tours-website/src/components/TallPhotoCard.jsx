/**
 * TallPhotoCard.jsx — captioned photo, h-56/h-64/h-72, plain caption typography.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `Zr`.
 *   Differs from LeadPhotoCard only in the caption: no `leading-snug` on the
 *   h3 and no `mt-1` on the p. Kept separate rather than merged — the class
 *   strings are the deployed truth, not a guess at equivalence.
 */
export default function TallPhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group h-full">
      <img
        src={src}
        alt={title}
        className="w-full h-56 sm:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm">{desc}</p>
      </figcaption>
    </figure>
  );
}
