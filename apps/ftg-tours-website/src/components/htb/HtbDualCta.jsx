export default function HtbDualCta() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <a
        href="/htb/nuber"
        className="flex flex-col items-center justify-center rounded-2xl bg-htb-deepSea text-white px-4 py-4"
      >
        <span className="text-[11px] font-medium opacity-90">酪農</span>
        <span className="mt-1 text-center text-sm font-bold leading-tight">我要精準減碳</span>
      </a>
      <a
        href="/htb/nuber"
        className="flex flex-col items-center justify-center rounded-2xl bg-htb-sprout text-white px-4 py-4"
      >
        <span className="text-[11px] font-medium opacity-90">企業</span>
        <span className="mt-1 text-center text-sm font-bold leading-tight">我要碳權諮詢</span>
      </a>
    </div>
  );
}
