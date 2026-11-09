// Talks to the API (the `server` project). Set VITE_API_URL in .env.
const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const TOKEN_KEY = "alk-admin-token";

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode: the session simply won't survive a reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error ?? `Request failed (${status})`);
    this.status = status;
    this.fields = body?.fields ?? {};
    this.body = body ?? {};
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function api(path, { method = "GET", body, signal, raw = false } = {}) {
  if (!BASE) throw new ApiError(0, { error: "VITE_API_URL is not set for the admin panel." });

  const headers = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError(0, { error: "Can't reach the server. Check your internet connection and try again." });
  }

  if (raw && res.ok) return res;
  const data = await res.json().catch(() => null);
  if (res.status === 401 && token) onUnauthorized(data?.error);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// Downloads a file the API produces (e.g. the CSV export) with the admin's token.
export async function download(path, fallbackName) {
  const res = await api(path, { raw: true });
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
