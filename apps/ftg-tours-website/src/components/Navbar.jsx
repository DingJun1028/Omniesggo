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

function MenuIcon({ open }) {
  return (
    <div className="w-6 h-5 flex flex-col justify-between">
      <span className={`block h-0.5 bg-ftg-forest transition-all duration-300 ${open ? 'rotate-45 translate-y-2' : ''}`} />
      <span className={`block h-0.5 bg-ftg-forest transition-all duration-300 ${open ? 'opacity-0' : ''}`} />
      <span className={`block h-0.5 bg-ftg-forest transition-all duration-300 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 font-bold text-ftg-forest text-lg">
            <span className="inline-block w-8 h-8 rounded-full bg-ftg-forest text-white flex items-center justify-center text-sm font-bold shadow">FTG</span>
            <span className="hidden sm:inline">FTG TOURS</span>
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
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                type="button"
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1 transition-colors ${
                  dropdownOpen ? 'text-ftg-forest' : 'text-gray-600 hover:text-ftg-forest'
                }`}
                aria-expanded={dropdownOpen}
              >
                企業方案
                <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
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

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="https://journey.ftgtours.esggo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow"
            >
              探索方案
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-ftg-forest hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          <NavLink
            to="/"
            end
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-ftg-sand text-ftg-forest' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            首頁
          </NavLink>
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">企業方案</div>
          {corporateItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-ftg-sand text-ftg-forest font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/esg-impact-note"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-ftg-sand text-ftg-forest' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            ESG Impact Note
          </NavLink>
          <div className="pt-3 pb-1">
            <a
              href="https://journey.ftgtours.esggo.co"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center px-5 py-3 rounded-full text-sm font-semibold bg-ftg-orange text-white hover:bg-orange-600 transition-all shadow"
            >
              探索方案 →
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
