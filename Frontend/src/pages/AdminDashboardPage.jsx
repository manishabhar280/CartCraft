import { useEffect, useState } from 'react';
import api from '../api/client';
import { formatPrice } from '../components/ProductCard';

const STATUS_LABELS = { PENDING: 'Pending', PROCESSING: 'Processing', SHIPPED: 'Shipped', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true); setError('');
    api.get('/api/admin/dashboard').then((response) => setStats(response.data?.stats || null)).catch(() => setError('Unable to load dashboard statistics.')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="admin-state">Loading dashboard...</div>;
  if (error) return <div className="admin-state admin-error" role="alert"><strong>Dashboard unavailable</strong><span>{error}</span><button className="btn btn-secondary" type="button" onClick={load}>Try again</button></div>;
  if (!stats) return <div className="admin-state"><strong>No dashboard data yet</strong><span>Store activity will appear here.</span></div>;

  const cards = [
    ['Total users', stats.totalUsers, 'registered accounts'],
    ['Total products', stats.totalProducts, 'catalog items'],
    ['Total orders', stats.totalOrders, 'orders placed'],
    ['Total revenue', formatPrice(stats.totalRevenue), 'excluding cancelled orders'],
  ];
  return <div className="admin-page"><div className="admin-page-heading"><div><span className="eyebrow">Overview</span><h1>Dashboard</h1><p className="muted">A clear view of today’s store operations.</p></div></div><div className="admin-stat-grid">{cards.map(([label, value, note]) => <article className="admin-stat-card" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div><section className="admin-panel"><div className="admin-panel-heading"><div><span className="eyebrow">Order health</span><h2>Orders by status</h2></div></div><div className="admin-status-grid">{Object.keys(STATUS_LABELS).map((status) => <div className={`admin-status-stat status-${status.toLowerCase()}`} key={status}><span>{STATUS_LABELS[status]}</span><strong>{stats.orderStats?.[status] || 0}</strong></div>)}</div></section></div>;
}
