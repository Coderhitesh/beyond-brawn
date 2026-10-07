import { api } from '@/lib/api';

export const me = () => api('/auth/me');
export const register = (body) => api('/auth/register', { method: 'POST', body });
export const verifyEmail = (body) => api('/auth/verify-email', { method: 'POST', body });
export const resendOtp = (body) => api('/auth/resend-otp', { method: 'POST', body });
export const login = (body) => api('/auth/login', { method: 'POST', body });
export const logout = () => api('/auth/logout', { method: 'POST' });
export const forgotPassword = (body) => api('/auth/forgot-password', { method: 'POST', body });
export const resetPassword = (body) => api('/auth/reset-password', { method: 'POST', body });
export const changePassword = (body) => api('/auth/change-password', { method: 'POST', body });
