// API for posts (jobs) with filtering & bookmark (proxied by Vite dev server)

export type Post = {
  id: string;
  companyName: string;
  positionTitle: string;
  domain: string;
  slogan?: string;
  headCount?: number;
  employmentEndDate?: string;
  isBookmarked?: boolean;
};

type GetPostsResponse = {
  posts: Post[];
  paginator?: { lastPage: number };
};

function authHeaders(): HeadersInit {
  try {
    const token = localStorage.getItem('auth_token_v1');
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // ignore
  }
  return {};
}

// Provided utility pattern for encoding query parameters (arrays become repeated keys)
function encodeQueryParams({
  params,
}: {
  params: Record<
    string,
    | string
    | number
    | boolean
    | string[]
    | number[]
    | boolean[]
    | null
    | undefined
  >;
}) {
  const queryParameters = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => queryParameters.append(key, v.toString()));
    } else {
      queryParameters.append(key, value.toString());
    }
  });
  return queryParameters.toString();
}

export async function getPosts(
  params: Record<string, string | string[] | number | boolean | undefined>
) {
  const page = params.page ?? 0; // 0-based page
  const order = params.order ?? '0';
  const isActiveTrue = params.isActive === true || params.isActive === 'true';

  // Normalize roles/domains to string arrays (accept comma-separated fallback)
  const normalizeList = (raw: unknown): string[] | undefined => {
    if (!raw) return undefined;
    const arr = Array.isArray(raw) ? raw : String(raw).split(',');
    return arr.map((s) => s.trim()).filter(Boolean);
  };
  const rolesList = normalizeList(params.roles);
  const domainsList = normalizeList(params.domains);

  // Build param object using utility (omit isActive when false = 전체)
  // Note: size removed as API returns fixed 12 per page
  const queryString = encodeQueryParams({
    params: {
      page,
      order,
      ...(rolesList && rolesList.length ? { roles: rolesList } : {}),
      ...(domainsList && domainsList.length ? { domains: domainsList } : {}),
      ...(isActiveTrue ? { isActive: true } : {}),
    },
  });

  const url = `/api/post?${queryString}`;
  const res = await fetch(url, {
    headers: { ...authHeaders() },
    credentials: 'include',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? ((await res.json()) as unknown) : undefined;
  if (!res.ok) {
    interface ResponseData {
      message?: string;
    }
    const message =
      (isJson && ((data as ResponseData)?.message as string | undefined)) ||
      `GET /api/post failed: ${res.status}`;
    throw new Error(message);
  }

  try {
    return parseGetPostsResponse(data);
  } catch (_e) {
    if (Array.isArray(data))
      return { posts: data as Post[], paginator: { lastPage: 1 } };
    return { posts: [], paginator: { lastPage: 1 } };
  }
}

// Fetch bookmarked posts for current user
export async function getBookmarks() {
  const url = `/api/post/bookmarks`;
  const res = await fetch(url, {
    headers: { ...authHeaders() },
    credentials: 'include',
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? ((await res.json()) as unknown) : undefined;
  if (!res.ok) {
    interface ResponseData {
      message?: string;
    }
    const message =
      (isJson && ((data as ResponseData)?.message as string | undefined)) ||
      `GET /api/post/bookmarks failed: ${res.status}`;
    throw new Error(message);
  }

  // Many APIs just return array directly; reuse existing parser logic for safety.
  try {
    const parsed = parseGetPostsResponse(data);
    return parsed.posts;
  } catch (_e) {
    if (Array.isArray(data))
      return (data as unknown[])
        .map(normalizePost)
        .filter((p): p is Post => !!p);
    return [];
  }
}

export async function addBookmark(postId: string) {
  const url = `/api/post/${encodeURIComponent(postId)}/bookmark`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...authHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`POST bookmark failed: ${res.status}`);
}

export async function removeBookmark(postId: string) {
  const url = `/api/post/${encodeURIComponent(postId)}/bookmark`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`DELETE bookmark failed: ${res.status}`);
}

// --------------- helpers: normalize shape ---------------
function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

function pickString(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const v = obj[key];
  return typeof v === 'string' ? v : undefined;
}

function pickNumber(
  obj: Record<string, unknown>,
  key: string
): number | undefined {
  const v = obj[key];
  return typeof v === 'number' ? v : undefined;
}

function pickBoolean(
  obj: Record<string, unknown>,
  key: string
): boolean | undefined {
  const v = obj[key];
  return typeof v === 'boolean' ? v : undefined;
}

function normalizePost(raw: unknown): Post | null {
  const r = asRecord(raw);
  const company = asRecord(r.company);

  const id =
    pickString(r, 'id') ??
    pickString(r, 'postId') ??
    pickString(r, 'uuid') ??
    '';
  if (!id) return null;

  const companyName =
    pickString(r, 'companyName') ?? pickString(company, 'name') ?? '';

  const positionTitle =
    pickString(r, 'positionTitle') ?? pickString(r, 'title') ?? '';

  const domain =
    pickString(r, 'domain') ??
    pickString(r, 'companyDomain') ??
    pickString(company, 'domain') ??
    '';

  const slogan = pickString(r, 'slogan') ?? pickString(r, 'subtitle');

  const headCount =
    pickNumber(r, 'headCount') ?? pickNumber(r, 'recruitmentNumber');

  const employmentEndDate =
    pickString(r, 'employmentEndDate') ??
    pickString(r, 'endDate') ??
    pickString(r, 'deadline');

  const isBookmarked =
    pickBoolean(r, 'isBookmarked') ??
    pickBoolean(r, 'bookmarked') ??
    pickBoolean(r, 'isScrapped');

  return {
    id,
    companyName,
    positionTitle,
    domain,
    slogan,
    headCount,
    employmentEndDate,
    isBookmarked,
  };
}

function normalizePaginator(raw: unknown): { lastPage: number } | undefined {
  const r = asRecord(raw);
  const fromPaginator = asRecord(r.paginator);
  const fromPageInfo = asRecord(r.pageInfo ?? r.pagination);
  const lastPage =
    pickNumber(fromPaginator, 'lastPage') ??
    pickNumber(fromPaginator, 'totalPages') ??
    pickNumber(fromPaginator, 'totalPage') ??
    pickNumber(fromPageInfo, 'totalPages') ??
    pickNumber(r, 'totalPages');
  return typeof lastPage === 'number' ? { lastPage } : undefined;
}

function parseGetPostsResponse(data: unknown): GetPostsResponse {
  const root = asRecord(data);
  const dataNode = asRecord(root.data);

  const postsNode =
    (Array.isArray(root.posts) && root.posts) ||
    (Array.isArray(dataNode.posts) && dataNode.posts) ||
    (Array.isArray(root.content) && root.content) ||
    (Array.isArray(dataNode.content) && dataNode.content) ||
    (Array.isArray(root.items) && root.items) ||
    [];

  const posts: Post[] = (postsNode as unknown[])
    .map(normalizePost)
    .filter((p): p is Post => !!p);

  const paginator =
    normalizePaginator(root) ??
    normalizePaginator(dataNode) ??
    (posts.length > 0 ? { lastPage: 1 } : undefined);

  return { posts, paginator };
}
