import { api } from '@/lib/api';

export const getCart = () => api('/cart');
export const addItem = (body) => api('/cart/items', { method: 'POST', body });
export const updateItem = (itemId, quantity) => api(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } });
export const removeItem = (itemId) => api(`/cart/items/${itemId}`, { method: 'DELETE' });
export const moveToWishlist = (itemId) => api(`/cart/items/${itemId}/wishlist`, { method: 'POST' });
export const mergeCart = (items) => api('/cart/merge', { method: 'POST', body: { items } });
export const priceItems = (body) => api('/cart/price', { method: 'POST', body });
export const applyCoupon = (code) => api('/coupons/apply', { method: 'POST', body: { code } });
export const removeCoupon = () => api('/coupons', { method: 'DELETE' });
export const getWishlist = () => api('/wishlist');
export const toggleWishlist = (productId) => api('/wishlist/toggle', { method: 'POST', body: { productId } });
