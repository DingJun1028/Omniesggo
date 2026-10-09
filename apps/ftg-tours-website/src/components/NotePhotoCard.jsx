/**
 * NotePhotoCard.jsx — captioned photo at a taller breakpoint, no h-full.
 * 5T-Traceable: recovered verbatim from the deployed bundle, `Ei`
 *   (`w-full h-60 sm:h-72`, no `h-full` on the figure).
 */
export default function NotePhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img
        src={src}
        alt={title}
        className="w-full h-60 sm:h-72 object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 sm:p-4">
        <h3 className="text-white text-base sm:text-lg font-bold leading-snug">{title}</h3>
        <p className="text-gray-200 text-xs sm:text-sm mt-1">{desc}</p>
      </figcaption>
    </figure>
  );
}
