import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, ProductImage } from '../components/ProductCard';

const STATUS_LABELS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

function formatDate(value) {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadOrders = () => {
    setLoading(true);
    setError('');
    let active = true;
    api.get('/api/orders')
      .then((response) => { if (active) setOrders(Array.isArray(response.data?.orders) ? response.data.orders : []); })
      .catch(() => { if (active) setError('Unable to load your orders.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  };

  useEffect(() => loadOrders(), []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchesSearch = !query || String(order.id).includes(query) || (order.items || []).some((item) => item.product?.name?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => orders.reduce((counts, order) => ({ ...counts, [order.status]: (counts[order.status] || 0) + 1 }), {}), [orders]);

  if (loading) return <div className="state-panel loading-state">Loading your orders...</div>;
  if (error) return <div className="state-panel error-state" role="alert"><strong>Unable to load your orders.</strong><span>Please try again in a moment.</span><button className="btn btn-secondary" onClick={loadOrders}>Try again</button></div>;
  if (orders.length === 0) return <div className="empty-orders state-panel"><span className="empty-cart-icon">✦</span><strong>No orders yet</strong><span>Your purchased products will appear here.</span><Link className="btn btn-primary" to="/products">Start shopping</Link></div>;

  return (
    <div className="orders-page page-shell">
      <section className="page-heading compact-heading"><div><span className="eyebrow">Your history</span><h1>Orders</h1></div><span className="result-count">{orders.length} {orders.length === 1 ? 'order' : 'orders'}</span></section>
      <section className="orders-toolbar" aria-label="Order filters">
        <div className="search-field"><label htmlFor="order-search">Search orders</label><span className="search-icon" aria-hidden="true">⌕</span><input id="order-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by order ID or product" /></div>
        <div className="order-filter-tabs" role="list" aria-label="Filter orders by status">
          {['ALL', ...Object.keys(STATUS_LABELS)].map((status) => <button className={statusFilter === status ? 'active' : ''} type="button" key={status} onClick={() => setStatusFilter(status)}>{status === 'ALL' ? 'All' : STATUS_LABELS[status]} <span>{status === 'ALL' ? orders.length : statusCounts[status] || 0}</span></button>)}
        </div>
      </section>
      {filteredOrders.length === 0 ? <div className="state-panel"><strong>No matching orders</strong><span>Try a different status or search term.</span></div> : <div className="orders-list">
        {filteredOrders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
          return <article className="order-card" key={order.id}><div className="order-card-header"><div><span className="eyebrow">Order #{order.id ?? '—'}</span><h2>Placed on {formatDate(order.createdAt)}</h2></div><span className={`order-status status-${String(order.status || 'PENDING').toLowerCase()}`}>{STATUS_LABELS[order.status] || 'Pending'}</span></div><div className="order-items">{items.map((item) => <div className="order-item" key={item.id}><ProductImage product={item.product} className="order-item-image" /><span>{item.product?.name || 'Product'} <strong>× {item.quantity || 0}</strong></span><strong>{formatPrice(Number(item.price || item.product?.price || 0) * Number(item.quantity || 0))}</strong></div>)}</div><div className="order-card-summary"><div><span>Items</span><strong>{itemCount}</strong></div><div><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>{Number(order.discount || 0) > 0 && <div><span>{order.couponCode ? `Discount · ${order.couponCode}` : 'Discount'}</span><strong className="discount-value">-{formatPrice(order.discount)}</strong></div>}<div><span>Total</span><strong>{formatPrice(order.total)}</strong></div></div><div className="order-card-actions"><Link className="btn btn-primary" to={`/orders/${order.id}`}>Track order</Link><Link className="btn btn-secondary" to={`/orders/${order.id}`}>View details</Link></div></article>;
        })}
      </div>}
    </div>
  );
}
