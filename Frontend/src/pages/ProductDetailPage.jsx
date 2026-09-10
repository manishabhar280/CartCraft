import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { formatPrice, ProductImage } from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewSummary, setReviewSummary] = useState({ averageRating: 0, count: 0, distribution: [] });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDeleting, setReviewDeleting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewFormError, setReviewFormError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/api/products/${id}`)
      .then((response) => { if (active) setProduct(response.data?.product || null); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'Unable to load this product.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const loadReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError('');
      const response = await api.get(`/api/products/${id}/reviews`);
      setReviews(response.data?.reviews || []);
      setReviewSummary({ averageRating: response.data?.averageRating || 0, count: response.data?.count || 0, distribution: response.data?.distribution || [] });
    } catch (err) {
      setReviewsError(err.response?.data?.message || 'Unable to load reviews. Please try again.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [id]);

  const ownReview = reviews.find((review) => review.userId === user?.id);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    setReviewFormError('');
    setReviewMessage('');
    if (!rating) return setReviewFormError('Please select a rating from 1 to 5 stars.');
    if (!comment.trim()) return setReviewFormError('Please add a comment before submitting.');
    try {
      setReviewSubmitting(true);
      await api.post(`/api/products/${id}/reviews`, { rating, comment: comment.trim() });
      setRating(0);
      setComment('');
      setReviewMessage('Thanks for sharing your review.');
      await loadReviews();
    } catch (err) {
      setReviewFormError(err.response?.data?.message || 'Unable to submit your review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!ownReview) return;
    try {
      setReviewDeleting(true);
      setReviewFormError('');
      await api.delete(`/api/products/${id}/reviews/${ownReview.id}`);
      setReviewMessage('Your review was deleted.');
      await loadReviews();
    } catch (err) {
      setReviewFormError(err.response?.data?.message || 'Unable to delete your review. Please try again.');
    } finally {
      setReviewDeleting(false);
    }
  };

  const stock = Number(product?.stock || 0);
  const saved = isWishlisted(product?.id);

  const handleWishlist = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    toggleWishlist(product.id);
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/products/${id}` } } });
      return;
    }
    try {
      setAdding(true);
      setAddError('');
      await api.post('/api/cart', { productId: Number(id), quantity });
      navigate('/cart');
    } catch (err) {
      setAddError(err.response?.data?.message || 'Unable to add this product to cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/checkout', state: { mode: 'buy-now', product, quantity } } } });
      return;
    }
    navigate('/checkout', { state: { mode: 'buy-now', product, quantity } });
  };

  if (loading) return <div className="state-panel loading-state">Loading product details...</div>;
  if (error) return <div className="state-panel error-state" role="alert"><strong>We could not load this product.</strong><span>{error}</span><button className="btn btn-secondary" onClick={() => navigate('/products')}>Back to products</button></div>;
  if (!product) return <div className="state-panel"><strong>Product not found.</strong><span>This product may have moved out of the collection.</span><button className="btn btn-secondary" onClick={() => navigate('/products')}>Back to products</button></div>;

  return (
    <div className="detail-page page-shell">
      <button className="back-link" onClick={() => navigate('/products')}>← Back to products</button>
      <section className="detail-card">
        <div className="detail-layout">
          <div className="detail-image-wrap"><ProductImage product={product} className="detail-image" /><span className="detail-image-caption">CartCraft collection / {product.category || 'Essential'}</span></div>
          <div className="detail-content">
            <span className="eyebrow">{product.category || 'Everyday essential'}</span>
            <h1>{product.name || 'Untitled product'}</h1>
            <div className="detail-price-row"><strong className="detail-price">{formatPrice(product.price)}</strong><span className={`stock-label ${stock > 0 ? 'in-stock' : 'out-of-stock'}`}>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span></div>
            <p className="detail-description">{product.description || 'A considered choice for your everyday routine.'}</p>
            {addError && <div className="alert error" role="alert">{addError}</div>}
            <button className={`wishlist-detail-button ${saved ? 'is-saved' : ''}`} type="button" onClick={handleWishlist} aria-pressed={saved}><span aria-hidden="true">{saved ? '♥' : '♡'}</span>{saved ? 'Remove from Wishlist' : 'Add to Wishlist'}</button>
            <div className="purchase-panel"><div className="quantity-control" aria-label="Quantity"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity <= 1}>−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(stock || 1, value + 1))} disabled={!stock || quantity >= stock}>+</button></div><div className="purchase-buttons"><button className="btn btn-primary btn-large" onClick={handleAddToCart} disabled={adding || stock <= 0}>{adding ? 'Adding...' : stock > 0 ? 'Add to cart' : 'Out of stock'}</button><button className="btn btn-buy-now btn-large" onClick={handleBuyNow} disabled={adding || stock <= 0}>Buy now</button></div></div>
            <p className="detail-note">Secure checkout · Carefully packed · Made for daily use</p>
          </div>
        </div>
      </section>
      <section className="reviews-section" aria-labelledby="reviews-heading">
        <div className="section-heading-row reviews-heading">
          <div><span className="eyebrow">Customer notes</span><h2 id="reviews-heading">Reviews &amp; Ratings</h2></div>
          <span className="result-count">{reviewSummary.count} {reviewSummary.count === 1 ? 'review' : 'reviews'}</span>
        </div>
        <div className="review-summary">
          <div className="review-score"><strong>{reviewSummary.averageRating ? reviewSummary.averageRating.toFixed(1) : '—'}</strong><div className="star-display" aria-label={`${reviewSummary.averageRating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= Math.round(reviewSummary.averageRating) ? 'star-filled' : ''}>★</span>)}</div><span>Based on {reviewSummary.count} {reviewSummary.count === 1 ? 'review' : 'reviews'}</span></div>
          <div className="rating-distribution">{[5, 4, 3, 2, 1].map((value) => { const item = reviewSummary.distribution.find((entry) => entry.rating === value); const count = item?.count || 0; const width = reviewSummary.count ? `${(count / reviewSummary.count) * 100}%` : '0%'; return <div className="distribution-row" key={value}><span>{value} ★</span><span className="distribution-bar"><span style={{ width }} /></span><span>{count}</span></div>; })}</div>
        </div>
        {reviewsLoading && <div className="review-state">Loading reviews...</div>}
        {!reviewsLoading && reviewsError && <div className="review-state review-error" role="alert">{reviewsError}<button className="btn btn-secondary" type="button" onClick={loadReviews}>Try again</button></div>}
        {!reviewsLoading && !reviewsError && reviews.length === 0 && <div className="review-state">No reviews yet. Be the first to review this product.</div>}
        {!reviewsLoading && !reviewsError && reviews.length > 0 && <div className="review-list">{reviews.map((review) => <article className="review-card" key={review.id}><div className="review-card-header"><div><strong>{review.user?.name || 'CartCraft customer'}</strong><span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span></div><div className="review-stars" aria-label={`${review.rating} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <span key={star} className={star <= review.rating ? 'star-filled' : ''}>★</span>)}</div></div><p>{review.comment}</p>{review.verifiedPurchase && <span className="verified-badge">Verified Purchase</span>}</article>)}</div>}
        <div className="review-form-wrap">
          {user ? (ownReview ? <div className="own-review-note"><strong>You have reviewed this product.</strong><span>Your review is shown above. Delete it to submit a new review.</span><button className="btn btn-secondary" type="button" onClick={handleDeleteReview} disabled={reviewDeleting}>{reviewDeleting ? 'Deleting...' : 'Delete Review'}</button></div> : <form className="review-form" onSubmit={handleSubmitReview}><h3>Write a Review</h3><div className="field"><label>Your rating</label><div className="star-selector" role="radiogroup" aria-label="Choose a rating">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= rating ? 'selected' : ''} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? 's' : ''}`} aria-pressed={value === rating}>★</button>)}</div></div><div className="field"><label htmlFor="review-comment">Your comment</label><textarea id="review-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} rows={4} placeholder="What did you think?" /></div>{reviewFormError && <div className="alert error" role="alert">{reviewFormError}</div>}{reviewMessage && <div className="review-success" role="status">{reviewMessage}</div>}<button className="btn btn-primary" type="submit" disabled={reviewSubmitting}>{reviewSubmitting ? 'Submitting...' : 'Submit Review'}</button></form>) : <div className="login-review-prompt"><strong>Login to write a review</strong><span>Share your experience with other CartCraft shoppers.</span><button className="btn btn-secondary" type="button" onClick={() => navigate('/login', { state: { from: { pathname: `/products/${id}` } } })}>Login</button></div>}
        </div>
      </section>
    </div>
  );
}
