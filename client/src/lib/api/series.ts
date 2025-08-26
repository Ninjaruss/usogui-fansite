
import { Series } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getSeries(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Series>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/series?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch series: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Series[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getSerie(id: number): Promise<Series> {
  const response = await fetch(`${API_URL}/series/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch series');
  }
  return response.json();
}

export async function createSeries(data: Omit<Series, 'id'>): Promise<Series> {
  const response = await fetch(`${API_URL}/series`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create series');
  }
  return response.json();
}

export async function updateSeries(id: number, data: Partial<Series>): Promise<Series> {
  const response = await fetch(`${API_URL}/series/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update series');
  }
  return response.json();
}

export async function deleteSeries(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/series/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete series');
  }
  // No content expected for successful delete
}
