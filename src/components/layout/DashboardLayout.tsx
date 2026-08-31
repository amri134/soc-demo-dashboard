import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const nav = [['/', 'Overview', '▦'], ['/alerts', 'Alerts', '⚠'], ['/incidents', 'Incidents', '◇'], ['/notifications', 'Notifications', '◉'], ['/audit-logs', 'Audit log', '≡'], ['/settings', 'Settings', '⚙']];

export function DashboardLayout() {
  const { user, logout, error } = useAuth();
  return <div className="dashboard-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">S</span><span><strong>Sentinel Lab</strong><small>SOC demo workspace</small></span></div>
      <nav className="sidebar-nav" aria-label="Navigasi utama">{nav.map(([to, label, icon]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><span>{icon}</span>{label}</NavLink>)}</nav>
      <div className="sidebar-footer"><span className="avatar">{(user?.name || user?.email || 'U')[0].toUpperCase()}</span><span className="user-summary"><strong>{user?.name || 'Demo user'}</strong><small>{user?.email}</small></span><button className="icon-button" type="button" onClick={() => void logout()} aria-label="Keluar">↪</button></div>
    </aside>
    <div className="dashboard-content">
      <header className="topbar"><div><p className="eyebrow">Security operations</p><h1>Demo workspace</h1></div><span className="connection-status"><i /> Appwrite connected</span></header>
      <div className="demo-banner" role="note"><strong>Demo mode</strong><span>Seluruh alert, aset, IP, dan notifikasi adalah data sintetis. Tidak terhubung ke Wazuh atau Telegram.</span></div>
      {error && <div className="workspace-error" role="alert">{error}</div>}
      <main className="page-content"><Outlet /></main>
    </div>
  </div>;
}
