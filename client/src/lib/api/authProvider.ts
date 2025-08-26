import type { AuthProvider } from 'react-admin';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const storageKey = 'authToken';
const userKey = 'authUser';

// We can't call hooks here directly when imported by non-react code,
// so expose helper functions that will use an injected toast function at runtime.
let _toastShow: ((m: string, t?: 'success' | 'error') => void) | null = null;
export function setToastShow(fn: (m: string, t?: 'success' | 'error') => void) { _toastShow = fn; }

const authProvider: AuthProvider = {
  login: async (params: { username: string; password: string }) => {
    const { username, password } = params;
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password }),
  credentials: 'include',
    });

    if (!res.ok) {
      let body: unknown = null;
      let text: string | null = null;
      try {
        body = await res.json();
      } catch {
        try { text = await res.text(); } catch { text = null; }
      }
      const retryAfter = res.headers.get?.('Retry-After');
      // body may be an object with message/error fields
      let parsedMsg: string | null = null;
      if (body && typeof body === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const b = body as Record<string, unknown>;
        const m = b.message ?? b.error ?? null;
        if (typeof m === 'string') parsedMsg = m;
      }
      const message = parsedMsg || text || `Login failed (${res.status}${retryAfter ? `, retry after ${retryAfter}s` : ''})`;
      // Debug output for failed login attempts (visible in browser console)
      try {
        // Avoid logging non-serializable Response objects directly; log a concise summary
        console.error('[authProvider] login failed:', message, 'status=', res?.status ?? 'unknown', 'retryAfter=', retryAfter ?? 'n/a', 'body=', body ?? text ?? null);
      } catch {}
      if (_toastShow) _toastShow(message, 'error');
      return Promise.reject(new Error(message));
    }

    const body = await res.json().catch(() => ({}));
    // Expect { access_token, user }
    const token = body?.access_token ?? body?.token ?? null;
    if (!token) return Promise.reject(new Error('No access token returned'));
  // Store token (access token) in localStorage; refresh token is set as httpOnly cookie by server
  if (typeof window !== 'undefined') localStorage.setItem(storageKey, token);

    // Fetch canonical user profile from server (/auth/me) to ensure fresh data
    try {
      const meRes = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (meRes.ok) {
        const me = await meRes.json().catch(() => null);
        if (me && typeof window !== 'undefined') localStorage.setItem(userKey, JSON.stringify(me));
      } else {
        // fallback to user returned in login response if present
        if (body.user && typeof window !== 'undefined') localStorage.setItem(userKey, JSON.stringify(body.user));
      }
    } catch {
      if (body.user && typeof window !== 'undefined') localStorage.setItem(userKey, JSON.stringify(body.user));
    }

  if (_toastShow) _toastShow('Logged in', 'success');
  return Promise.resolve();
  },

  logout: async () => {
    if (typeof window !== 'undefined') {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(userKey);
    }
  // hit server logout to clear refresh cookie
  try { await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }); } catch {}
  if (_toastShow) _toastShow('Logged out', 'success');
    return Promise.resolve();
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return Promise.resolve();
    const token = localStorage.getItem(storageKey);
    if (!token) return Promise.reject();

    // Verify token with backend and refresh stored user
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.status === 401) {
        // try refresh once
        const refreshed = await tryRefresh();
        if (!refreshed) {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(userKey);
          return Promise.reject();
        }
        return Promise.resolve();
      }
      if (!res.ok) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(userKey);
        return Promise.reject();
      }
      const me = await res.json().catch(() => null);
      if (me) localStorage.setItem(userKey, JSON.stringify(me));
      return Promise.resolve();
    } catch {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(userKey);
      return Promise.reject();
    }
  },

  checkError: (error) => {
    const status = error.status || (error?.response?.status);
    if (status === 401 || status === 403) {
      // try refresh on 401
      if (status === 401) return tryRefresh().then(ok => (ok ? Promise.resolve() : Promise.reject()));
      if (typeof window !== 'undefined') {
  localStorage.removeItem(storageKey);
  localStorage.removeItem(userKey);
      }
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getPermissions: async () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem(userKey) : null;
    if (!user) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(user).role || null);
    } catch {
      return Promise.resolve(null);
    }
  },

  getIdentity: async () => {
    const user = typeof window !== 'undefined' ? localStorage.getItem(userKey) : null;
    if (!user) return Promise.reject();
    try {
      const u = JSON.parse(user);
      return Promise.resolve({ id: u.id, fullName: u.username, avatar: undefined });
    } catch {
      return Promise.reject();
    }
  },
};

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    const token = body?.access_token ?? null;
    if (!token) return false;
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, token);
      if (body?.user) {
        localStorage.setItem(userKey, JSON.stringify(body.user));
      } else {
        // If refresh endpoint didn't return the canonical user, try to fetch /auth/me
        try {
          const meRes = await fetch(`${API_URL}/auth/me`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
          if (meRes.ok) {
            const me = await meRes.json().catch(() => null);
            if (me) localStorage.setItem(userKey, JSON.stringify(me));
          }
        } catch {
          // ignore
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

export default authProvider;
