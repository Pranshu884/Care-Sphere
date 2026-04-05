const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function normalizeApiBase(url: string) {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getHeaders() {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('caresphere_token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiGet(path: string) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiPost(path: string, body: any) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiPatch(path: string, body: any) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiPut(path: string, body: any) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export async function apiDelete(path: string) {
  const base = normalizeApiBase(API_BASE_URL);
  const res = await fetch(`${base}${path}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
