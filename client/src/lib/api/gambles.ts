
import { Gamble } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getGambles(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Gamble>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/gambles?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch gambles: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Gamble[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getGamble(id: number): Promise<Gamble> {
  const response = await fetch(`${API_URL}/gambles/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch gamble');
  }
  return response.json();
}

export async function createGamble(data: Omit<Gamble, 'id'>): Promise<Gamble> {
  const response = await fetch(`${API_URL}/gambles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create gamble');
  }
  return response.json();
}

export async function updateGamble(id: number, data: Partial<Gamble>): Promise<Gamble> {
  const response = await fetch(`${API_URL}/gambles/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update gamble');
  }
  return response.json();
}

export async function deleteGamble(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/gambles/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete gamble');
  }
  // No content expected for successful delete
}
