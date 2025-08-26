import { Media } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getMedia(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Media>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/media?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch media: ${response.status} ${text}`);
  }

  const body = await response.json();
  // Expect the server to return the standardized paginated envelope
  // { data: T[]; total: number; page: number; totalPages: number }
  return {
    data: body.data as Media[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getMedium(id: number): Promise<Media> {
  const response = await fetch(`${API_URL}/media/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch medium');
  }
  return response.json();
}

export async function createMedium(data: Omit<Media, 'id'>): Promise<Media> {
  const response = await fetch(`${API_URL}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create medium');
  }
  return response.json();
}

export async function updateMedium(id: number, data: Partial<Media>): Promise<Media> {
  const response = await fetch(`${API_URL}/media/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update medium');
  }
  return response.json();
}

export async function deleteMedium(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/media/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete medium');
  }
  // No content expected for successful delete
}
