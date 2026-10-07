import { api } from '@/lib/api';

export const adminApi = (path, opts) => api(`/admin${path}`, opts);

// Builds "?a=1&b=2", skipping empty values.
export const qs = (obj = {}) => {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

export const exportUrl = (path, query = {}) => `/api/admin${path}${qs({ ...query, page: undefined, limit: undefined, format: 'csv' })}`;

export function uploadImages(files, folder = 'misc') {
  const formData = new FormData();
  [...files].forEach((f) => formData.append('files', f));
  return adminApi(`/uploads?folder=${folder}`, { method: 'POST', formData });
}
