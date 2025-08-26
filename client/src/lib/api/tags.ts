
import { Tag } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getTags(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Tag>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/tags?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch tags: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Tag[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getTag(id: number): Promise<Tag> {
  const response = await fetch(`${API_URL}/tags/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tag');
  }
  return response.json();
}

export async function createTag(data: Omit<Tag, 'id'>): Promise<Tag> {
  const response = await fetch(`${API_URL}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create tag');
  }
  return response.json();
}

export async function updateTag(id: number, data: Partial<Tag>): Promise<Tag> {
  const response = await fetch(`${API_URL}/tags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update tag');
  }
  return response.json();
}

export async function deleteTag(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/tags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete tag');
  }
  // No content expected for successful delete
}
