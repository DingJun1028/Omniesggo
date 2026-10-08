/**
 * PhotoCard.jsx — image card with a caption overlaid on the bottom of the photo.
 * 5T-Traceable: recovered from the production bundle, `function kr({src,title,desc})`
 *   at offset 370429. The prop is `src`, not `image`: call sites pass
 *   `(0,A.jsx)(kr,{src:t.src,title:...,desc:...})`, so an `image` prop silently
 *   renders an <img> with no source.
 */
export default function PhotoCard({ src, title, desc }) {
  return (
    <figure className="relative overflow-hidden rounded-2xl shadow-lg group">
      <img
        src={src}
        alt={title}
        className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover transition-transform group-hover:scale-105"
        loading="lazy"
      />
      <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 p-3 md:p-4">
        <h3 className="text-white text-base md:text-lg font-bold">{title}</h3>
        <p className="text-gray-200 text-xs md:text-sm">{desc}</p>
      </figcaption>
    </figure>
  );
}
