import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '儀表板', icon: '📊' },
<<<<<<< HEAD
    { path: '/philosophy', label: '六流哲學', icon: '🌊' },
  ];

  return (
    <div className="min-h-screen bg-warm-50">
      <header className="bg-primary text-white px-6 h-16 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-extrabold text-accent">FTG</span>
          <span className="text-base opacity-80">Journey</span>
        </div>

        <nav className="flex gap-2">
=======
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{
        background: '#10243f',
        color: '#fff',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#c9a24b' }}>FTG</span>
          <span style={{ fontSize: 16, opacity: 0.8 }}>Journey</span>
        </div>

        <nav style={{ display: 'flex', gap: 8 }}>
>>>>>>> origin/feature/aistation-core-modules
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
<<<<<<< HEAD
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === item.path ? 'bg-white/15' : 'hover:bg-white/10'
              }`}
=======
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                color: '#fff',
                textDecoration: 'none',
                background: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: location.pathname === item.path ? 600 : 400,
                fontSize: 14,
              }}
>>>>>>> origin/feature/aistation-core-modules
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

<<<<<<< HEAD
        <div className="flex items-center gap-3">
          {user?.picture && (
            <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
          )}
          <span className="text-sm">{user?.name || user?.email}</span>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 bg-white/15 border-none rounded-lg text-white text-sm cursor-pointer hover:bg-white/25 transition-colors"
=======
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.picture && (
              <img src={user.picture} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            )}
            <span style={{ fontSize: 14 }}>{user?.name || user?.email}</span>
          </div>
          <button
            onClick={logout}
            style={{
              padding: '6px 14px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
            }}
>>>>>>> origin/feature/aistation-core-modules
          >
            登出
          </button>
        </div>
      </header>

<<<<<<< HEAD
      <main className="max-w-6xl mx-auto py-8 px-6">
=======
      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
>>>>>>> origin/feature/aistation-core-modules
        {children}
      </main>
    </div>
  );
}
