
import { Volume } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getVolumes(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Volume>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/volumes?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch volumes: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Volume[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getVolume(id: number): Promise<Volume> {
  const response = await fetch(`${API_URL}/volumes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch volume');
  }
  return response.json();
}

export async function createVolume(data: Omit<Volume, 'id'>): Promise<Volume> {
  const response = await fetch(`${API_URL}/volumes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create volume');
  }
  return response.json();
}

export async function updateVolume(id: number, data: Partial<Volume>): Promise<Volume> {
  const response = await fetch(`${API_URL}/volumes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update volume');
  }
  return response.json();
}

export async function deleteVolume(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/volumes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete volume');
  }
  // No content expected for successful delete
}
