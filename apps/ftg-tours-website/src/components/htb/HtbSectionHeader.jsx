export default function HtbSectionHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h2 className="text-[20px] font-extrabold md:text-2xl">{title}</h2>
      {description ? (
        <p className="mt-2 text-sm text-gray-600 leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}
