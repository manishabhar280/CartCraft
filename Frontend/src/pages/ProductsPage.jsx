import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { fetchProducts } from '../api/products';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

export default function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [category, setCategory] = useState(() => searchParams.get('category') || '');
  const [minPrice, setMinPrice] = useState(() => searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [stock, setStock] = useState(() => searchParams.get('stock') || 'all');
  const [sort, setSort] = useState(() => searchParams.get('sort') || 'featured');

  useEffect(() => {
    let active = true;

    fetchProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Unable to load products.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const priceBounds = useMemo(() => {
    const prices = products.map((product) => Number(product.price)).filter(Number.isFinite);
    return { min: prices.length ? Math.min(...prices) : 0, max: prices.length ? Math.max(...prices) : 0 };
  }, [products]);

  const categories = useMemo(() => (
    [...new Set(products.map((product) => String(product.category || '').trim()).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second))
  ), [products]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (search.trim()) nextParams.set('search', search.trim());
    if (category) nextParams.set('category', category);
    if (minPrice) nextParams.set('minPrice', minPrice);
    if (maxPrice) nextParams.set('maxPrice', maxPrice);
    if (stock !== 'all') nextParams.set('stock', stock);
    if (sort !== 'featured') nextParams.set('sort', sort);
    setSearchParams(nextParams, { replace: true });
  }, [category, maxPrice, minPrice, search, setSearchParams, sort, stock]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const minimum = minPrice === '' ? -Infinity : Number(minPrice);
    const maximum = maxPrice === '' ? Infinity : Number(maxPrice);
    const matchingProducts = products.filter((product) => {
      const searchableText = [product.name, product.category, product.description]
        .filter(Boolean).join(' ').toLowerCase();
      const productPrice = Number(product.price);
      const inSelectedStock = stock === 'all' || (stock === 'in-stock' ? Number(product.stock) > 0 : Number(product.stock) <= 0);

      return (!normalizedSearch || searchableText.includes(normalizedSearch))
        && (!category || product.category === category)
        && (!Number.isNaN(minimum) && productPrice >= minimum)
        && (!Number.isNaN(maximum) && productPrice <= maximum)
        && inSelectedStock;
    });

    return [...matchingProducts].sort((first, second) => {
      if (sort === 'price-low') return Number(first.price) - Number(second.price);
      if (sort === 'price-high') return Number(second.price) - Number(first.price);
      if (sort === 'name-az') return String(first.name).localeCompare(String(second.name));
      if (sort === 'name-za') return String(second.name).localeCompare(String(first.name));
      return 0;
    });
  }, [category, maxPrice, minPrice, products, search, sort, stock]);

  const hasActiveFilters = Boolean(search || category || minPrice || maxPrice || stock !== 'all' || sort !== 'featured');

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setStock('all');
    setSort('featured');
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/products' } } });
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
    <div className="page-shell">
      <section className="page-heading">
        <div>
          <span className="eyebrow">The collection</span>
          <h1>Products made for the everyday.</h1>
          <p className="lead">Find well-chosen essentials with a little more thought in every detail.</p>
        </div>
        {!loading && !error && <span className="result-count">Showing {filteredProducts.length} of {products.length} products</span>}
      </section>
      {addError && <div className="alert error" role="alert">{addError}</div>}
      {loading && (
        <div className="product-grid" aria-label="Loading products">
          {[1, 2, 3, 4].map((item) => <div className="product-skeleton" key={item} />)}
        </div>
      )}
      {!loading && error && <div className="state-panel error-state" role="alert"><strong>We could not load the collection.</strong><span>{error}</span></div>}
      {!loading && !error && products.length === 0 && (
        <div className="state-panel"><strong>No products available yet.</strong><span>Check back soon for the next CartCraft drop.</span></div>
      )}
      {!loading && !error && products.length > 0 && (
        <>
          <section className="product-toolbar" aria-label="Product search and filters">
            <div className="search-field">
              <label htmlFor="product-search">Search products</label>
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input id="product-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, category, or description" />
              {search && <button className="clear-search" type="button" onClick={() => setSearch('')} aria-label="Clear search">×</button>}
            </div>
            <div className="filter-controls">
              <div className="filter-field">
                <label htmlFor="category-filter">Category</label>
                <select id="category-filter" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <details className="price-filter">
                <summary>Price <span aria-hidden="true">⌄</span></summary>
                <div className="price-filter-panel">
                  <span className="filter-panel-label">Price range</span>
                  <div className="price-inputs">
                    <label htmlFor="minimum-price">Min <input id="minimum-price" type="number" min={priceBounds.min} max={priceBounds.max} step="0.01" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} placeholder={priceBounds.min.toFixed(2)} /></label>
                    <label htmlFor="maximum-price">Max <input id="maximum-price" type="number" min={priceBounds.min} max={priceBounds.max} step="0.01" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} placeholder={priceBounds.max.toFixed(2)} /></label>
                  </div>
                </div>
              </details>
              <div className="filter-field">
                <label htmlFor="stock-filter">Stock</label>
                <select id="stock-filter" value={stock} onChange={(event) => setStock(event.target.value)}>
                  <option value="all">All</option><option value="in-stock">In Stock</option><option value="out-of-stock">Out of Stock</option>
                </select>
              </div>
              <div className="filter-field sort-field">
                <label htmlFor="sort-filter">Sort By</label>
                <select id="sort-filter" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="featured">Featured / Default</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name-az">Name: A to Z</option><option value="name-za">Name: Z to A</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Clear all filters</button>}
          </section>
          {filteredProducts.length === 0 ? (
            <div className="state-panel filtered-empty"><strong>No products found</strong><span>Try adjusting your search or clearing one of the filters.</span><button className="btn btn-secondary" type="button" onClick={clearFilters}>Clear all filters</button></div>
          ) : (
            <div className="product-grid">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              adding={addingId === product.id}
              added={addedId === product.id}
            />
          ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}