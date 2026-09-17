import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

// 企業方案下拉選單
const corporateItems = [
  { path: '/streams', label: '六流體系', desc: '覺曉 / 凝聚 / 復元 / 共好 / 留念 / 基礎' },
  { path: '/corporate-travel', label: '企業員工旅遊', desc: '客製化員工旅遊，凝聚團隊與永續行動' },
  { path: '/family-day', label: '企業家庭日', desc: '親子共融的戶外健康家庭日活動' },
  { path: '/esg-team-day', label: 'ESG Outdoor Team Day', desc: '結合環境與社會共益的戶外團隊日' },
  { path: '/wellbeing-retreat', label: 'Employee Wellbeing Retreat', desc: '身心健康主題的主管與員工 retreat' },
  { path: '/executive-retreat', label: '高階主管共識營', desc: '高階主管共識建立與策略 retreat' },
  { path: '/journey-app', label: 'Journey App', desc: '永續旅程管理平台，追蹤旅行影響力' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-ftg-forest text-lg">
            <span className="inline-block w-8 h-8 rounded-full bg-ftg-forest text-white flex items-center justify-center text-sm">FTG</span>
            FTG TOURS
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-ftg-forest' : 'text-gray-600 hover:text-ftg-forest'
                }`
              }
            >
              首頁
            </NavLink>

            {/* 企業方案 dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
            >
              <button
                type="button"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
                  open ? 'text-ftg-forest' : 'text-gray-600 hover:text-ftg-forest'
                }`}
                aria-expanded={open}
              >
                企業方案
                <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 p-2">
                  {corporateItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg transition-colors ${
                          active ? 'bg-ftg-sand' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-semibold text-ftg-forest">{item.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <NavLink
              to="/esg-impact-note"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive ? 'text-ftg-forest' : 'text-gray-600 hover:text-ftg-forest'
                }`
              }
            >
              ESG Impact Note
            </NavLink>
          </div>

          {/* CTA */}
          <a
            href="https://journey.ftgtours.esggo.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex px-5 py-2 rounded-full text-sm font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow"
          >
            探索方案
          </a>
        </div>
      </div>
    </nav>
  );
}
