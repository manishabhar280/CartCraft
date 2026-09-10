import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, ProductImage } from '../components/ProductCard';

const initialShipping = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
};

function SuccessState({ order }) {
  return (
    <div className="checkout-success state-panel">
      <span className="success-mark">✓</span>
      <span className="eyebrow">Order confirmed</span>
      <strong>Your order is on its way.</strong>
      <span>Order #{order?.id ?? 'confirmed'} has been placed successfully.</span>
      <strong className="success-total">{formatPrice(order?.total)}</strong>
      <div className="success-actions">
        <Link className="btn btn-primary" to="/orders">View orders</Link>
        <Link className="btn btn-secondary" to="/products">Continue shopping</Link>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const buyNow = location.state?.mode === 'buy-now';
  const selectedProduct = location.state?.product;
  const selectedQuantity = Number(location.state?.quantity || 1);
  const [cart, setCart] = useState({ items: [] });
  const [quantity, setQuantity] = useState(selectedQuantity);
  const [shipping, setShipping] = useState(initialShipping);
  const [loading, setLoading] = useState(!buyNow);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [couponCode, setCouponCode] = useState(location.state?.coupon?.code || localStorage.getItem('cartcraft_coupon_code') || '');
  const [appliedCoupon, setAppliedCoupon] = useState(location.state?.coupon || null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (buyNow) return undefined;

    let active = true;
    api.get('/api/cart')
      .then((response) => {
        if (active) setCart(response.data?.cart || { items: [] });
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load your cart for checkout.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [buyNow]);

  const items = useMemo(() => {
    if (buyNow && selectedProduct) {
      return [{ id: `buy-${selectedProduct.id}`, quantity, product: selectedProduct }];
    }
    return Array.isArray(cart.items) ? cart.items : [];
  }, [buyNow, cart.items, quantity, selectedProduct]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.product?.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );
  const discount = Number(appliedCoupon?.discount || 0);
  const finalTotal = Math.max(0, total - discount);

  const validateCoupon = async () => {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) return setCouponError('Please enter a coupon code.');
    try {
      setCouponLoading(true);
      setCouponError('');
      const response = await api.post('/api/coupons/validate', { code: normalizedCode, cartTotal: total });
      const nextCoupon = { code: response.data.code, discount: Number(response.data.discount || 0), discountType: response.data.discountType };
      setAppliedCoupon(nextCoupon);
      setCouponCode(nextCoupon.code);
      localStorage.setItem('cartcraft_coupon_code', nextCoupon.code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Unable to validate coupon. Please try again.');
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    localStorage.removeItem('cartcraft_coupon_code');
  };

  useEffect(() => {
    if (!loading && couponCode) validateCoupon();
  }, [loading, total]);

  const updateShipping = (event) => {
    const { name, value } = event.target;
    setShipping((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (placing) return;

    try {
      setPlacing(true);
      setError('');
      const response = await api.post('/api/orders', {
        couponCode: appliedCoupon?.code || undefined,
        items: buyNow ? [{ productId: Number(selectedProduct.id), quantity }] : undefined,
      });
      setOrder(response.data?.order || { total });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to place your order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (order) return <SuccessState order={order} />;
  if (loading) return <div className="state-panel loading-state">Loading checkout...</div>;
  if (error && items.length === 0) {
    return <div className="state-panel error-state" role="alert"><strong>Checkout is not ready.</strong><span>{error}</span><button className="btn btn-secondary" onClick={() => navigate('/cart')}>Back to cart</button></div>;
  }
  if (items.length === 0) {
    return <div className="state-panel"><strong>Your checkout is empty.</strong><span>Add a product or return to your cart to continue.</span><Link className="btn btn-primary" to="/products">Continue shopping</Link></div>;
  }

  return (
    <div className="checkout-page page-shell">
      <section className="page-heading compact-heading">
        <div><span className="eyebrow">Almost there</span><h1>Checkout</h1></div>
        <span className="result-count">Secure order review</span>
      </section>
      {error && <div className="alert error" role="alert">{error}</div>}
      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-main">
          <section className="checkout-card">
            <div className="checkout-card-heading"><div><span className="eyebrow">Your selection</span><h2>{buyNow ? 'Buy now' : 'Cart items'}</h2></div><span className="muted">{items.length} {items.length === 1 ? 'item' : 'items'}</span></div>
            <div className="checkout-items">
              {items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <ProductImage product={item.product} className="checkout-item-image" />
                  <div><span className="eyebrow">{item.product?.category || 'Essential'}</span><h3>{item.product?.name || 'Product'}</h3><span className="muted">{formatPrice(item.product?.price)} each</span></div>
                  {buyNow ? <div className="quantity-control checkout-quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(Number(selectedProduct.stock || 1), value + 1))} disabled={quantity >= Number(selectedProduct.stock || 1)}>+</button></div> : <span className="checkout-quantity-label">Qty {item.quantity}</span>}
                  <strong>{formatPrice(Number(item.product?.price || 0) * Number(item.quantity || 0))}</strong>
                </div>
              ))}
            </div>
          </section>
          <section className="checkout-card">
            <div className="checkout-card-heading"><div><span className="eyebrow">Delivery details</span><h2>Shipping information</h2></div></div>
            <div className="shipping-grid">
              <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" value={shipping.fullName} onChange={updateShipping} required /></div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" value={shipping.email} onChange={updateShipping} required /></div>
              <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" value={shipping.phone} onChange={updateShipping} required /></div>
              <div className="field field-wide"><label htmlFor="address">Address</label><input id="address" name="address" value={shipping.address} onChange={updateShipping} required /></div>
              <div className="field"><label htmlFor="city">City</label><input id="city" name="city" value={shipping.city} onChange={updateShipping} required /></div>
              <div className="field"><label htmlFor="state">State</label><input id="state" name="state" value={shipping.state} onChange={updateShipping} required /></div>
              <div className="field"><label htmlFor="postalCode">Postal code</label><input id="postalCode" name="postalCode" value={shipping.postalCode} onChange={updateShipping} required /></div>
            </div>
          </section>
        </div>
        <aside className="checkout-summary summary-card"><span className="eyebrow">Order summary</span><h2>Ready to place.</h2><div className="coupon-box"><label htmlFor="checkout-coupon">Have a coupon?</label><div className="coupon-entry"><input id="checkout-coupon" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} placeholder="Enter coupon code" disabled={couponLoading || Boolean(appliedCoupon)} /><button className="btn btn-secondary" type="button" onClick={validateCoupon} disabled={couponLoading || Boolean(appliedCoupon)}>{couponLoading ? 'Checking...' : 'Apply'}</button></div>{couponError && <span className="coupon-error" role="alert">{couponError}</span>}{appliedCoupon && <div className="coupon-applied"><span><strong>{appliedCoupon.code} applied</strong><small>Coupon discount</small></span><button type="button" onClick={removeCoupon}>Remove</button></div>}</div><div className="summary-row"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>{appliedCoupon && <div className="summary-row discount-row"><span>Discount</span><strong>-{formatPrice(discount)}</strong></div>}<div className="summary-row"><span>Delivery</span><strong>Free</strong></div><div className="summary-divider" /><div className="summary-total"><span>Total</span><strong>{formatPrice(finalTotal)}</strong></div><button className="btn btn-primary btn-large full-width" type="submit" disabled={placing}>{placing ? 'Placing order...' : 'Place order'}</button><p className="summary-note">No card details are stored. Your order is created securely through CartCraft.</p></aside>
      </form>
    </div>
  );
}
