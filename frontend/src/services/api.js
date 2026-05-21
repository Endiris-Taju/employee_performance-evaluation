const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function getApiUrl() {
  return API_URL;
}

export function authHeaders(token, json = true) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

export async function apiFetch(path, { token, method = "GET", body } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: authHeaders(token, body != null),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`);
  }
  return data;
}
