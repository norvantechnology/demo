import axios from 'axios';

/** Empty / unset → same-origin `/api` (Vite proxy locally, Vercel rewrites in prod). */
export const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

let accessToken = null;
let onUnauthorized = null;

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && !original.url?.includes('/auth/login')) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${API_BASE}/auth/refresh`, null, { withCredentials: true })
            .then((res) => {
              setAccessToken(res.data.accessToken);
              return res.data.accessToken;
            })
            .finally(() => {
              refreshing = null;
            });
        }
        const token = await refreshing;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  }
);

export function getErrorMessage(err) {
  return err?.response?.data?.error?.message || err.message || 'Something went wrong';
}
