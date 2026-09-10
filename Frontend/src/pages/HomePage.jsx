import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((items) => { if (active) setProducts(items); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load featured products.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    try {
      setAddingId(productId);
      setAddError('');
      await api.post('/api/cart', { productId, quantity: 1 });
      setAddedId(productId);
      window.setTimeout(() => setAddedId((current) => (current === productId ? null : current)), 1800);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Unable to add product to cart.');
    } finally {
      setAddingId(null);
    }
  };

  const handleBuyNow = (product) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', state: { mode: 'buy-now', product, quantity: 1 } } } });
      return;
    }
    navigate('/checkout', { state: { mode: 'buy-now', product, quantity: 1 } });
  };

  return (
    <div className="home-page page-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow hero-eyebrow">A better way to browse</span>
          <h1>Good things, <em>beautifully</em> considered.</h1>
          <p className="hero-description">CartCraft brings together useful, lasting pieces for the rituals that make up your everyday.</p>
          <div className="hero-actions"><Link className="btn btn-primary btn-large" to="/products">Shop now <span aria-hidden="true">→</span></Link><Link className="text-link" to="/products">Explore the collection <span aria-hidden="true">↗</span></Link></div>
          <div className="hero-proof"><span className="proof-dot" /> Thoughtful picks, delivered simply</div>
        </div>
        <div className="hero-art" aria-label="CartCraft collection illustration"><img src="/assets/product-showcase.svg" alt="A sculptural ceramic vase with a leafy branch" /><div className="hero-art-label"><span>01</span><span>New everyday objects</span></div></div>
      </section>
      <section className="featured-section">
        <div className="section-heading-row"><div><span className="eyebrow">From the collection</span><h2>Made to be kept.</h2></div><Link className="text-link" to="/products">View all products <span aria-hidden="true">→</span></Link></div>
        {addError && <div className="alert error" role="alert">{addError}</div>}
        {loading && <div className="product-grid" aria-label="Loading featured products">{[1, 2, 3].map((item) => <div className="product-skeleton" key={item} />)}</div>}
        {!loading && error && <div className="state-panel error-state" role="alert"><strong>Featured products are taking a moment.</strong><span>{error}</span><Link className="btn btn-secondary" to="/products">Browse products</Link></div>}
        {!loading && !error && products.length === 0 && <div className="state-panel"><strong>The collection is between drops.</strong><span>Come back soon to see what is new.</span></div>}
        {!loading && !error && products.length > 0 && <div className="product-grid featured-grid">{products.slice(0, 3).map((product) => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} adding={addingId === product.id} added={addedId === product.id} />)}</div>}
      </section>
      <section className="home-note"><span className="eyebrow">CartCraft standard</span><p>Useful objects. Clear choices. A little more joy in the ordinary.</p><Link className="btn btn-secondary" to="/products">Shop the edit</Link></section>
    </div>
  );
}
