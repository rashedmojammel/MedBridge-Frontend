import axios from 'axios';
import { getToken, clearSession } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/** Attach the JWT to every outgoing request. */
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Global error handling. A 401 means the token is dead - clear the session
 * and bounce to login. Everything else is re-thrown so the calling hook can
 * surface a specific message.
 */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== 'undefined') {
      const onLogin = window.location.pathname.startsWith('/login');
      if (!onLogin) {
        clearSession();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Backend wraps everything in { success, data, message } - this unwraps it. */
export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

/**
 * A few endpoints (the password flows) answer with { success, message } and no
 * data payload at all - the backend interceptor passes those through untouched,
 * so `unwrap` would hand back undefined. Read the message instead.
 */
export function unwrapMessage(
  res: { data: { message?: string } },
  fallback = 'Done',
): string {
  return res.data?.message ?? fallback;
}

/** Pulls a readable message out of an axios error for toasts. */
export function apiError(error: any, fallback = 'Something went wrong'): string {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  if (typeof msg === 'string') return msg;
  return fallback;
}

export default api;
