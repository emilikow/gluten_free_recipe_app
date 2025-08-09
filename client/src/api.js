export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

export async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (!(opts.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}
