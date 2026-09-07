export default function HtbNavbar() {
  return (
    <nav className="bg-white border-b-[3px] border-htb-sprout sticky top-0 z-10">
      <div className="mx-auto max-w-[480px] px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-[15px] font-bold text-htb-charcoal leading-tight">
            高科生技股份有限公司
          </div>
          <div className="text-xs text-gray-500 mt-0.5">畜牧碳資產平台</div>
        </div>
        <button
          aria-label="menu"
          className="w-[34px] h-[34px] grid place-items-center border border-gray-200 rounded-lg bg-white"
        >
          ☰
        </button>
      </div>
    </nav>
  );
}
