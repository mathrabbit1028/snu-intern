// Simple API client with credentials support
export const BASE_URL = 'https://api-internhasha.wafflestudio.com';

const TOKEN_KEY = 'auth_token_v1';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, signal } = options;
  const url = `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  };

  const token = getToken();
  if (token) {
    (init.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

  if (!res.ok) {
    const message = (isJson && (data as any)?.message) || `Request failed with status ${res.status}`;
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}

// Auth specific APIs
export type MeResponse = {
  id?: number | string;
  email?: string;
  name?: string; // assuming API uses 'name' for real name
  realName?: string; // fallback key if API uses different naming
  [k: string]: unknown;
};

export type SignUpResponse = {
  token?: string;
  user?: unknown;
  [k: string]: unknown;
};

export async function apiSignup(input: { name: string; email: string; password: string; successCode?: string }) {
  // Try to be compatible: prefer structured body; if it fails, fallback to simple body
  const structured: any = {
    authType: 'APPLICANT',
    info: {
      type: 'APPLICANT',
      name: input.name,
      email: input.email,
      password: input.password,
      ...(input.successCode ? { successCode: input.successCode } : {}),
    },
  };

  try {
    const res = await request<SignUpResponse>('/api/auth/user', { method: 'POST', body: structured });
    if (res?.token) setToken(res.token);
    return res;
  } catch (e) {
    // Fallback to simple body { name, email, password }
    const simple = { name: input.name, email: input.email, password: input.password };
    const res = await request<SignUpResponse>('/api/auth/user', { method: 'POST', body: simple });
    if (res?.token) setToken(res.token);
    return res;
  }
}

export type LoginResponse = {
  token?: string;
  user?: unknown;
  [k: string]: unknown;
};

export async function apiLogin(input: { email: string; password: string }) {
  const res = await request<LoginResponse>('/api/auth/user/session', { method: 'POST', body: input });
  if (res?.token) setToken(res.token);
  return res;
}

export async function apiLogout() {
  // Not specified, but commonly DELETE is used.
  try {
    await request<unknown>('/api/auth/user/session', { method: 'DELETE' });
  } catch (e) {
    // Best-effort; ignore errors so UI can still clear local state
  }
  setToken(null);
}

export async function apiMe() {
  return request<MeResponse>('/api/auth/me', { method: 'GET' });
}

// Email verification APIs (to obtain successCode for signup)
export async function apiSendVerifyCode(snuMail: string) {
  // Some services also require check duplicate via '/api/auth/mail' with { email }
  try {
    await request('/api/auth/mail', { method: 'POST', body: { email: snuMail } });
  } catch {
    // ignore
  }
  return request('/api/auth/mail/verify', { method: 'POST', body: { snuMail } });
}

export type VerifyCodeResponse = { successCode?: string; [k: string]: unknown };
export async function apiValidateVerifyCode(snuMail: string, code: string) {
  return request<VerifyCodeResponse>('/api/auth/mail/validate', { method: 'POST', body: { snuMail, code } });
}
