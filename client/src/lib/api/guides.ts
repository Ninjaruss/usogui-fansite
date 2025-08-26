
import { Guide } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getGuides(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Guide>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/guides?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch guides');
  }
  return response.json();
}

export async function getGuide(id: number): Promise<Guide> {
  const response = await fetch(`${API_URL}/guides/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch guide');
  }
  return response.json();
}

export async function createGuide(data: Omit<Guide, 'id'>): Promise<Guide> {
  const response = await fetch(`${API_URL}/guides`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create guide');
  }
  return response.json();
}

export async function updateGuide(id: number, data: Partial<Guide>): Promise<Guide> {
  const response = await fetch(`${API_URL}/guides/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update guide');
  }
  return response.json();
}

export async function deleteGuide(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/guides/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete guide');
  }
  // No content expected for successful delete
}
