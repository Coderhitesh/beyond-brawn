import { api } from '@/lib/api';

export const checkout = (body) => api('/orders/checkout', { method: 'POST', body });
export const verifyPayment = (body) => api('/payments/verify', { method: 'POST', body });
export const reportPaymentFailure = (body) => api('/payments/failed', { method: 'POST', body });
export const listOrders = (page = 1) => api(`/orders?page=${page}`);
export const getOrder = (orderNumber) => api(`/orders/${encodeURIComponent(orderNumber)}`);
export const cancelOrder = (orderNumber, reason) => api(`/orders/${encodeURIComponent(orderNumber)}/cancel`, { method: 'POST', body: { reason } });
export const trackOrder = (body) => api('/orders/track', { method: 'POST', body });
export const checkPincode = (pincode) => api(`/shipping/check?pincode=${encodeURIComponent(pincode)}`);
