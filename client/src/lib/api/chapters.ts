
import { Chapter } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getChapters(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Chapter>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/chapters?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch chapters');
  }
  return response.json();
}

export async function getChapter(id: number): Promise<Chapter> {
  const response = await fetch(`${API_URL}/chapters/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch chapter');
  }
  return response.json();
}

export async function createChapter(data: Omit<Chapter, 'id'>): Promise<Chapter> {
  const response = await fetch(`${API_URL}/chapters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create chapter');
  }
  return response.json();
}

export async function updateChapter(id: number, data: Partial<Chapter>): Promise<Chapter> {
  const response = await fetch(`${API_URL}/chapters/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update chapter');
  }
  return response.json();
}

export async function deleteChapter(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/chapters/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete chapter');
  }
  // No content expected for successful delete
}
