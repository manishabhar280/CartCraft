import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export const localProductImages = {
  home: '/assets/products/home.svg',
  tech: '/assets/products/tech.svg',
  wellness: '/assets/products/wellness.svg',
  apparel: '/assets/products/apparel.svg',
  kitchen: '/assets/products/kitchen.svg',
  generic: '/assets/products/home.svg',
};

const productImagesByName = {
  'wireless headphones': '/assets/products/wireless-headphones.svg',
  'smart watch': '/assets/products/smart-watch.svg',
  'bluetooth speaker': '/assets/products/bluetooth-speaker.svg',
  'laptop stand': '/assets/products/laptop-stand.svg',
  'classic cotton t-shirt': '/assets/products/classic-tshirt.svg',
  'denim jacket': '/assets/products/denim-jacket.svg',
  'everyday sneakers': '/assets/products/sneakers.svg',
  'urban backpack': '/assets/products/backpack.svg',
  'ceramic vase': '/assets/products/ceramic-vase.svg',
  'minimal table lamp': '/assets/products/table-lamp.svg',
  'soft cushion set': '/assets/products/cushion-set.svg',
  'decorative wall clock': '/assets/products/wall-clock.svg',
  'stoneware serving bowl': '/assets/products/serving-bowl.svg',
  'morning light pour-over': '/assets/products/pour-over.svg',
  'ceramic coffee mug': '/assets/products/coffee-mug.svg',
  'stainless steel lunch box': '/assets/products/lunch-box.svg',
  'botanical care set': '/assets/products/botanical-care.svg',
  'gentle face wash': '/assets/products/face-wash.svg',
  'essential oil set': '/assets/products/essential-oil.svg',
  'classic sunglasses': '/assets/products/sunglasses.svg',
  'orbit wireless speaker': '/assets/products/orbit-speaker.svg',
  'field notes headphones': '/assets/products/field-headphones.svg',
  'ridge knit overshirt': '/assets/products/overshirt.svg',
  'everyday canvas tote': '/assets/products/canvas-tote.svg',
  'arc ceramic vase': '/assets/products/arc-vase.svg',
  'linen cloud throw': '/assets/products/linen-throw.svg',
  'demo product': '/assets/products/demo-product.svg',
};

const fallbackGroups = [
  { key: 'tech', terms: ['tech', 'electronic', 'audio', 'phone', 'computer', 'camera', 'device', 'headphone'] },
  { key: 'wellness', terms: ['wellness', 'beauty', 'health', 'care', 'skin', 'fitness', 'body', 'bath'] },
  { key: 'apparel', terms: ['apparel', 'clothing', 'fashion', 'wear', 'shoe', 'bag', 'accessor', 'shirt'] },
  { key: 'kitchen', terms: ['kitchen', 'food', 'cook', 'drink', 'coffee', 'dining', 'homeware'] },
];

function getProductFallback(product = {}) {
  const identity = `${product.category || ''} ${product.name || ''}`.toLowerCase();
  const productName = String(product.name || '').trim().toLowerCase();
  if (productImagesByName[productName]) return productImagesByName[productName];
  const matchedGroup = fallbackGroups.find((group) => group.terms.some((term) => identity.includes(term)));

  if (matchedGroup) return localProductImages[matchedGroup.key];

  const hash = [...identity].reduce((total, character) => total + character.charCodeAt(0), 0);
  return Object.values(localProductImages)[hash % Object.values(localProductImages).length];
}

export function getProductImage(product = {}) {
  const image = typeof product === 'string' ? product : product.image;
  const fallback = typeof product === 'string' ? localProductImages.home : getProductFallback(product);
  return !image || image.includes('example.com') ? fallback : image;
}

function ProductImage({ product, className = 'product-image' }) {
  return (
    <img
      className={className}
      src={getProductImage(product)}
      alt={product?.name || 'CartCraft product'}
      onError={(event) => {
        const fallback = getProductFallback(product);
        if (!event.currentTarget.src.endsWith(fallback)) {
          event.currentTarget.src = fallback;
        }
      }}
    />
  );
}

function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : 'Price unavailable';
}

export default function ProductCard({ product, onAddToCart, onBuyNow, adding = false, added = false, showRemoveWishlist = false, onRemoveWishlist }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const stock = Number(product?.stock || 0);
  const inStock = stock > 0;
  const saved = isWishlisted(product?.id);

  const handleWishlist = () => {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    toggleWishlist(product?.id);
  };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <Link className="product-card-image-link" to={`/products/${product.id}`} aria-label={`View ${product.name}`}>
          <ProductImage product={product} />
        </Link>
        <button className={`wishlist-heart ${saved ? 'is-saved' : ''}`} type="button" onClick={handleWishlist} aria-pressed={saved} aria-label={saved ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}>
          <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
        </button>
      </div>
      <div className="product-card-body">
        <span className="eyebrow">{product.category || 'Everyday essential'}</span>
        <h3 className="product-card-title">{product.name || 'Untitled product'}</h3>
        <p className="product-card-description">{product.description || 'A considered choice for your everyday routine.'}</p>
        <div className="product-card-meta">
          <strong className="product-price">{formatPrice(product.price)}</strong>
          <span className={`stock-label ${inStock ? 'in-stock' : 'out-of-stock'}`}>
            {inStock ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <div className="product-card-actions">
          <Link className="btn btn-secondary" to={`/products/${product.id}`}>
            View details
          </Link>
          <button className="btn btn-buy-now" type="button" onClick={() => onBuyNow(product)} disabled={!inStock}>
            Buy now
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => onAddToCart(product.id)}
            disabled={!inStock || adding}
          >
            {adding ? 'Adding...' : added ? 'Added' : 'Add to cart'}
          </button>
          {showRemoveWishlist && <button className="btn btn-remove-wishlist" type="button" onClick={() => onRemoveWishlist(product.id)}>Remove</button>}
        </div>
      </div>
    </article>
  );
}

export { ProductImage, formatPrice };