"use client";

import { DataProvider } from 'react-admin';
import { PaginatedResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Utility functions for key conversion
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertKeysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToCamelCase);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      converted[camelKey] = convertKeysToCamelCase(obj[key]);
    }
  }
  return converted;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertKeysToSnakeCase);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const converted: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      converted[snakeKey] = convertKeysToSnakeCase(obj[key]);
    }
  }
  return converted;
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // If we get a 401, try to refresh the token once
  if (response.status === 401) {
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('authToken', refreshData.access_token);
        localStorage.setItem('authUser', JSON.stringify(refreshData.user));

        // Retry the original request with the new token
        const newToken = refreshData.access_token;
        const newHeaders = {
          ...headers,
          'Authorization': `Bearer ${newToken}`,
        };

        return fetch(url, {
          ...options,
          headers: newHeaders,
          credentials: 'include',
        });
      }
    } catch {
      // Refresh failed, continue with original error
    }
  }

  return response;
}

export const customDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};
    const snakeField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    let url = `${API_URL}/${resource}?page=${page}&perPage=${perPage}&sort=${snakeField}&order=${order}`;

    // Add filter parameters
    if (params.filter) {
      const snakeFilter = convertKeysToSnakeCase(params.filter);
      Object.entries(snakeFilter).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url += `&${key}=${encodeURIComponent(String(value))}`;
        }
      });
    }

    const response = await fetchWithAuth(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: PaginatedResponse<any> = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData.data,
      total: camelData.total,
      pageInfo: {
        hasNextPage: page * perPage < camelData.total,
        hasPreviousPage: page > 1,
      },
    };
  },

  getOne: async (resource, params) => {
    const response = await fetchWithAuth(`${API_URL}/${resource}/${params.id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource} with id ${params.id}`);
    }

    const data = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData,
    };
  },

  getMany: async (resource, params) => {
    const ids = params.ids.join(',');
    const response = await fetchWithAuth(`${API_URL}/${resource}?id=${ids}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource} with ids ${ids}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: PaginatedResponse<any> = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData.data,
    };
  },

  getManyReference: async (resource, params) => {
    const { page = 1, perPage = 10 } = params.pagination || {};
    const { field = 'id', order = 'ASC' } = params.sort || {};
    const snakeField = field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    const snakeTarget = params.target.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

    const url = `${API_URL}/${resource}?page=${page}&perPage=${perPage}&sort=${snakeField}&order=${order}&${snakeTarget}=${params.id}`;

    const response = await fetchWithAuth(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${resource} references`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: PaginatedResponse<any> = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData.data,
      total: camelData.total,
      pageInfo: {
        hasNextPage: page * perPage < camelData.total,
        hasPreviousPage: page > 1,
      },
    };
  },

  create: async (resource, params) => {
    const snakeData = convertKeysToSnakeCase(params.data);
    const response = await fetchWithAuth(`${API_URL}/${resource}`, {
      method: 'POST',
      body: JSON.stringify(snakeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to create ${resource}`);
    }

    const data = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData,
    };
  },

  update: async (resource, params) => {
    const snakeData = convertKeysToSnakeCase(params.data);
    const response = await fetchWithAuth(`${API_URL}/${resource}/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(snakeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to update ${resource}`);
    }

    const data = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData,
    };
  },

  updateMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map(id =>
        fetchWithAuth(`${API_URL}/${resource}/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(convertKeysToSnakeCase(params.data)),
        })
      )
    );

    const failed = responses.filter(r => !r.ok);
    if (failed.length > 0) {
      throw new Error(`Failed to update some ${resource}`);
    }

    return {
      data: params.ids,
    };
  },

  delete: async (resource, params) => {
    const response = await fetchWithAuth(`${API_URL}/${resource}/${params.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to delete ${resource}`);
    }

    const data = await response.json();
    const camelData = convertKeysToCamelCase(data);

    return {
      data: camelData,
    };
  },

  deleteMany: async (resource, params) => {
    const responses = await Promise.all(
      params.ids.map(id =>
        fetchWithAuth(`${API_URL}/${resource}/${id}`, {
          method: 'DELETE',
        })
      )
    );

    const failed = responses.filter(r => !r.ok);
    if (failed.length > 0) {
      throw new Error(`Failed to delete some ${resource}`);
    }

    return {
      data: params.ids,
    };
  },
};
