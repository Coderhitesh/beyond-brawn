import { api } from '@/lib/api';

export const dashboard = () => api('/users/dashboard');
export const updateProfile = (body) => api('/users/me', { method: 'PATCH', body });
export const listAddresses = () => api('/users/addresses');
export const createAddress = (body) => api('/users/addresses', { method: 'POST', body });
export const updateAddress = (id, body) => api(`/users/addresses/${id}`, { method: 'PUT', body });
export const deleteAddress = (id) => api(`/users/addresses/${id}`, { method: 'DELETE' });
