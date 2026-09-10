import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const STORAGE_PREFIX = 'cartcraft_wishlist_';

function normalizeProductId(productId) {
  if (productId === null || productId === undefined || productId === '') return null;
  return String(productId);
}

function readWishlist(storageKey) {
  if (!storageKey) return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.map(normalizeProductId).filter(Boolean))];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const storageKey = user?.id === undefined || user?.id === null ? null : `${STORAGE_PREFIX}${user.id}`;
  const [wishlistIds, setWishlistIds] = useState([]);

  useEffect(() => {
    setWishlistIds(readWishlist(storageKey));
  }, [storageKey]);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === storageKey) setWishlistIds(readWishlist(storageKey));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  const persist = (nextIds) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextIds));
    } catch {
    }
  };

  const toggleWishlist = (productId) => {
    const normalizedId = normalizeProductId(productId);
    if (!normalizedId || !storageKey) return;

    setWishlistIds((currentIds) => {
      const nextIds = currentIds.includes(normalizedId)
        ? currentIds.filter((id) => id !== normalizedId)
        : [...currentIds, normalizedId];
      persist(nextIds);
      return nextIds;
    });
  };

  const removeFromWishlist = (productId) => {
    const normalizedId = normalizeProductId(productId);
    if (!normalizedId || !storageKey) return;

    setWishlistIds((currentIds) => {
      const nextIds = currentIds.filter((id) => id !== normalizedId);
      persist(nextIds);
      return nextIds;
    });
  };

  const value = useMemo(() => ({
    wishlistIds,
    wishlistCount: wishlistIds.length,
    isWishlisted: (productId) => wishlistIds.includes(normalizeProductId(productId)),
    toggleWishlist,
    removeFromWishlist,
  }), [wishlistIds, storageKey]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  return useContext(WishlistContext);
}