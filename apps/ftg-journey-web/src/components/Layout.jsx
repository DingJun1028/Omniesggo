import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '儀表板', icon: '📊' },
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
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                color: '#fff',
                textDecoration: 'none',
                background: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                fontWeight: location.pathname === item.path ? 600 : 400,
                fontSize: 14,
              }}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

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
          >
            登出
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {children}
      </main>
    </div>
  );
}
