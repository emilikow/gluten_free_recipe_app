export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function api(path, opts = {}) {
  const username = localStorage.getItem('username') || '';
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (username) headers['X-User'] = username;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}
