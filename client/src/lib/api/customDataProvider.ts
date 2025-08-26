import jsonServerProvider from 'ra-data-json-server';
import type {
  DataProvider,
  RaRecord,
  GetListParams,
  GetListResult,
  GetOneParams,
  GetOneResult,
  GetManyParams,
  GetManyResult,
  GetManyReferenceParams,
  GetManyReferenceResult,
  UpdateParams,
  UpdateResult,
  UpdateManyParams,
  UpdateManyResult,
  CreateParams,
  CreateResult,
  DeleteParams,
  DeleteResult,
  DeleteManyParams,
  DeleteManyResult,
  Identifier,
} from 'react-admin';

import { API_URL } from './types';

const httpClient = async (url: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const existing = options.headers || {};
  const outHeaders: Record<string, string> = typeof existing === 'object' && !Array.isArray(existing)
    ? { ...(existing as Record<string, string>) }
    : {};
  if (token) outHeaders['Authorization'] = `Bearer ${token}`;
  options.headers = outHeaders;

  const response = await fetch(url, options);
  const text = await response.text();
  const responseHeaders = response.headers;
  return {
    status: response.status,
    headers: responseHeaders,
    body: text,
    json: async () => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    },
  };
};

const baseDataProvider = jsonServerProvider(API_URL, httpClient);

const convertKeysToSnakeCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(i => convertKeysToSnakeCase(i));
  const o = obj as Record<string, unknown>;
  return Object.keys(o).reduce((acc: Record<string, unknown>, key) => {
    const snake = key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);
    acc[snake] = convertKeysToSnakeCase(o[key]);
    return acc;
  }, {});
};

const convertKeysToCamelCase = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return (obj as unknown[]).map(i => convertKeysToCamelCase(i));
  const o = obj as Record<string, unknown>;
  return Object.keys(o).reduce((acc: Record<string, unknown>, key) => {
    const camel = key.replace(/_([a-z])/g, (_m, c) => c.toUpperCase());
    acc[camel] = convertKeysToCamelCase(o[key]);
    return acc;
  }, {});
};

