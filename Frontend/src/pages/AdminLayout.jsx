import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const links = [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/products', label: 'Products' },
    { to: '/admin/users', label: 'Users' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand admin-brand" to="/admin"><span className="brand-mark">C</span><span>CartCraft</span></Link>
        <div className="admin-context"><span className="eyebrow">Workspace</span><strong>Admin console</strong></div>
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.end}>{link.label}</NavLink>)}
        </nav>
        <div className="admin-sidebar-footer">
          <Link className="admin-back-link" to="/">Back to store</Link>
          <button className="admin-logout" type="button" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><span className="eyebrow">CartCraft operations</span><p>Manage your store with clarity.</p></div><span className="admin-user">{user?.name || 'Administrator'} <small>{location.pathname.replace('/admin', '') || '/dashboard'}</small></span></header>
        <div className="admin-content"><Outlet /></div>
      </main>
    </div>
  );
}
