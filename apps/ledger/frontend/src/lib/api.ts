const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function devLogin(userId: string) {
  const res = await fetch(`${API_BASE}/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    throw new Error('Login failed. Ensure ALLOW_DEV_LOGIN=true in backend .env');
  }

  return res.json();
}
