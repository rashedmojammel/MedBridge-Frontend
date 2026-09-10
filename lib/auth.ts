import Cookies from 'js-cookie';
import type { User, UserRole } from '@/types';

const TOKEN_KEY = 'medbridge_token';
const USER_KEY = 'medbridge_user';

const COOKIE_OPTS = { expires: 1, sameSite: 'strict' as const, path: '/' };

export function saveToken(token: string) {
  Cookies.set(TOKEN_KEY, token, COOKIE_OPTS);
}

export function getToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null;
}

export function saveUser(user: User) {
  Cookies.set(USER_KEY, JSON.stringify(user), COOKIE_OPTS);
}

export function getUser(): User | null {
  const raw = Cookies.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function clearSession() {
  Cookies.remove(TOKEN_KEY, { path: '/' });
  Cookies.remove(USER_KEY, { path: '/' });
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}

/** Where each role lands after login. Used by the login page and middleware. */
export const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  ADMIN: '/admin/dashboard',
  DOCTOR: '/doctor/dashboard',
  CHW: '/chw/dashboard',
  PATIENT: '/patient/dashboard',
  PHARMACIST: '/pharmacist/dashboard',
  STAFF: '/admin/dashboard',
};

export function dashboardFor(role?: UserRole): string {
  if (!role) return '/login';
  return DASHBOARD_BY_ROLE[role] ?? '/login';
}

export function logout() {
  clearSession();
  if (typeof window !== 'undefined') window.location.href = '/login';
}
