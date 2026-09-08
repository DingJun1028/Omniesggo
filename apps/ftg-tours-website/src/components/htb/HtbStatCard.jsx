export default function HtbStatCard({ value, label }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3">
      <div className="text-[26px] font-extrabold text-htb-deepSea">{value}</div>
      <div className="mt-1 text-[13px] text-gray-700 leading-snug">{label}</div>
    </div>
  );
}
