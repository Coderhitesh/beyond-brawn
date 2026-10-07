'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as cartApi from '@/services/cart';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user, loading: authLoading, refresh } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [ids, setIds] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = user ? user.id : null;

  const apply = (data) => {
    setIds(data.ids);
    setProducts(data.products);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      apply({ ids: [], products: [] });
      setLoading(false);
      return;
    }
    cartApi
      .getWishlist()
      .then((res) => apply(res.data))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [authLoading, userId]);

  const toggle = useCallback(
    async (productId) => {
      // A click that lands before the session check finishes must not be treated as a guest.
      let uid = userId;
      if (!uid && authLoading) {
        const u = await refresh();
        uid = u ? u.id : null;
      }
      if (!uid) {
        toast.error('Log in to save items to your wishlist');
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      // Optimistic: flip the heart immediately, reconcile with the server response.
      setIds((cur) => (cur.includes(productId) ? cur.filter((i) => i !== productId) : [...cur, productId]));
      try {
        const res = await cartApi.toggleWishlist(productId);
        apply(res.data);
        toast.success(res.message);
      } catch (e) {
        toast.error(e.message);
        cartApi.getWishlist().then((res) => apply(res.data)).catch(() => null);
      }
    },
    [userId, authLoading, refresh, toast, router, pathname]
  );

  const value = useMemo(() => ({ ids, products, loading, count: ids.length, has: (id) => ids.includes(id), toggle }), [ids, products, loading, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export const useWishlist = () => useContext(WishlistContext);
