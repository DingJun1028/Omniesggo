import { useState } from 'react';

const links = [
  { href: '/htb', label: '首頁' },
  { href: '/htb/about', label: '關於我們' },
  { href: '/htb/technology', label: '技術' },
  { href: '/htb/cases', label: '案例' },
  { href: '/htb/partnership', label: '合作' },
  { href: '/htb/contact', label: '聯繫' },
];

export default function HtbNavbar() {
  const [open, setOpen] = useState(false);

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
          onClick={() => setOpen((prev) => !prev)}
          className="w-[34px] h-[34px] grid place-items-center border border-gray-200 rounded-lg bg-white"
        >
          ☰
        </button>
      </div>

      {open ? (
        <div className="mx-auto max-w-[480px] px-4 pb-4">
          <div className="rounded-2xl border border-gray-200 bg-white divide-y divide-gray-100">
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 text-sm font-bold text-htb-charcoal"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
