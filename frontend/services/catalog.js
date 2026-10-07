import { api } from '@/lib/api';

export const suggest = (q, signal) => api(`/search/suggest?q=${encodeURIComponent(q)}`, { signal });
export const popularSearches = () => api('/search/popular');
export const productsByIds = (ids) => api(`/products/by-ids?ids=${ids.join(',')}`);
export const productReviews = (slug, page = 1, sort = 'newest') => api(`/products/${slug}/reviews?page=${page}&sort=${sort}`);
export const reviewEligibility = (productId) => api(`/reviews/eligibility/${productId}`);
export const createReview = (body) => api('/reviews', { method: 'POST', body });
export const uploadReviewImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api('/reviews/upload', { method: 'POST', formData });
};
export const subscribe = (email) => api('/newsletter/subscribe', { method: 'POST', body: { email } });
export const contact = (body) => api('/contact', { method: 'POST', body });
