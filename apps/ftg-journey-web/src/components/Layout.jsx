import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '儀表板', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-primary text-white px-6 h-16 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-accent">FTG</span>
          <span className="text-base opacity-80">Journey</span>
        </div>

        <nav className="flex gap-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user?.picture && (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm">{user?.name || user?.email}</span>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 bg-white/15 border-none rounded-lg text-white text-sm cursor-pointer hover:bg-white/25 transition-colors"
          >
            登出
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-6">
        {children}
      </main>
    </div>
  );
}