const customDataProvider: DataProvider = {
  ...baseDataProvider,

  getList: async <R extends RaRecord = RaRecord>(resource: string, params: GetListParams): Promise<GetListResult<R>> => {
    // Build query string from react-admin params
    const page = params.pagination?.page ?? 1;
    const perPage = params.pagination?.perPage ?? 20;
    const sortField = params.sort?.field;
    const sortOrder = params.sort?.order ?? 'ASC';

    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(perPage));
    if (sortField) {
      // Server expects `sortBy` and `sortOrder` (GuideQueryDto)
      qs.set('sortBy', String(sortField));
      qs.set('sortOrder', String(sortOrder));
    }

    if (params.filter && typeof params.filter === 'object') {
      Object.entries(params.filter).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // react-admin uses `q` for full-text search; backend expects `search`
        const mappedKey = k === 'q' ? 'search' : k;
        if (Array.isArray(v)) v.forEach(item => qs.append(mappedKey, String(item)));
        else qs.set(mappedKey, String(v));
      });
    }

    const url = `${API_URL}/${resource}?${qs.toString()}`;
    // Helper to parse a successful fetch response into react-admin shape
    const parseResp = async (resp: Response): Promise<GetListResult<R> | null> => {
      let body: unknown = null;
      try { body = await resp.json(); } catch { body = null; }

      if (body && typeof body === 'object' && 'data' in (body as Record<string, unknown>) && Array.isArray((body as Record<string, unknown>).data)) {
        const obj = body as Record<string, unknown>;
        const arr = ((obj.data) as unknown[]).map(d => convertKeysToCamelCase(d) as unknown as R);
        const bodyTotal = typeof obj.total === 'number' ? Number(obj.total) : undefined;
        const headerTotal = resp.headers.get('x-total-count');
        const total = bodyTotal ?? (headerTotal ? Number(headerTotal) : arr.length);
        return { data: arr, total } as GetListResult<R>;
      }

      if (Array.isArray(body)) {
        const arr = (body as unknown[]).map(d => convertKeysToCamelCase(d) as unknown as R);
        const headerTotal = resp.headers.get('x-total-count');
        const total = headerTotal ? Number(headerTotal) : arr.length;
        return { data: arr, total } as GetListResult<R>;
      }

      return null;
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const resp = await fetch(url, { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : undefined });

    // If response is OK try to parse and return. If parsing fails, reject so react-admin handles it.
    if (resp.ok) {
      const parsed = await parseResp(resp);
      if (parsed) return parsed;
      // Unknown shape — don't delegate to the strict base provider (it throws on missing headers).
      throw new Error(`Unexpected response shape from ${resource}`);
    }

    // If not OK and it's 401, attempt one refresh and retry once. Otherwise reject with status to let authProvider handle it.
    if (resp.status === 401) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
        if (refreshRes.ok) {
          const b = await refreshRes.json().catch(() => null);
          const newToken = b?.access_token ?? null;
          if (newToken && typeof window !== 'undefined') localStorage.setItem('authToken', newToken);

          const tokenAfter = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
          const retryResp = await fetch(url, { credentials: 'include', headers: tokenAfter ? { Authorization: `Bearer ${tokenAfter}` } : undefined });
          if (retryResp.ok) {
            const parsed = await parseResp(retryResp);
            if (parsed) return parsed;
            throw new Error(`Unexpected response shape from ${resource} after refresh`);
          }
          // If retry failed, fall through to reject with its status
          throw new Error(`Failed to fetch ${resource}: ${retryResp.status}`);
        }
      } catch (_refreshErr) {
        // swallow and fall through to reject as unauthorized
      }
    }

    // Non-OK response (non-401 or failed refresh): reject so react-admin/authProvider reacts (e.g., redirect to login)
  const err = new Error(`Failed to fetch ${resource}: ${resp.status}`) as Error & { status?: number };
  err.status = resp.status;
    throw err;
  },
  
  getOne: <R extends RaRecord = RaRecord>(resource: string, params: GetOneParams<R>): Promise<GetOneResult<R>> =>
    baseDataProvider.getOne<R>(resource, params).then(response => {
      let data = convertKeysToCamelCase(response.data) as unknown as Record<string, unknown> | null;
      if (!data) data = {};
      // Ensure there's an `id` property; some endpoints return `<resource>_id` or `user_id` etc.
      if (!('id' in data)) {
        const fallbackKey = Object.keys(data).find(k => k.toLowerCase().endsWith('_id') || k.toLowerCase().endsWith('id'));
        if (fallbackKey) {
          const record = data as Record<string, unknown>;
          const val = record[fallbackKey];
          if (val !== undefined) {
            // react-admin Identifier is string | number; cast to Identifier for typing
            data.id = val as Identifier;
          }
        }
      }
      return ({ data: data as unknown as R } as GetOneResult<R>);
    }),

  getMany: <R extends RaRecord = RaRecord>(resource: string, params: GetManyParams<R>): Promise<GetManyResult<R>> =>
  baseDataProvider.getMany<R>(resource, params).then(response => ({ data: (response.data as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R) } as GetManyResult<R>)),

  getManyReference: <R extends RaRecord = RaRecord>(resource: string, params: GetManyReferenceParams): Promise<GetManyReferenceResult<R>> =>
    baseDataProvider.getManyReference<R>(resource, params).then(response => ({
      data: (response.data as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R),
      total: response.total as number,
    } as GetManyReferenceResult<R>)),

  update: <R extends RaRecord = RaRecord>(resource: string, params: UpdateParams<R>): Promise<UpdateResult<R>> => {
    const data = convertKeysToSnakeCase(params.data) as unknown as Partial<R>;
    return baseDataProvider.update<R>(resource, { ...params, data } as UpdateParams<R>)
      .then(response => ({ data: convertKeysToCamelCase(response.data) as unknown as R } as UpdateResult<R>));
  },

  updateMany: <R extends RaRecord = RaRecord>(resource: string, params: UpdateManyParams<R>): Promise<UpdateManyResult<R>> => {
    const ids = (params.ids || []) as Identifier[];
    const data = params.data ? (convertKeysToSnakeCase(params.data) as unknown as Partial<R>) : undefined;
    const safeParams = { ids, data } as UpdateManyParams<R>;
    return baseDataProvider.updateMany<R>(resource, safeParams)
      .then(response => ({ data: (response.data || []) as unknown as R['id'][] } as UpdateManyResult<R>));
  },

  create: <R extends Omit<RaRecord, 'id'> = Omit<RaRecord, 'id'>, T extends RaRecord = R & { id: Identifier }>(resource: string, params: CreateParams<R>): Promise<CreateResult<T>> => {
    const data = convertKeysToSnakeCase(params.data) as unknown as R;
    return baseDataProvider.create<T>(resource, { ...params, data } as CreateParams<R>)
      .then(response => ({ data: convertKeysToCamelCase(response.data) as unknown as T } as CreateResult<T>));
  },

  delete: <R extends RaRecord = RaRecord>(resource: string, params: DeleteParams<R>): Promise<DeleteResult<R>> =>
    baseDataProvider.delete<R>(resource, params).then(response => ({ data: convertKeysToCamelCase(response.data) as unknown as R } as DeleteResult<R>)),

  deleteMany: <R extends RaRecord = RaRecord>(resource: string, params: DeleteManyParams<R>): Promise<DeleteManyResult<R>> =>
    baseDataProvider.deleteMany<R>(resource, params).then(response => ({ data: (response.data || []).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R['id']) } as DeleteManyResult<R>)),
};

export default customDataProvider;
