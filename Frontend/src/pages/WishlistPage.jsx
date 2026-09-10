import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistIds, wishlistCount, removeFromWishlist } = useWishlist();
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
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load wishlist products.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const wishlistProducts = useMemo(() => {
    const savedIds = new Set(wishlistIds);
    return products.filter((product) => savedIds.has(String(product.id)));
  }, [products, wishlistIds]);

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/wishlist' } } });
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

  if (loading) return <div className="state-panel loading-state">Loading your wishlist...</div>;
  if (error) return <div className="state-panel error-state" role="alert"><strong>We could not load your wishlist.</strong><span>{error}</span><button className="btn btn-secondary" type="button" onClick={() => window.location.reload()}>Try again</button></div>;
  if (wishlistCount === 0 || wishlistProducts.length === 0) {
    return (
      <div className="wishlist-page page-shell">
        <section className="page-heading compact-heading"><div><span className="eyebrow">Saved for later</span><h1>My Wishlist</h1></div><span className="result-count">0 items</span></section>
        <div className="empty-wishlist state-panel"><span className="wishlist-empty-icon" aria-hidden="true">♥</span><strong>Your wishlist is empty</strong><span>Keep the pieces you love close by saving them for later.</span><button className="btn btn-primary" type="button" onClick={() => navigate('/products')}>Explore Products</button></div>
      </div>
    );
  }

  return (
    <div className="wishlist-page page-shell">
      <section className="page-heading compact-heading"><div><span className="eyebrow">Saved for later</span><h1>My Wishlist</h1></div><span className="result-count">{wishlistCount} {wishlistCount === 1 ? 'item' : 'items'}</span></section>
      {addError && <div className="alert error" role="alert">{addError}</div>}
      <div className="product-grid wishlist-grid" aria-label="Wishlist products">
        {wishlistProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            adding={addingId === product.id}
            added={addedId === product.id}
            showRemoveWishlist
            onRemoveWishlist={removeFromWishlist}
          />
        ))}
      </div>
    </div>
  );
}