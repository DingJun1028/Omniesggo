/**
 * LeadPhotoCard.jsx — captioned photo, h-56/h-64/h-72, tightened caption.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `ri`
 *   (h3 carries `leading-snug`, p carries `mt-1`).
 */
export default function LeadPhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group h-full">
      <img
        src={src}
        alt={title}
        className="w-full h-56 sm:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm mt-1">{desc}</p>
      </figcaption>
    </figure>
  );
}
