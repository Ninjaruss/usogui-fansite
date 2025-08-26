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
const baseDataProvider = jsonServerProvider(API_URL);

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

  getList: <R extends RaRecord = RaRecord>(resource: string, params: GetListParams): Promise<GetListResult<R>> =>
    baseDataProvider.getList<R>(resource, params).then(response => ({
      // response is expected to be the paginated envelope: { data: T[]; total: number; page, totalPages }
      data: (response.data as unknown[]).map((d: unknown) => convertKeysToCamelCase(d) as unknown as R),
      total: response.total as number,
    } as GetListResult<R>)),

  getOne: <R extends RaRecord = RaRecord>(resource: string, params: GetOneParams<R>): Promise<GetOneResult<R>> =>
    baseDataProvider.getOne<R>(resource, params).then(response => ({ data: convertKeysToCamelCase(response.data) as unknown as R } as GetOneResult<R>)),

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
