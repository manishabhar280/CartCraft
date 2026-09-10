import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, ProductImage } from '../components/ProductCard';

export default function CartPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/cart');
      setCart(response.data?.cart || { items: [] });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load your cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const items = Array.isArray(cart.items) ? cart.items : [];
  const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0), [items]);
  const couponDiscount = Number(appliedCoupon?.discount || 0);
  const finalTotal = Math.max(0, total - couponDiscount);

  const validateCoupon = async (code, subtotal = total) => {
    const normalizedCode = String(code || '').trim().toUpperCase();
    if (!normalizedCode) {
      setCouponError('Please enter a coupon code.');
      return false;
    }
    try {
      setCouponLoading(true);
      setCouponError('');
      const response = await api.post('/api/coupons/validate', { code: normalizedCode, cartTotal: subtotal });
      setAppliedCoupon({ code: response.data.code, discount: Number(response.data.discount || 0), discountType: response.data.discountType });
      setCouponCode(response.data.code);
      return true;
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Unable to validate coupon. Please try again.');
      return false;
    } finally { setCouponLoading(false); }
  };

  useEffect(() => {
    const storedCode = localStorage.getItem('cartcraft_coupon_code');
    if (storedCode && items.length > 0) validateCoupon(storedCode, total);
  }, [total, items.length]);

  useEffect(() => {
    if (!appliedCoupon) return;
    localStorage.setItem('cartcraft_coupon_code', appliedCoupon.code);
  }, [appliedCoupon]);

  useEffect(() => {
    if (items.length === 0) {
      setAppliedCoupon(null);
      localStorage.removeItem('cartcraft_coupon_code');
    }
  }, [items.length]);

  const updateQuantity = async (id, quantity) => {
    if (quantity <= 0) return removeItem(id);
    try {
      setBusyId(id); setError('');
      await api.put(`/api/cart/${id}`, { quantity });
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update quantity.');
    } finally { setBusyId(null); }
  };

  const removeItem = async (id) => {
    try {
      setBusyId(id); setError('');
      await api.delete(`/api/cart/${id}`);
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove item.');
    } finally { setBusyId(null); }
  };

  const checkout = async () => {
    setCheckingOut(true);
    navigate('/checkout', { state: { coupon: appliedCoupon } });
    setCheckingOut(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    localStorage.removeItem('cartcraft_coupon_code');
  };

  if (loading) return <div className="state-panel loading-state">Loading your cart...</div>;
  if (error && items.length === 0) return <div className="state-panel error-state" role="alert"><strong>We could not load your cart.</strong><span>{error}</span><button className="btn btn-secondary" onClick={fetchCart}>Try again</button></div>;
  if (items.length === 0) return <div className="empty-cart state-panel"><span className="empty-cart-icon">○</span><strong>Your cart is waiting.</strong><span>Add something useful and it will appear here.</span><button className="btn btn-primary" onClick={() => navigate('/products')}>Continue shopping</button></div>;

  return (
    <div className="cart-page page-shell">
      <section className="page-heading compact-heading"><div><span className="eyebrow">Your selection</span><h1>Your cart</h1></div><span className="result-count">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span></section>
      {error && <div className="alert error" role="alert">{error}</div>}
      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {items.map((item) => {
            const quantity = Number(item.quantity || 1);
            const itemTotal = Number(item.product?.price || 0) * quantity;
            return <article className="cart-item" key={item.id}><ProductImage product={item.product} className="cart-item-image" /><div className="cart-item-content"><span className="eyebrow">{item.product?.category || 'Essential'}</span><h2>{item.product?.name || 'Product unavailable'}</h2><span className="muted">{formatPrice(item.product?.price)} each</span></div><div className="cart-item-quantity"><span className="quantity-label">Quantity</span><div className="quantity-control"><button type="button" onClick={() => updateQuantity(item.id, quantity - 1)} disabled={busyId === item.id}>−</button><span>{quantity}</span><button type="button" onClick={() => updateQuantity(item.id, quantity + 1)} disabled={busyId === item.id}>+</button></div></div><strong className="cart-item-total">{formatPrice(itemTotal)}</strong><button className="remove-button" type="button" onClick={() => removeItem(item.id)} disabled={busyId === item.id}>Remove</button></article>;
          })}
        </section>
        <aside className="summary-card"><span className="eyebrow">Order summary</span><h2>Ready when you are.</h2><div className="coupon-box"><label htmlFor="cart-coupon">Have a coupon?</label><div className="coupon-entry"><input id="cart-coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon code" disabled={couponLoading || Boolean(appliedCoupon)} /><button className="btn btn-secondary" type="button" onClick={() => validateCoupon(couponCode)} disabled={couponLoading || Boolean(appliedCoupon)}>{couponLoading ? 'Checking...' : 'Apply'}</button></div>{couponError && <span className="coupon-error" role="alert">{couponError}</span>}{appliedCoupon && <div className="coupon-applied"><span><strong>Coupon Applied</strong><small>{appliedCoupon.code} · {appliedCoupon.discountType === 'PERCENTAGE' ? 'Percentage discount' : 'Fixed discount'}</small></span><button type="button" onClick={removeCoupon}>Remove</button></div>}</div><div className="summary-row"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>{appliedCoupon && <div className="summary-row discount-row"><span>Discount</span><strong>-{formatPrice(couponDiscount)}</strong></div>}<div className="summary-row"><span>Delivery</span><strong>Free</strong></div><div className="summary-divider" /><div className="summary-total"><span>Total</span><strong>{formatPrice(finalTotal)}</strong></div><button className="btn btn-primary btn-large full-width" onClick={checkout} disabled={checkingOut}>{checkingOut ? 'Opening checkout...' : 'Checkout'}</button><p className="summary-note">You can review your order before it is placed.</p></aside>
      </div>
    </div>
  );
}
