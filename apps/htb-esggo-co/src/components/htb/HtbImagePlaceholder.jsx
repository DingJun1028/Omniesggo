export default function HtbImagePlaceholder({ label, gradient = 'from-[#d9770633] to-[#7F1D1D22]' }) {
  return (
    <div className={`w-full h-[140px] rounded-2xl bg-gradient-to-b ${gradient} border border-gray-200 flex items-center justify-center`}>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
