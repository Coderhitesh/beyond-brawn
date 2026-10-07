'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as cartApi from '@/services/cart';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

/*
 * One cart interface, two back ends:
 *  - logged in: the cart lives in MongoDB (/api/cart)
 *  - guest: item ids + quantities live in localStorage and are priced by the server (/api/cart/price)
 * Prices always come from the API. The browser never calculates money.
 */
const CartContext = createContext(null);
const KEY = 'bb_cart';
const EMPTY = { lines: [], itemCount: 0, pricing: null, coupon: null, couponError: null, shippingMethods: [], hasIssues: false };

const readLocal = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { items: Array.isArray(v.items) ? v.items : [], couponCode: v.couponCode || null };
  } catch (e) {
    return { items: [], couponCode: null };
  }
};
const writeLocal = (v) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch (e) {
    /* storage unavailable */
  }
};

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const userId = user ? user.id : null;
  const prevUser = useRef(undefined);

  const priceLocal = useCallback(async (local = readLocal()) => {
    if (!local.items.length) {
      setCart(EMPTY);
      return EMPTY;
    }
    const res = await cartApi.priceItems({ items: local.items, couponCode: local.couponCode });
    const next = res.data.cart;
    // Drop a coupon the server rejected so it is not re-sent forever.
    if (local.couponCode && next.couponError) writeLocal({ ...local, couponCode: null });
    setCart(next);
    return next;
  }, []);

  const load = useCallback(async () => {
    try {
      if (userId) {
        const local = readLocal();
        if (local.items.length) {
          // First load after login: fold the guest cart into the account cart.
          const res = await cartApi.mergeCart(local.items);
          writeLocal({ items: [], couponCode: null });
          setCart(res.data.cart);
        } else {
          setCart((await cartApi.getCart()).data.cart);
        }
      } else {
        await priceLocal();
      }
    } catch (e) {
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [userId, priceLocal]);

  useEffect(() => {
    if (authLoading) return;
    if (prevUser.current === userId) return;
    prevUser.current = userId;
    load();
  }, [authLoading, userId, load]);

  const run = useCallback(
    async (fn, successMessage) => {
      setBusy(true);
      try {
        const result = await fn();
        if (successMessage) toast.success(successMessage);
        return result;
      } catch (e) {
        toast.error(e.message);
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );

  const add = useCallback(
    (productId, variantId = null, quantity = 1, { open = true } = {}) =>
      run(async () => {
        if (userId) {
          setCart((await cartApi.addItem({ productId, variantId, quantity })).data.cart);
        } else {
          const local = readLocal();
          const line = local.items.find((i) => i.productId === productId && (i.variantId || null) === (variantId || null));
          const next = line ? local.items.map((i) => (i === line ? { ...i, quantity: Math.min(20, i.quantity + quantity) } : i)) : [...local.items, { productId, variantId, quantity }];
          const priced = (await cartApi.priceItems({ items: next, couponCode: local.couponCode })).data.cart;
          const added = priced.lines.find((l) => l.productId === productId && (l.variantId || null) === (variantId || null));
          if (!added || added.issue) throw new Error((added && added.issueText) || 'This item is not available');
          writeLocal({ ...local, items: next });
          setCart(priced);
        }
        if (open) setDrawerOpen(true);
        return true;
      }),
    [userId, run]
  );

  const setQuantity = useCallback(
    (line, quantity) =>
      run(async () => {
        if (quantity < 1) return null;
        if (userId) setCart((await cartApi.updateItem(line.itemId, quantity)).data.cart);
        else {
          const local = readLocal();
          const items = local.items.map((i) => (`${i.productId}:${i.variantId || ''}` === line.key ? { ...i, quantity: Math.min(quantity, 20) } : i));
          writeLocal({ ...local, items });
          await priceLocal({ ...local, items });
        }
        return true;
      }),
    [userId, run, priceLocal]
  );

  const remove = useCallback(
    (line) =>
      run(async () => {
        if (userId) setCart((await cartApi.removeItem(line.itemId)).data.cart);
        else {
          const local = readLocal();
          const items = local.items.filter((i) => `${i.productId}:${i.variantId || ''}` !== line.key);
          writeLocal({ ...local, items });
          await priceLocal({ ...local, items });
        }
        return true;
      }, 'Removed from cart'),
    [userId, run, priceLocal]
  );

  const saveForLater = useCallback((line) => run(async () => setCart((await cartApi.moveToWishlist(line.itemId)).data.cart) || true, 'Moved to wishlist'), [run]);

  const applyCoupon = useCallback(
    async (code) => {
      setBusy(true);
      try {
        if (userId) setCart((await cartApi.applyCoupon(code)).data.cart);
        else {
          const local = readLocal();
          const priced = (await cartApi.priceItems({ items: local.items, couponCode: code })).data.cart;
          if (priced.couponError) throw new Error(priced.couponError);
          writeLocal({ ...local, couponCode: code.toUpperCase() });
          setCart(priced);
        }
        toast.success('Coupon applied');
        return null;
      } catch (e) {
        return e.message;
      } finally {
        setBusy(false);
      }
    },
    [userId, toast]
  );

  const removeCoupon = useCallback(
    () =>
      run(async () => {
        if (userId) setCart((await cartApi.removeCoupon()).data.cart);
        else {
          const local = { ...readLocal(), couponCode: null };
          writeLocal(local);
          await priceLocal(local);
        }
        return true;
      }, 'Coupon removed'),
    [userId, run, priceLocal]
  );

  // Called after a successful payment.
  const reset = useCallback(() => {
    writeLocal({ items: [], couponCode: null });
    if (userId) load();
    else setCart(EMPTY);
  }, [userId, load]);

  const guestItems = useCallback(() => readLocal(), []);

  const value = useMemo(
    () => ({ cart, loading, busy, drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false), add, setQuantity, remove, saveForLater, applyCoupon, removeCoupon, reload: load, reset, guestItems, isGuest: !userId }),
    [cart, loading, busy, drawerOpen, add, setQuantity, remove, saveForLater, applyCoupon, removeCoupon, load, reset, guestItems, userId]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
