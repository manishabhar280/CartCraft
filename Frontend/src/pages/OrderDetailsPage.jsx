import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, ProductImage } from '../components/ProductCard';

const STATUS_STEPS = [
  { value: 'PENDING', label: 'Order Placed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
];

const STATUS_MESSAGES = {
  PENDING: 'Your order has been placed.',
  PROCESSING: 'Your order is being prepared.',
  SHIPPED: 'Your order is on the way.',
  DELIVERED: 'Your order has been delivered.',
  CANCELLED: 'This order was cancelled.',
};

const STATUS_LABELS = {
  PENDING: 'Order Placed',
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

function getTimelineState(status, stepValue) {
  if (status === 'CANCELLED') return 'completed';
  const currentIndex = STATUS_STEPS.findIndex((step) => step.value === status);
  const stepIndex = STATUS_STEPS.findIndex((step) => step.value === stepValue);
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'current';
  return 'upcoming';
}

function OrderTimeline({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="order-timeline" aria-label="Cancelled order timeline">
        <div className="timeline-step completed"><span className="timeline-marker">✓</span><span>Order Placed</span></div>
        <div className="timeline-connector completed" />
        <div className="timeline-step completed"><span className="timeline-marker">✓</span><span>Processing</span></div>
        <div className="timeline-connector cancelled" />
        <div className="timeline-step cancelled current"><span className="timeline-marker">×</span><span>Cancelled</span></div>
      </div>
    );
  }

  return (
    <div className="order-timeline" aria-label={`Order status: ${status}`}>
      {STATUS_STEPS.map((step, index) => {
        const state = getTimelineState(status, step.value);
        return (
          <div className="timeline-row" key={step.value}>
            <div className={`timeline-step ${state}`}>
              <span className="timeline-marker">{state === 'completed' ? '✓' : state === 'current' ? '●' : '○'}</span>
              <span>{step.label}</span>
            </div>
            {index < STATUS_STEPS.length - 1 && <div className={`timeline-connector ${state === 'completed' ? 'completed' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    api.get(`/api/orders/${id}`)
      .then((response) => { if (active) setOrder(response.data?.order || null); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="state-panel loading-state">Loading order details...</div>;
  if (error || !order) return <div className="state-panel error-state" role="alert"><strong>Unable to load this order.</strong><span>We could not find the order details.</span><button className="btn btn-secondary" onClick={() => navigate('/orders')}>Back to orders</button></div>;

  const status = String(order.status || 'PENDING').toUpperCase();
  const items = Array.isArray(order.items) ? order.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <div className="order-details-page page-shell">
      <Link className="back-link" to="/orders">← Back to orders</Link>
      <section className="page-heading compact-heading">
        <div><span className="eyebrow">Order tracking</span><h1>Order #{order.id}</h1><p className="muted">Placed on {formatDate(order.createdAt)}</p></div>
        <span className={`order-status status-${status.toLowerCase()}`}>{STATUS_LABELS[status] || 'Order status unavailable'}</span>
      </section>
      <section className="tracking-layout">
        <div className="tracking-main">
          <article className="tracking-card">
            <div className="tracking-card-heading"><div><span className="eyebrow">Delivery progress</span><h2>{STATUS_MESSAGES[status] || 'Your order is being processed.'}</h2></div><span className="tracking-item-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span></div>
            <OrderTimeline status={status} />
          </article>
          <article className="tracking-card">
            <div className="tracking-card-heading"><div><span className="eyebrow">In this order</span><h2>Items</h2></div></div>
            <div className="order-detail-items">
              {items.map((item) => (
                <div className="order-detail-item" key={item.id}>
                  <ProductImage product={item.product} className="order-detail-image" />
                  <div><h3>{item.product?.name || 'Product'}</h3><span className="muted">Qty: {item.quantity || 0}</span></div>
                  <div className="order-detail-price"><span>{formatPrice(item.price)} each</span><strong>{formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</strong></div>
                </div>
              ))}
            </div>
          </article>
        </div>
        <aside className="order-summary-card">
          <span className="eyebrow">Order summary</span><h2>Order totals</h2>
          <div className="summary-row"><span>Subtotal</span><strong>{formatPrice(order.subtotal)}</strong></div>
          {order.couponCode && <div className="summary-row"><span>Coupon · {order.couponCode}</span><strong className="discount-value">-{formatPrice(order.discount)}</strong></div>}
          <div className="summary-divider" />
          <div className="summary-total"><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
        </aside>
      </section>
    </div>
  );
}
