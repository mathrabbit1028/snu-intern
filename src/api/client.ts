// Simple API client with credentials support (proxied by Vite dev server)
const BASE_URL = '';

const TOKEN_KEY = 'auth_token_v1';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
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

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
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
    (init.headers as Record<string, string>)['Authorization'] =
      `Bearer ${token}`;
  }

  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const data = isJson
    ? await res.json().catch(() => undefined)
    : await res.text().catch(() => undefined);

  if (!res.ok) {
    interface ResponseData {
      message?: string;
    }
    const message =
      (isJson && (data as ResponseData)?.message) ||
      `Request failed with status ${res.status}`;
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

type SignUpResponse = {
  token?: string;
  user?: unknown;
  [k: string]: unknown;
};

export async function apiSignup(input: {
  name: string;
  email: string;
  password: string;
  successCode?: string;
}) {
  // Try to be compatible: prefer structured body; if it fails, fallback to simple body
  const structured: {
    authType: 'APPLICANT';
    info: {
      type: 'APPLICANT';
      name: string;
      email: string;
      password: string;
      successCode?: string;
    };
  } = {
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
    const res = await request<SignUpResponse>('/api/auth/user', {
      method: 'POST',
      body: structured,
    });
    if (res?.token) setToken(res.token);
    return res;
  } catch (_e) {
    // Fallback to simple body { name, email, password }
    const simple = {
      name: input.name,
      email: input.email,
      password: input.password,
    };
    const res = await request<SignUpResponse>('/api/auth/user', {
      method: 'POST',
      body: simple,
    });
    if (res?.token) setToken(res.token);
    return res;
  }
}

type LoginResponse = {
  token?: string;
  user?: unknown;
  [k: string]: unknown;
};

export async function apiLogin(input: { email: string; password: string }) {
  const res = await request<LoginResponse>('/api/auth/user/session', {
    method: 'POST',
    body: input,
  });
  if (res?.token) setToken(res.token);
  return res;
}

export async function apiLogout() {
  // Not specified, but commonly DELETE is used.
  try {
    await request<unknown>('/api/auth/user/session', { method: 'DELETE' });
  } catch (_e) {
    // Best-effort; ignore errors so UI can still clear local state
  }
  setToken(null);
}

export function apiMe() {
  return request<MeResponse>('/api/auth/me', { method: 'GET' });
}

// Applicant profile (detailed resume/profile). Returns null if not created yet (APPLICANT_002)
export type ApplicantProfile = {
  id?: string | number;
  name?: string;
  email?: string;
  [k: string]: unknown; // include any other dynamic fields
};

export async function apiApplicantMe(): Promise<ApplicantProfile | null> {
  try {
    const res = await request<ApplicantProfile>('/api/applicant/me', {
      method: 'GET',
    });
    return res || null;
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'data' in e) {
      const data = (e as { data?: unknown }).data;
      // Try to extract code if possible, without using any
      let code: string | undefined;
      if (typeof data === 'object' && data !== null) {
        // Use optional chaining and type guards
        if (
          'code' in data &&
          typeof (data as { code?: unknown }).code === 'string'
        ) {
          code = (data as { code?: string }).code;
        } else if (
          'errorCode' in data &&
          typeof (data as { errorCode?: unknown }).errorCode === 'string'
        ) {
          code = (data as { errorCode?: string }).errorCode;
        } else if (
          'error' in data &&
          typeof (data as { error?: unknown }).error === 'object' &&
          (data as { error?: unknown }).error !== null
        ) {
          const errorObj = (data as { error?: { code?: unknown } }).error;
          if (
            errorObj &&
            'code' in errorObj &&
            typeof (errorObj as { code?: unknown }).code === 'string'
          ) {
            code = (errorObj as { code?: string }).code;
          }
        }
      }
      if (code === 'APPLICANT_002') return null; // profile not created
    }
    throw e; // propagate other errors
  }
}

// Create or update applicant profile
export async function apiUpsertApplicantMe(input: {
  enrollYear: number; // like 2025, 1999
  department: string; // single department (main major)
  positions?: string[]; // optional positions
  slogan?: string;
  explanation?: string;
  stacks?: string[];
  imageKey?: string;
  cvKey?: string; // CV file key
  portfolioKey?: string;
  links?: Array<{ description: string; link: string }>;
}) {
  // Use PUT only; surface detailed error
  return await request<unknown>('/api/applicant/me', {
    method: 'PUT',
    body: input,
  });
}

// Email verification APIs (to obtain successCode for signup)
// (Email verification APIs removed as signup no longer requires verification in this app)
